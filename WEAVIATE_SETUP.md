# Weaviate Vector Database Setup

This guide will help you set up Weaviate for semantic search capabilities in the coffee roasting app.

## 🎯 What is Weaviate?

Weaviate is a vector database that enables semantic search on your coffee bean profiles and roast data. It allows you to:

- **Search beans semantically**: Find beans by flavor descriptions, not just exact matches
- **Find similar beans**: Discover beans with similar characteristics
- **Recommend roast profiles**: Get AI-powered roast recommendations
- **Advanced filtering**: Combine semantic search with traditional filters

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
cd backend
python setup_weaviate.py
```

This script will:
- Check Docker installation
- Start Weaviate using Docker Compose
- Initialize schemas
- Run integration tests

### Option 2: Manual Setup

1. **Start Weaviate**:
   ```bash
   docker compose -f docker-compose.weaviate.yml up -d
   ```

2. **Wait for Weaviate to be ready** (about 30 seconds)

3. **Initialize schemas**:
   ```bash
   cd backend
   python -c "from weaviate_integration import get_weaviate_integration; get_weaviate_integration().initialize_schemas()"
   ```

4. **Test the setup**:
   ```bash
   python test_weaviate.py
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Weaviate Configuration
WEAVIATE_URL=http://localhost:8080
WEAVIATE_API_KEY=  # Optional, leave empty for local development

# OpenAI Configuration (for embeddings)
OPENAI_API_KEY=your_openai_api_key_here
```

### Weaviate Settings

The Docker Compose file configures Weaviate with:
- **Port**: 8080
- **Modules**: text2vec-openai, text2vec-cohere, text2vec-huggingface
- **Default vectorizer**: text2vec-openai
- **Anonymous access**: Enabled (for local development)

## 📊 Schema Overview

### BeanProfile Class
Stores coffee bean profiles with semantic search capabilities:
- Basic info: name, supplier, origin, variety
- Flavor characteristics: flavor_notes, aroma_notes, body, acidity
- Quality metrics: cupping_score, certifications
- User data: user_id, timestamps

### RoastProfile Class
Stores roast profiles with semantic search:
- Roast parameters: time, temperatures, crack times
- Quality ratings: body, acidity, sweetness, overall
- Equipment info: roaster_model, batch_size
- Environmental: ambient_temp, humidity

### RoastEvent Class
Stores individual roast events:
- Event details: timestamp, temperature, event_type
- Notes and observations
- Links to roast profiles

## 🔍 API Endpoints

### Semantic Search

```bash
# Search beans semantically
POST /search/beans
{
  "query": "floral Ethiopian coffee with bright acidity",
  "limit": 10
}

# Search roast profiles
POST /search/roasts
{
  "query": "light roast profile for fruity beans",
  "limit": 10
}
```

### Similarity Search

```bash
# Find similar beans
GET /search/similar-beans/{bean_profile_id}?limit=5

# Get roast recommendations
GET /search/recommend-roast/{bean_profile_id}
```

### Weaviate Management

```bash
# Initialize schemas
POST /weaviate/initialize

# Sync bean to Weaviate
POST /weaviate/sync-bean/{bean_profile_id}
```

## 🧪 Testing

### Run Integration Tests

```bash
cd backend
python test_weaviate.py
```

### Test Individual Components

```python
# Test connection
from weaviate_config import get_weaviate_client
client = get_weaviate_client()
print(client.is_connected())

# Test embeddings
from weaviate_embeddings import get_bean_embedder
embedder = get_bean_embedder()
embedding = embedder.embed_bean_profile(bean_data)
```

## 🔄 Data Synchronization

### Automatic Sync
Bean profiles are automatically synced to Weaviate when:
- Created via the HTML parser
- Updated with new data
- Enhanced with AI-optimized fields

### Manual Sync
```bash
# Sync specific bean profile
curl -X POST "http://localhost:8000/weaviate/sync-bean/{bean_id}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎨 Frontend Integration

### Search Interface
```javascript
// Search beans semantically
const searchBeans = async (query) => {
  const response = await fetch('/api/search/beans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, limit: 10 })
  });
  return response.json();
};
```

### Similarity Features
```javascript
// Find similar beans
const findSimilar = async (beanId) => {
  const response = await fetch(`/api/search/similar-beans/${beanId}`);
  return response.json();
};
```

## 🚨 Troubleshooting

### Common Issues

1. **Weaviate not starting**:
   ```bash
   # Check Docker is running
   docker ps
   
   # Check logs
   docker compose -f docker-compose.weaviate.yml logs
   ```

2. **Connection refused**:
   ```bash
   # Wait for Weaviate to be ready
   curl http://localhost:8080/v1/meta
   ```

3. **Schema creation fails**:
   ```bash
   # Check Weaviate is accessible
   curl http://localhost:8080/v1/schema
   ```

4. **Embeddings not working**:
   - Check OPENAI_API_KEY is set
   - Verify OpenAI API quota
   - Check network connectivity

### Debug Mode

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Performance Tips

1. **Batch operations**: Sync multiple beans at once
2. **Index optimization**: Use appropriate vectorizer models
3. **Caching**: Cache frequent searches
4. **Pagination**: Use limit/offset for large result sets

## 🔒 Security

### Production Setup

1. **Authentication**: Enable Weaviate authentication
2. **API Keys**: Use secure API key management
3. **Network**: Restrict access to Weaviate
4. **SSL**: Use HTTPS in production

### Environment Variables
```env
# Production Weaviate
WEAVIATE_URL=https://your-weaviate-instance.com
WEAVIATE_API_KEY=your-secure-api-key
```

## 📚 Resources

- [Weaviate Documentation](https://weaviate.io/developers/weaviate)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Vector Search Concepts](https://weaviate.io/developers/weaviate/concepts/vector-search)

## 🎉 Next Steps

1. **Set up OpenAI API key** for embeddings
2. **Test semantic search** with your bean data
3. **Integrate frontend** search interface
4. **Add recommendation features**
5. **Optimize for production** deployment

---

**Happy roasting! ☕️**
