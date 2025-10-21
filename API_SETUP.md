# 🔑 API Key Setup Guide

## Quick Setup (Recommended)

1. **Open the API Configuration page**: Go to `api-config.html` in your browser
2. **Enter your API keys**:
   - Get OpenAI API key from: https://platform.openai.com/api-keys
   - Get ElevenLabs API key from: https://elevenlabs.io/app/settings/api-keys
3. **Click "Save API Keys"** - they're stored locally in your browser
4. **Test your keys** by clicking "Test Keys"
5. **Go back to the main application** - everything should work now!

## Alternative Setup Methods

### Method 1: Environment Variables
1. Copy `env.example` to `.env`
2. Replace the placeholder values with your actual API keys
3. Restart the proxy server: `node proxy-server.js`

### Method 2: Browser Console
Open browser console and run:
```javascript
window.API_KEYS = {
    openai: { apiKey: "your-openai-key-here" },
    elevenlabs: { apiKey: "your-elevenlabs-key-here" }
};
```

## Troubleshooting

### "API key not configured" Error
- Make sure you've set your API keys using one of the methods above
- Check the browser console for detailed debugging info
- Try refreshing the page after setting API keys

### Proxy Server Issues
- Make sure the proxy server is running: `node proxy-server.js`
- Check if port 3001 is available
- Test the proxy: visit `http://localhost:3001/health`

### CORS Issues
- The proxy server handles CORS for OpenAI API calls
- ElevenLabs API calls go directly from the browser
- Make sure your API keys are valid and have proper permissions

## Security Notes

- ✅ API keys are stored locally in your browser only
- ✅ No API keys are committed to git
- ✅ Keys are not sent to our servers
- ⚠️ Never share your API keys with anyone
- ⚠️ Keys are stored in browser localStorage (clear them if needed)

## Getting API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-`)

### ElevenLabs API Key
1. Go to https://elevenlabs.io/app/settings/api-keys
2. Sign in to your ElevenLabs account
3. Copy your API key (starts with `sk_`)

## Support

If you're still having issues:
1. Check the browser console for error messages
2. Make sure both API keys are valid and active
3. Verify the proxy server is running
4. Try the test buttons in `api-config.html`
