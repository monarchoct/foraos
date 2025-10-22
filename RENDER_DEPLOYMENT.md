# Render Deployment Guide

## Render Configuration

Update your Render static site configuration with these settings:

### Build Settings:
- **Build Command**: `npm run web-build`
- **Publish Directory**: `dist`

### Environment Variables:
Make sure these are set in your Render dashboard:
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_BASE_URL` - https://api.openai.com/v1 (or your custom endpoint)
- `OPENAI_MODEL` - gpt-3.5-turbo (or your preferred model)
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key
- `ELEVENLABS_BASE_URL` - https://api.elevenlabs.io/v1
- `ELEVENLABS_VOICE_ID` - Your ElevenLabs voice ID

## How It Works

1. **Environment Variables**: The app now reads API keys from Render's environment variables
2. **Build Process**: `npm run web-build` creates the `dist` folder with all assets
3. **Static Deployment**: Render serves the built files from the `dist` directory
4. **API Calls**: The app makes direct API calls to OpenAI/ElevenLabs using the environment variables

## Changes Made

- Updated `vite.config.js` to expose environment variables to the client
- Modified `speech-planner.js` to use `process.env` variables instead of config files
- App now works with Render's environment variable system

## Testing Locally

To test with environment variables locally, create a `.env` file:
```
OPENAI_API_KEY=your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
ELEVENLABS_API_KEY=your-key-here
ELEVENLABS_BASE_URL=https://api.elevenlabs.io/v1
ELEVENLABS_VOICE_ID=your-voice-id
```

Then run: `npm run web-dev`
