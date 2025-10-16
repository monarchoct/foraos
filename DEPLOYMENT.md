# ForaOS Proxy Server Deployment

This guide helps you deploy the ForaOS CORS proxy server to Railway so your GitHub Pages site can make OpenAI API calls.

## Quick Deploy to Railway

### Option 1: Railway CLI (Recommended)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Create new project:**
   ```bash
   railway new
   ```

4. **Deploy the proxy server:**
   ```bash
   railway up --service proxy
   ```

### Option 2: Railway Web Dashboard

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your ForaOS repository**
6. **Configure the service:**
   - **Root Directory**: Leave empty (deploy from root)
   - **Build Command**: (leave empty)
   - **Start Command**: `node railway-proxy.js`
   - **Environment Variables**: None needed

## After Deployment

1. **Get your Railway URL** (something like `https://foraos-proxy-production.up.railway.app`)

2. **Update your frontend code** in `js/heart/core/speech-planner.js`:
   ```javascript
   // Change from:
   const apiUrl = 'http://localhost:3001/api/openai/v1/chat/completions';
   
   // To:
   const apiUrl = 'https://YOUR_RAILWAY_URL/api/openai/v1/chat/completions';
   ```

3. **Commit and push the changes:**
   ```bash
   git add .
   git commit -m "Update API URL to use Railway proxy"
   git push
   ```

## Files for Deployment

- `railway-proxy.js` - Main proxy server file
- `railway-package.json` - Package configuration for Railway

## Testing

Once deployed, test the proxy:
- **Health check**: `https://YOUR_RAILWAY_URL/health`
- **Should return**: `{"status":"OK","message":"ForaOS Proxy server is running"}`

## Cost

Railway offers:
- **Free tier**: 500 hours/month (enough for personal use)
- **Paid plans**: Start at $5/month for unlimited usage

## Troubleshooting

If deployment fails:
1. Check Railway logs in the dashboard
2. Ensure Node.js version is 18+ (Railway will auto-detect)
3. Verify the start command is `node railway-proxy.js`
