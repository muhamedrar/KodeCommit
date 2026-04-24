const { createOpenAICompatibleProvider } = require('./openaiCompatible');

const providers = [
  createOpenAICompatibleProvider({
    id: 'openai-compatible',
    label: 'OpenAI API',
    description: 'Use any OpenAI-compatible endpoint by changing the base URL, including OpenAI and Ollama.',
    requiresApiKey: false
  }),
];

function getProviders() {
  return providers.slice();
}

function getProvider(providerId) {
  return providers.find(provider => provider.id === providerId);
}

module.exports = {
  getProvider,
  getProviders
};
