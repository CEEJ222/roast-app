# Weaviate Railway Service

This is a separate Railway service running Weaviate vector database for the Roast Buddy app.

## Deployment Instructions

1. **Create a new Railway project**:
   - Go to [Railway](https://railway.app)
   - Create a new project
   - Choose "Deploy from GitHub repo" or "Deploy from template"

2. **Deploy this directory**:
   - Point Railway to this `weaviate-railway` directory
   - Railway will automatically detect the Dockerfile

3. **Get the service URL**:
   - Once deployed, Railway will give you a URL like `https://weaviate-production-xxxx.up.railway.app`
   - Copy this URL

4. **Update your main backend**:
   - Add environment variable to your main Railway service:
   - `WEAVIATE_URL=https://your-weaviate-url.up.railway.app`

## Environment Variables

Railway will automatically set these:
- `PORT` - Railway assigns this automatically
- `RAILWAY_ENVIRONMENT` - Set to "production"

## Health Check

The service includes a health check at `/v1/meta` that Railway will use to monitor the service.

## Troubleshooting

- Check Railway logs if the service fails to start
- Ensure the PORT environment variable is being used
- Verify Weaviate is accessible at the provided URL
