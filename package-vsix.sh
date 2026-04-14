#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Packaging Ollama Commit Generator VSIX..."

if command -v npx >/dev/null 2>&1; then
  set +o pipefail
  printf 'y\n' | npx @vscode/vsce package --allow-star-activation
  set -o pipefail
else
  echo "Error: npx is required to package the extension." >&2
  exit 1
fi

echo "Packaged: $(pwd)/ollama-commit-generator-0.0.1.vsix"
