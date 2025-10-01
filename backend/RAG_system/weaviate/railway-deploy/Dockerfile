FROM semitechnologies/weaviate:1.21.4

# Set environment variables for Railway
ENV AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true
ENV PERSISTENCE_DATA_PATH=/var/lib/weaviate
ENV DEFAULT_VECTORIZER_MODULE=none
ENV ENABLE_MODULES=text2vec-openai,text2vec-cohere,text2vec-huggingface,ref2vec-centroid,generative-openai,qna-openai
ENV CLUSTER_HOSTNAME=node1
ENV QUERY_DEFAULTS_LIMIT=25

# Expose port
EXPOSE 8080

# Start Weaviate
CMD ["weaviate", "--host", "0.0.0.0", "--port", "8080", "--scheme", "http"]
