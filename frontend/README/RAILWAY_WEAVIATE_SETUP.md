# Railway Self-Managed Weaviate Setup

This guide will help you deploy Weaviate as a separate Railway service for your coffee roasting app.

## 🚀 Deployment Steps

### Step 1: Create Weaviate Service on Railway

1. **Go to Railway Dashboard**:
   - Visit [railway.app](https://railway.app)
   - Click "New Project"
   - Choose "Deploy from GitHub repo" or "Empty Project"

2. **Deploy the Weaviate Service**:
   - If using GitHub: Connect your repo and set the root directory to `backend/RAG_system/weaviate/railway-deploy/`
   - If using empty project: Upload the contents of the `backend/RAG_system/weaviate/railway-deploy/` folder
   - Railway will automatically detect the Dockerfile and deploy

3. **Wait for Deployment**:
   - Railway will build and deploy Weaviate
   - This takes 2-3 minutes
   - Check the logs to ensure it starts successfully

### Step 2: Get Your Weaviate URL

1. **Copy the Service URL**:
   - Once deployed, Railway will show a URL like:
   - `https://weaviate-production-xxxx.up.railway.app`
   - Copy this URL

### Step 3: Update Your Main Backend

1. **Go to your main backend service** (roast-backend)
2. **Add Environment Variable**:
   - Go to "Variables" tab
   - Add new variable:
   - **Key**: `WEAVIATE_URL`
   - **Value**: `https://your-weaviate-url.up.railway.app`

3. **Redeploy your backend**:
   - Railway will automatically redeploy when you add the environment variable
   - Or trigger a manual redeploy

### Step 4: Verify Setup

1. **Check Weaviate Health**:
   ```bash
   curl https://your-weaviate-url.up.railway.app/v1/meta
   ```
   Should return Weaviate metadata

2. **Check Backend Logs**:
   - Look for "✅ Weaviate client connected successfully" in your backend logs

## 🔧 Configuration

### Environment Variables

**Weaviate Service** (automatically set by Railway):
- `PORT` - Railway assigns this
- `RAILWAY_ENVIRONMENT` - Set to "production"

**Main Backend Service** (you need to add):
- `WEAVIATE_URL` - Your Weaviate service URL

### Weaviate Settings

The Weaviate instance is configured with:
- Anonymous access enabled (no authentication required)
- OpenAI, Cohere, and HuggingFace modules enabled
- No default vectorizer (you specify per query)
- 25 item default query limit

## 🐛 Troubleshooting

### Weaviate Service Issues

1. **Service won't start**:
   - Check Railway logs for error messages
   - Ensure Dockerfile is in the correct location
   - Verify Railway has enough resources

2. **Health check failing**:
   - Check if Weaviate is accessible at `/v1/meta`
   - Look for port binding issues in logs

### Backend Connection Issues

1. **"Weaviate not available"**:
   - Verify `WEAVIATE_URL` environment variable is set
   - Check the URL is accessible from your browser
   - Ensure no trailing slash in the URL

2. **CORS errors**:
   - Weaviate doesn't need CORS configuration
   - Backend handles all CORS for frontend requests

### Performance Issues

1. **Slow vector searches**:
   - Railway has resource limits
   - Consider upgrading Railway plan for more CPU/memory
   - Monitor Railway metrics for resource usage

2. **Memory issues**:
   - Weaviate can be memory-intensive
   - Consider using Weaviate Cloud Services for better performance

## 💰 Cost Considerations

- **Railway Free Tier**: Limited resources, may affect performance
- **Railway Pro**: Better performance, more reliable
- **Alternative**: Weaviate Cloud Services ($25+/month but much better performance)

## 🔄 Scaling

- Railway will automatically restart the service if it crashes
- For better performance, consider upgrading Railway plan
- For production use, Weaviate Cloud Services is recommended

## 📝 Next Steps

1. Deploy the Weaviate service
2. Update your backend with the Weaviate URL
3. Test semantic search functionality
4. Monitor performance and consider upgrades if needed
