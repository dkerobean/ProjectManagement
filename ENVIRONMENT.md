# Environment Setup

## Getting Started

1. **Copy the environment template:**
   ```bash
   cp .env.example.template .env
   ```

2. **Add your API keys to `.env`:**
   - Replace the placeholder values with your actual API keys
   - The `.env` file is in `.gitignore` and will not be committed

## Required API Keys

### Anthropic (Required for Claude models)
- Get your key from: https://console.anthropic.com/
- Format: `ANTHROPIC_API_KEY=sk-ant-api03-...`

### OpenAI (Optional for GPT models)
- Get your key from: https://platform.openai.com/api-keys
- Format: `OPENAI_API_KEY=sk-proj-...`

## Optional API Keys

- **Perplexity**: For research features - https://www.perplexity.ai/
- **Google**: For Gemini models - https://console.cloud.google.com/
- **Mistral**: For Mistral AI models - https://console.mistral.ai/
- **xAI**: For xAI models - https://console.x.ai/
- **Azure OpenAI**: Requires endpoint configuration in `.taskmasterconfig`
- **Ollama**: Only needed for remote servers requiring authentication

## Security Notes

- Never commit real API keys to version control
- The `.env` file is automatically ignored by git
- Use the `.env.example.template` as a reference for required variables
