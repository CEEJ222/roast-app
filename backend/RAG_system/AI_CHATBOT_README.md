# AI Roasting Copilot - Chatbot System

## Overview

The AI Roasting Copilot is an intelligent chatbot system that provides personalized roasting guidance throughout your coffee roasting journey. It combines machine learning, environmental data, and bean profile information to deliver specific, actionable advice for your FreshRoast machine.

## System Architecture

The AI chatbot consists of three main components:

1. **Pre-Roast Planning AI** - Analyzes your setup and provides initial recommendations
2. **During-Roast AI** - Monitors your roast progression and provides real-time guidance
3. **Event-Triggered AI** - Automatically responds to logged events and milestones

## Components

### 1. Pre-Roast Planning AI

**Location:** `backend/RAG_system/llm_integration.py` → `get_pre_roast_advice()`

**Purpose:** Provides initial roasting strategy based on your complete setup.

**Input Data:**
- Bean profile (origin, variety, process, altitude, density, screen size)
- Machine configuration (model, extension tube status)
- Environmental conditions (temperature, humidity, elevation, pressure)
- User preferences (temperature units, roast level)

**Output:**
- Bean-specific roasting characteristics
- Expected timing for first crack
- Key things to watch for during roasting
- General guidance (no specific heat/fan numbers initially)

**Example Response:**
```
🎯 **FreshRoast Pre-Roast Strategy:**

**Machine Setup:** My SR800 + Extension Tube
**Expected Time:** 12 minutes

**Bean-Specific Guidance:**
• Sumatra beans from high altitude require slower, gentler roasting
• Wet process beans expect cleaner development and brighter acidity
• Multiple varieties (Ateng, Jember, Tim Tim, Typica) - monitor density differences
• Listen for first crack around 8-12 minutes

**AI Confidence:** 90% AI-powered recommendations based on DeepSeek LLM
```

### 2. During-Roast AI

**Location:** `backend/RAG_system/rag_endpoints.py` → `during_roast_advice` endpoint

**Purpose:** Provides real-time guidance based on your roast progression and user questions.

**Input Data:**
- Current roast progress (elapsed time, phase, recent events)
- Bean profile information
- Environmental conditions
- User's specific questions

**Features:**
- Answers questions about roast progression
- Provides heat/fan adjustment recommendations
- Explains what's happening during different roast phases
- Offers troubleshooting advice

**Example Interactions:**
- "How's my roast going?" → Analysis of current progression
- "Should I increase the heat?" → Specific recommendation based on timing and bean type
- "Why isn't first crack happening?" → Troubleshooting guidance

### 3. Event-Triggered AI

**Location:** `backend/RAG_system/llm_integration.py` → `get_automatic_event_response()`

**Purpose:** Automatically provides guidance when you log events or reach milestones.

**Triggered By:**
- Heat/fan changes (`SET` events)
- First crack detection
- Second crack detection
- Cool phase initiation

**Response Types:**

**Heat/Fan Changes:**
```
📊 **Heat/Fan Adjustment Detected:**

**Current Settings:** Heat 5, Fan 4 at 3:45

Good adjustment! The extension tube allows for lower settings while maintaining good bean movement.

**Next Watch Points:**
• Monitor for first crack around 8-12 minutes
• Watch for even color development
• Adjust fan if beans aren't moving uniformly
```

**Milestone Events:**
```
🎉 **First crack detected!**

**Time:** 8:23
**Temperature:** 385°F

Perfect timing for Sumatra beans! The wet process is developing cleanly. 

**Next Steps:**
• Reduce heat slightly to control development
• Monitor color changes closely
• Expect second crack around 11-13 minutes if going darker
```

## Bean Profile Integration

### Data Flow

1. **Bean Selection:** User selects or creates bean profile in `StartNewRoastModal`
2. **Data Storage:** Full bean profile object stored in `formData.selectedBeanProfile`
3. **AI Transmission:** Bean profile sent to backend via API endpoints
4. **AI Processing:** LLM analyzes bean characteristics for personalized advice
5. **Response Generation:** AI generates specific guidance based on bean data

### Bean Profile Fields Used

**Basic Information:**
- `name` - Bean name (e.g., "Sumatra Wet Process Kerinci Pendekar")
- `origin` - Country/region (e.g., "Indonesia")
- `variety` - Coffee varieties (e.g., "Ateng, Jember, Tim Tim, Typica")
- `process_method` - Processing method (e.g., "Wet Process", "Natural", "Honey")

**Physical Characteristics:**
- `altitude` / `altitude_m` / `altitude_ft` - Growing altitude
- `density` / `bulk_density` - Bean density
- `screen_size` / `screen_size_mm` - Bean size

**Additional Context:**
- `supplier_name` - Coffee supplier
- `notes` - Additional bean information

### AI Interpretation

The AI uses bean profile data to provide specific guidance:

**Altitude Impact:**
- High altitude (>1500m): Slower, gentler roasting needed
- Medium altitude (1000-1500m): Standard roasting approach
- Low altitude (<1000m): Can handle higher heat settings

**Process Method Impact:**
- **Natural:** Faster development, more complex sugars, watch for faster first crack
- **Washed:** Cleaner development, brighter acidity, more predictable timing
- **Honey:** Medium development speed, balanced sweetness

**Variety Considerations:**
- Multiple varieties: Monitor for different density and development rates
- Single variety: More predictable roasting characteristics

## Machine Configuration Integration

### Extension Tube Detection

The system detects if you're using an extension tube and adjusts recommendations accordingly:

**With Extension Tube:**
- Lower heat/fan settings needed
- Better bean movement
- Longer roast times (2-3 minutes)
- More consistent roasting

**Without Extension Tube:**
- Higher heat/fan settings needed
- Requires careful bean movement management
- Standard roast times
- More aggressive roasting approach

### Machine Data Structure

```javascript
selectedMachine: {
  id: "machine_id",
  name: "My SR800",
  model: "SR800", 
  has_extension: true
}
```

## Environmental Conditions Integration

### Weather Data Sources

- **Temperature:** Open-Meteo API
- **Humidity:** Open-Meteo API  
- **Pressure:** Open-Meteo API
- **Elevation:** OpenStreetMap API

### AI Environmental Guidance

**Temperature Impact:**
- High temp (>85°F): May speed up roasting
- Cool temp (<65°F): May slow roasting
- Ideal temp (65-85°F): Optimal conditions

**Humidity Impact:**
- High humidity (>70%): May require higher fan settings
- Low humidity (<30%): May dry beans faster
- Moderate humidity (30-70%): Ideal conditions

**Elevation Impact:**
- High elevation (>3000ft): Requires lower heat settings
- Low elevation (<1000ft): Allows standard heat settings
- Moderate elevation (1000-3000ft): Ideal conditions

## User Interface

### Chat Interface

**Location:** `frontend/src/components/during_roast/RoastChat.jsx`

**Features:**
- Minimizable chat window
- Unread message indicator (red bubble)
- Quick action buttons
- Real-time message updates
- Dark mode support

**Quick Actions:**
- "How's my roast going?" - Progress analysis
- "Heat/Fan adjustment" - Setting recommendations  
- "First crack timing" - Timing guidance
- "Color check" - Development analysis

### Welcome Message Structure

The AI chat displays a structured welcome message with interpretive guidance:

```
👋 **AI Roasting Copilot Setup Analysis:**

🖥️ **Machine:** My SR800 with extension tube - expect better bean movement and lower heat/fan settings needed

🌡️ **Environment:** ideal temperature for roasting, moderate humidity ideal, low altitude allows standard heat settings

🌍 **Bean Origin:** Indonesia - moderate altitude allows standard roasting approach

🔄 **Bean Process:** Wet Process - expect cleaner development and brighter acidity

☕ **Bean Type:** Sumatra Wet Process Kerinci Pendekar (Ateng, Jember, Tim Tim, Typica) - 0.65 density, 16 screen size - monitor density and moisture content

🎯 **Summary:** Extension tube provides better control for wet beans with cleaner development - expect more predictable timing

Ready to start? I'll provide specific guidance based on your actual roast progression! 🚀
```

## API Endpoints

### Pre-Roast Planning
- **Endpoint:** `POST /api/rag/pre-roast-planning`
- **Purpose:** Get initial roasting strategy
- **Input:** Bean profile, machine info, environmental conditions, user units

### During-Roast Advice  
- **Endpoint:** `POST /api/rag/during-roast-advice`
- **Purpose:** Answer user questions during roasting
- **Input:** Roast progress, user question

### Automatic Event Response
- **Endpoint:** `POST /api/rag/automatic-event-response`
- **Purpose:** Auto-respond to logged events
- **Input:** Event data, roast progress

## Technical Implementation

### LLM Integration

**Model:** DeepSeek LLM
**Location:** `backend/RAG_system/llm_integration.py`

**Key Classes:**
- `DeepSeekRoastingCopilot` - Main AI integration class
- `get_pre_roast_advice()` - Pre-roast planning
- `get_automatic_event_response()` - Event-triggered responses
- `get_during_roast_advice()` - During-roast Q&A

### Prompt Engineering

**Pre-Roast Prompts:**
- Include complete bean profile context
- Specify machine configuration
- Provide environmental conditions
- Request specific, actionable guidance
- Avoid generic advice

**Event Response Prompts:**
- Context-aware responses
- Timing-specific recommendations
- Bean-characteristic-based guidance
- Machine-specific adjustments

### Data Validation

**Heat/Fan Settings:**
- Validated to be between 1-8 for FreshRoast machines
- Clamped if outside valid range
- Clear error messages for invalid values

**Bean Profile Data:**
- Required fields validated
- Optional fields handled gracefully
- Fallback values for missing data

## Performance Optimizations

### Response Time
- **Timeout:** 15 seconds for AI responses
- **Fallback:** Quick fallback responses if AI fails
- **Caching:** Bean profile data cached in frontend

### Token Management
- **Max Tokens:** Optimized for response length
- **Context Length:** Efficient prompt engineering
- **Rate Limiting:** Built-in API rate limiting

## Error Handling

### AI Failures
- Graceful fallback to generic advice
- User-friendly error messages
- Retry mechanisms for transient failures

### Data Issues
- Validation of required fields
- Default values for missing data
- Clear error messages for invalid inputs

## Future Enhancements

### Planned Features
- **Roast History Analysis** - Learn from past roasts
- **Personal Preference Learning** - Adapt to user preferences
- **Advanced Bean Recognition** - Image-based bean identification
- **Multi-Language Support** - Internationalization
- **Voice Integration** - Voice commands and responses

### Technical Improvements
- **Response Caching** - Cache common responses
- **Model Fine-Tuning** - Custom model training
- **Real-Time Updates** - WebSocket integration
- **Offline Mode** - Local AI processing

## Troubleshooting

### Common Issues

**Bean Profile Not Loading:**
- Check console logs for API errors
- Verify bean profile ID exists
- Ensure proper authentication

**AI Not Responding:**
- Check network connection
- Verify API endpoint availability
- Look for timeout errors in console

**Generic Responses:**
- Verify bean profile data is complete
- Check if environmental conditions are loaded
- Ensure machine configuration is set

### Debug Information

**Console Logs:**
- Bean profile data structure
- API request/response details
- Error messages and stack traces

**Network Tab:**
- API endpoint responses
- Request payloads
- Response timing

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies (`npm install` in frontend, `pip install -r requirements.txt` in backend)
3. Set up environment variables
4. Start development servers

### Code Structure
- **Frontend:** React components in `frontend/src/components/during_roast/`
- **Backend:** Python classes in `backend/RAG_system/`
- **API:** FastAPI endpoints in `backend/RAG_system/rag_endpoints.py`

### Testing
- Unit tests for AI integration
- Integration tests for API endpoints
- Manual testing with different bean profiles
- Performance testing with various scenarios

---

*This AI chatbot system represents a significant advancement in coffee roasting assistance, providing personalized, data-driven guidance that adapts to your specific setup, beans, and environment.*
