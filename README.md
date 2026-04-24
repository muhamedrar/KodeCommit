# LlamaCommit

LlamaCommit is a VS Code extension that generates Git commit messages directly from the Source Control view. It uses the OpenAI-compatible API format, which means it works with a wide range of providers — local or hosted.

## What it does

- Adds a `Generate Commit Message` action to the SCM title bar.
- Adds a gear button for provider setup without leaving Source Control.
- Supports any provider that exposes an OpenAI-compatible API.
- Stores API keys in VS Code Secret Storage.
- Remembers model selection between sessions.
- Falls back to opening a `git-commit` document if the SCM input box cannot be filled automatically.

## How it works

LlamaCommit uses a single OpenAI-compatible provider. You configure the base URL and API key to point at whichever service you want to use. This keeps the extension simple and works with any provider that supports the OpenAI API format.

## Supported providers

Any provider that exposes an OpenAI-compatible API works with LlamaCommit. Below are common examples.

### OpenAI

- Base URL: `https://api.openai.com/v1`
- Requires an OpenAI API key.

### Ollama (local)

- Base URL: `http://localhost:11434/v1`
- No API key required for local use.
- Make sure Ollama is running and you have at least one model pulled.

### Cohere

- Base URL: `https://api.cohere.com/compatibility/v1`
- Requires a Cohere API key.

### Kimi (Moonshot)

- Base URL: `https://api.moonshot.cn/v1`
- Requires a Moonshot API key.

### Claude (Anthropic)

- Base URL: `https://api.anthropic.com/v1`
- Requires an Anthropic API key.
- Note: Anthropic's OpenAI compatibility layer may require setting the model manually.

> Any other provider with an OpenAI-compatible endpoint works the same way — just set the base URL and API key accordingly.

## Source Control actions

The extension adds two buttons to the Source Control title bar:

- `Generate Commit Message`: runs the active provider against the current Git diff.
- `AI Settings`: opens the persistent provider settings menu.

The settings menu stays open until you explicitly close it or dismiss it with `Esc`, so you can change the API key, base URL, and model in one session.

## Settings menu actions

The gear menu lets you:

- Choose a model from the provider
- Enter a model manually
- Edit the commit instructions template
- Set or clear the API key
- Set the base URL
- Close the menu when you are done

## Prompt template customization

The commit-generation instructions are stored in:

- [`templates/commit-template.txt`](templates/commit-template.txt)

This makes it easier to edit the prompt without touching the extension code.

The file uses two sections:

```text
[SYSTEM]
...
[/SYSTEM]

[USER]
...
{{diff}}
[/USER]
```

`{{diff}}` is replaced with the current Git diff before the request is sent to the provider.

If the template file is missing or malformed, the extension falls back to a built-in default template.

## Installation

### Install the extension

1. Clone or open this project in VS Code.
2. Package it as a VSIX if needed:
```bash
   npm run package-vsix
```
3. Install the VSIX in VS Code, or run the extension in Extension Development Host mode.

### Optional: run Ollama with Docker

1. Ensure Docker is installed.
2. Pull the image:
```bash
   docker pull ollama/ollama
```
3. Start the container:
```bash
   docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```
4. Pull a model inside the container:
```bash
   docker exec -it ollama ollama pull mistral
```
5. In LlamaCommit, set the base URL to `http://localhost:11434/v1`.

## Quick start

1. Open a Git repository in VS Code.
2. Open the Source Control view.
3. Click the gear button.
4. Set the base URL for your provider.
5. Add the API key if required.
6. Choose a model or enter one manually.
7. Close the settings menu.
8. Click `Generate Commit Message`.

## How commit generation works

1. The extension detects the current Git repository.
2. It reads the staged diff first.
3. If there is no staged diff, it reads the unstaged diff.
4. It builds the request from the prompt template.
5. It asks the provider for a single-line commit message.
6. It normalizes the returned text.
7. It writes the message into the SCM commit input box when possible.
8. If that fails, it opens a `git-commit` document with the generated message.

## Requirements

- A Git repository must be open in the current workspace.
- The configured endpoint must expose OpenAI-compatible routes.
- An API key is required for most hosted providers.

## Architecture

The codebase is structured to stay easy to maintain and extend:

- Provider logic in `src/providers`
- Provider state and secret helpers in `src/state.js`
- Command/UI flow in `src/commands.js`
- Prompt loading and commit normalization in `src/commit.js`
- Editable prompt template in `templates/commit-template.txt`

## Troubleshooting

### No models are listed

- Confirm the provider is reachable.
- Confirm the API key is set when required.
- Use manual model entry if the provider does not return a model list.

### The commit message is not inserted into SCM

The extension first tries to write into the built-in Git extension input box. If that is not available, it opens a `git-commit` document instead.

### The prompt needs tweaking

Edit `templates/commit-template.txt`, then rerun commit generation. The template is read from disk on each generation request.