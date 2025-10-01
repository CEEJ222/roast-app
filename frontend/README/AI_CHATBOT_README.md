# AI Chatbot System Documentation

## Overview

The FreshRoast CoPilot AI chatbot is a comprehensive RAG-powered roasting assistant that provides intelligent, personalized guidance throughout the coffee roasting process.

## Architecture

### Frontend Components

#### RoastChat.jsx
The main AI chat interface component. Key features:

- **Interactive Chat Interface**: Minimizable chat window with unread message indicators
- **Real-time AI Responses**: Automatic responses to logged events and user questions
- **Performance Optimization**: 15-second timeout with fallback responses
- **User Unit Preferences**: Temperature and elevation displayed in user's preferred units

### Backend Components

#### RAG System
- **llm_integration.py**: Core AI integration with DeepSeek LLM
- **rag_endpoints.py**: API endpoints for AI functionality
- **weaviate_integration.py**: Vector database integration

## Features

### 1. Pre-Roast Planning
- Bean Profile Analysis using complete bean characteristics
- Machine Configuration awareness (extension tube status)
- Environmental Conditions integration
- Historical Context from similar past roasts

### 2. During-Roast Guidance
- Real-Time Monitoring of heat/fan changes
- Event-Triggered Responses to milestones
- Interactive Chat for user questions
- Progress Analysis and timing guidance

### 3. User Experience Features
- Minimizable Interface with unread indicators
- Quick Actions for common queries
- Performance Optimization with fallbacks
- Unit Preferences support
- Dark Mode compatibility

## Data Flow

### Chat Initialization
User opens chat → initializeChat() → getStructuredWelcome() → Display welcome message → getAIRecommendation('initial_setup')

### Event-Triggered Responses
User logs event → useEffect detects change → getAutomaticEventResponse() → Display AI response

### User Questions
User types question → sendMessage() → get_during_roast_advice() → Display AI response

## Integration Points

### Bean Profile Integration
- Data Source: `formData.selectedBeanProfile`
- Fields: origin, variety, process_method, altitude_m, density, screen_size

### Machine Configuration
- Data Source: `formData.selectedMachine` or `formData.model`
- Fields: name, model, has_extension

### Environmental Conditions
- Data Source: `environmentalConditions` prop
- Fields: temperature_f, humidity_pct, elevation_ft, pressure_hpa

## Performance Optimizations

### Timeout Handling
- 15-second timeout on all AI requests
- Fallback responses when AI is unavailable
- Promise.race() implementation

### Error Handling
- Graceful degradation when AI unavailable
- Fallback messages for all scenarios
- User-friendly error messages

## Troubleshooting

### Common Issues
1. **Machine showing "undefined"** - Check formData.selectedMachine
2. **Bean profile not loading** - Verify formData.selectedBeanProfile
3. **AI responses slow** - Check DeepSeek API connectivity
4. **Environmental data missing** - Check environmentalConditions prop

### Debug Logging
Comprehensive console logging for troubleshooting data flow issues.

## API Reference

### Endpoints
- POST /api/rag/pre-roast-planning - Initial roasting strategy
- POST /api/rag/automatic-event-response - Event responses
- POST /api/rag/during-roast-advice - User questions

## Security & Privacy
- User Isolation: All data is user-specific
- Secure Authentication: JWT token validation
- AI Safety: Input validation and response filtering