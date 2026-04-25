const { requestJson } = require('../http');

const GENERATION_HINTS = [
  /\bchat\b/i,
  /\bcompletion\b/i,
  /\bgenerate\b/i,
  /\bgeneration\b/i,
  /\btext_generation\b/i,
  /\btext-output\b/i
];

const NON_GENERATION_HINTS = [
  /\bembed(ding|s)?\b/i,
  /\brerank(ing)?\b/i,
  /\bmoderation\b/i,
  /\btranscri(pt|ption)\b/i,
  /\bwhisper\b/i,
  /\btext-to-speech\b/i,
  /\btts\b/i,
  /\bimage_generation\b/i,
  /\bimage-generation\b/i
];

function joinUrl(baseUrl, path) {
  return `${String(baseUrl || '').replace(/\/+$/, '')}/${String(path || '').replace(/^\/+/, '')}`;
}

function parseModelList(response) {
  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.models)) {
    return response.models;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
}

function getModelValue(item) {
  if (typeof item === 'string') {
    return item.trim();
  }

  if (!item || typeof item !== 'object') {
    return '';
  }

  return String(item.id || item.name || item.model || '').trim();
}

function flattenStrings(value) {
  if (typeof value === 'string') {
    return [value.trim()];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenStrings).filter(Boolean);
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(flattenStrings).filter(Boolean);
  }

  return [];
}

function getCapabilityHints(item) {
  if (!item || typeof item !== 'object') {
    return [];
  }

  return [
    item.type,
    item.object,
    item.category,
    item.mode,
    item.capabilities,
    item.tasks,
    item.supported_generation_methods,
    item.supported_modalities,
    item.input_modalities,
    item.output_modalities,
    item.architecture,
    item.endpoints
  ]
    .flatMap(flattenStrings)
    .map(value => value.toLowerCase())
    .filter(Boolean);
}

function hasHint(hints, patterns) {
  return hints.some(hint => patterns.some(pattern => pattern.test(hint)));
}

function hasTextOutput(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const outputHints = flattenStrings([
    item.output_modalities,
    item.architecture && item.architecture.output_modalities
  ]).map(value => value.toLowerCase());

  return outputHints.some(value => value === 'text' || value === 'text-output');
}

function isGenerationCapableModel(item, value) {
  const hints = getCapabilityHints(item);

  if (hasTextOutput(item) || hasHint(hints, GENERATION_HINTS)) {
    return true;
  }

  if (hasHint(hints, NON_GENERATION_HINTS)) {
    return false;
  }

  return !NON_GENERATION_HINTS.some(pattern => pattern.test(value));
}

function normalizeModelItem(item) {
  const value = getModelValue(item);
  if (!value) {
    return null;
  }

  return {
    label: value,
    value
  };
}

function extractTextPart(contentPart) {
  if (typeof contentPart === 'string') {
    return contentPart;
  }

  if (contentPart && typeof contentPart.text === 'string') {
    return contentPart.text;
  }

  if (contentPart && contentPart.type === 'text' && typeof contentPart.content === 'string') {
    return contentPart.content;
  }

  return '';
}

function extractChatCompletionText(response) {
  const choice = Array.isArray(response.choices) ? response.choices[0] : null;
  if (!choice) {
    return '';
  }

  if (typeof choice.text === 'string') {
    return choice.text;
  }

  const message = choice.message || {};
  if (typeof message.content === 'string') {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content.map(extractTextPart).join('');
  }

  return '';
}

function createOpenAICompatibleProvider(definition) {
  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    defaultConfig: { ...(definition.defaultConfig || {}) },
    legacyConfigIds: Array.isArray(definition.legacyConfigIds) ? definition.legacyConfigIds.slice() : [],
    legacySecretIds: Array.isArray(definition.legacySecretIds) ? definition.legacySecretIds.slice() : [],
    apiKeyEnvironmentVariables: Array.isArray(definition.apiKeyEnvironmentVariables)
      ? definition.apiKeyEnvironmentVariables.slice()
      : [],
    supportsModelListing: true,
    supportsManualModelEntry: true,
    supportsApiKey: true,
    supportsBaseUrl: definition.supportsBaseUrl !== false,
    supportsExecutablePath: false,
    requiresApiKey: Boolean(definition.requiresApiKey),
    async listModels(config) {
      if (definition.requiresApiKey && !config.apiKey) {
        throw new Error(`Add an API key for ${definition.label} first.`);
      }

      const response = await requestJson(joinUrl(config.baseUrl, 'models'), {
        headers: {
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
        }
      });

      const models = parseModelList(response)
        .filter(item => isGenerationCapableModel(item, getModelValue(item).toLowerCase()))
        .map(normalizeModelItem)
        .filter(Boolean)
        .sort((left, right) => left.label.localeCompare(right.label));

      if (!models.length) {
        throw new Error(`No generation-capable models were returned by ${definition.label}.`);
      }

      return models;
    },
    async generateCommitMessage(config, prompt) {
      if (!config.model) {
        throw new Error(`Choose a model for ${definition.label} first.`);
      }

      if (definition.requiresApiKey && !config.apiKey) {
        throw new Error(`Add an API key for ${definition.label} first.`);
      }

      const response = await requestJson(joinUrl(config.baseUrl, 'chat/completions'), {
        method: 'POST',
        headers: {
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
        },
        body: {
          model: config.model,
          messages: [
            {
              role: 'system',
              content: prompt.systemInstruction
            },
            {
              role: 'user',
              content: prompt.userPrompt
            }
          ]
        }
      });

      const text = extractChatCompletionText(response).trim();
      if (!text) {
        throw new Error(`${definition.label} returned an empty response.`);
      }

      return text;
    }
  };
}

module.exports = {
  createOpenAICompatibleProvider
};
