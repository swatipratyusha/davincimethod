# ChainIndexed Frontend Setup

## Environment Variables Setup

Create a `.env` file in the frontend directory with the following variables:

```env
# Pinata API Keys (for IPFS uploads)
REACT_APP_PINATA_API_KEY=your_pinata_api_key_here
REACT_APP_PINATA_SECRET_KEY=your_pinata_secret_key_here

# OpenAI API Key (for embeddings)
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

## Getting API Keys

### Pinata API Keys
1. Go to [Pinata](https://pinata.cloud/)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new API key
5. Copy the API Key and Secret Key

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in to your account
3. Go to API Keys section
4. Create a new API key
5. Copy the API key

## Features Enabled

### With API Keys:
- ✅ Real PDF text extraction
- ✅ Real embedding generation using OpenAI
- ✅ Real IPFS uploads using Pinata
- ✅ Automatic embedding storage

### Without API Keys (Fallback):
- ⚠️ Mock PDF text extraction
- ⚠️ Mock embedding generation
- ⚠️ Mock IPFS uploads
- ✅ Still functional for testing

## Testing

1. Start the development server: `npm start`
2. Connect your MetaMask wallet
3. Try submitting a PDF paper
4. Check the console for any API key warnings

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- API keys are only used on the frontend for direct API calls
- Consider using a backend service for production to keep API keys secure 