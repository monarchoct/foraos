import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

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
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'config/**/*',
          dest: 'config'
        },
        {
          src: 'models/**/*',
          dest: 'models'
        },
        {
          src: 'backgrounds/**/*',
          dest: 'backgrounds'
        },
        {
          src: 'icons/**/*',
          dest: 'icons'
        },
        {
          src: 'js/**/*',
          dest: 'js'
        },
        {
          src: 'styles.css',
          dest: '.'
        },
        {
          src: 'CNAME',
          dest: '.'
        },
        {
          src: 'public/**/*',
          dest: '.'
        }
      ]
    })
  ],
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
