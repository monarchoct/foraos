import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    // Make environment variables available to the client
    'process.env.OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY),
    'process.env.OPENAI_BASE_URL': JSON.stringify(process.env.OPENAI_BASE_URL),
    'process.env.OPENAI_MODEL': JSON.stringify(process.env.OPENAI_MODEL),
    'process.env.ELEVENLABS_API_KEY': JSON.stringify(process.env.ELEVENLABS_API_KEY),
    'process.env.ELEVENLABS_BASE_URL': JSON.stringify(process.env.ELEVENLABS_BASE_URL),
    'process.env.ELEVENLABS_VOICE_ID': JSON.stringify(process.env.ELEVENLABS_VOICE_ID),
  },
  server: {
    proxy: {
      '/api/chat': {
        target: 'https://api.openai.com/v1/chat',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward the Authorization header from the frontend request
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      }
    }
  }
})
