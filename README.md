# Ollama Commit Generator

An example VS Code extension that adds a Source Control title action for generating commit messages with local Ollama models.

## Installation

### Installing Ollama via Docker

1. Ensure Docker is installed on your system. If not, download and install Docker from [docker.com](https://www.docker.com/).

2. Pull the Ollama Docker image:
   ```bash
   docker pull ollama/ollama
   ```

3. Run the Ollama container:
   ```bash
   docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
   ```

4. Pull the Mistral model inside the container:
   ```bash
   docker exec -it ollama ollama pull mistral
   ```

### Configuring the Extension

1. In VS Code, open the settings (Ctrl+,).
2. Search for "Ollama Commit".
3. Set `ollamaCommit.endpoint` to `http://localhost:11434` (the default Ollama endpoint).
4. Optionally, set `ollamaCommit.ollamaPath` if using local CLI, but for Docker setup, the endpoint is sufficient.

## Features

- Adds a button in the SCM title bar for generating commit messages.
- Adds a second title action to choose the local Ollama model.
- Uses local `ollama` CLI or a configured Ollama HTTP endpoint to list models and generate text.

## Usage

1. Open a Git workspace.
2. Click the `Generate Commit Message` button in the Source Control title bar.
3. If needed, use `Choose Ollama Model` first to pick a model.

## Requirements

- `ollama` must be installed and available on your PATH, or configured via `ollamaCommit.ollamaPath`.
- If Ollama is running inside a container, set `ollamaCommit.endpoint` to the container's HTTP endpoint (for example `http://localhost:11434`).
- For authenticated endpoints, set `ollamaCommit.apiKey` or `OLLAMA_API_KEY`.
- The workspace must be inside a Git repository.
