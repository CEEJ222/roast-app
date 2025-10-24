# DTR (Development Time Ratio) Integration Guide

## Overview

This guide documents the comprehensive DTR (Development Time Ratio) integration into your AI roast chat RAG system. DTR is one of the most critical metrics for roast quality, and this integration provides intelligent, machine-aware coaching based on DTR optimization.

## What is DTR?

**Development Time Ratio (DTR)** is the percentage of total roast time spent in the development phase (from first crack to drop). It's calculated as:

```
DTR = (Development Time / Total Roast Time) × 100%
```

DTR directly impacts flavor development:
- **Too Low DTR**: Underdeveloped, grassy, baked flavors
- **Optimal DTR**: Balanced acidity, sweetness, body
- **Too High DTR**: Overdeveloped, burnt, flat flavors

## DTR Targets by Roast Level

| Roast Level | DTR Target Range | Drop Temperature | Development Time |
|-------------|------------------|------------------|------------------|
| **City** | 15-18% | 400-410°F | 1.5-2.5 min |
| **City+** | 17-20% | 405-415°F | 2.0-3.0 min |
| **Full City** | 20-25% | 415-425°F | 2.5-3.5 min |
| **Full City+** | 22-28% | 420-430°F | 3.0-4.0 min |

## System Architecture

### 1. DTR Knowledge System (`dtr_knowledge.py`)

**Core Components:**
- `DTRTargets`: Roast level profiles with DTR targets and characteristics
- `DTRCoach`: AI coaching system that integrates DTR knowledge
- `RoastLevelProfile`: Comprehensive profiles for each roast level

**Key Features:**
- DTR calculation and assessment
- Roast level-specific guidance
- Visual cues and common mistakes
- Machine-aware coaching recommendations

### 2. Enhanced Machine Profiles (`machine_profiles.py`)

**DTR Integration:**
- DTR targets embedded in development phase data
- Machine-specific DTR coaching methods
- Heat/fan recommendations based on DTR status
- Urgency-based coaching messages

**Machine-Specific DTR Guidance:**
- SR800: Fast response, requires careful DTR monitoring
- SR800+ET: Excellent DTR control, most forgiving
- SR540: Moderate response, good for learning DTR
- SR540+ET: Stable environment, predictable DTR

### 3. LLM Integration (`llm_integration.py`)

**DTR-Aware Coaching:**
- `get_dtr_aware_coaching()`: Main DTR coaching method
- Machine-specific DTR advice integration
- Comprehensive system prompts with DTR context
- Real-time DTR status and recommendations

**Enhanced Prompts Include:**
- Current DTR status and urgency
- Target DTR ranges for roast level
- Machine-specific DTR guidance
- Visual cues and development guidance

### 4. RAG Endpoints (`rag_endpoints.py`)

**New DTR Endpoints:**
- `/rag/during-roast-advice`: Enhanced with DTR awareness
- `/rag/dtr-analysis`: Detailed DTR analysis and recommendations

**Response Features:**
- Real-time DTR calculation
- Urgency-based coaching
- Machine-specific recommendations
- Roast profile information

## Usage Examples

### 1. Basic DTR Analysis

```python
from dtr_knowledge import dtr_coach

# Get DTR-aware coaching
coaching = dtr_coach.get_dtr_aware_coaching(
    roast_level="City+",
    current_phase="development",
    elapsed_time=720,  # 12 minutes
    first_crack_time=600,  # 10 minutes
    current_temp=410.0,
    ror=8.0
)

print(f"DTR Status: {coaching['dtr_status']}")
print(f"Current DTR: {coaching['current_dtr']}%")
print(f"Coaching: {coaching['coaching']}")
```

### 2. Machine-Specific DTR Advice

```python
from machine_profiles import FreshRoastMachineProfiles

machine_profiles = FreshRoastMachineProfiles()
profile = machine_profiles.get_profile("SR800", True)  # SR800 with extension

# Get DTR-aware development advice
advice = machine_profiles.get_dtr_aware_development_advice(
    profile=profile,
    roast_level="Full City",
    current_dtr=22.5,
    current_heat=5,
    current_fan=7,
    current_temp=420.0,
    ror=10.0
)

print(f"DTR Status: {advice['dtr_status']}")
print(f"Coaching: {advice['coaching_message']}")
```

### 3. API Endpoint Usage

```javascript
// Get DTR-aware coaching during roast
const response = await fetch('/api/rag/during-roast-advice', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roast_progress: {
      roast_level: "City+",
      machine_info: { model: "SR800", has_extension: true },
      events: [{ event_type: "first_crack", t_offset_sec: 600 }],
      elapsed_time: 720,
      current_temp: 410.0,
      current_heat: 5,
      current_fan: 7,
      ror: 8.0
    },
    user_question: "How is my DTR looking?"
  })
});

const data = await response.json();
console.log(data.advice); // DTR-aware coaching response
```

## DTR Coaching Scenarios

### Scenario 1: Underdeveloped Roast (DTR Too Low)

**Example:** City roast with 12% DTR (target: 15-18%)

**AI Response:**
```
🚨 CRITICAL: DTR 12.0% is 3.0% below target for City. 
FreshRoast SR800 needs more development time. 
Increase heat if temperature is low, or extend development time.
```

**Machine-Specific Guidance:**
- SR800: Increase heat by 1-2 levels if temp < 400°F
- SR800+ET: More forgiving, can maintain heat at 6-7
- Monitor for light brown color change
- Watch for first crack completion

### Scenario 2: Overdeveloped Roast (DTR Too High)

**Example:** Full City roast with 30% DTR (target: 20-25%)

**AI Response:**
```
🚨 CRITICAL: DTR 30.0% is 5.0% above target. 
FreshRoast SR800 roast is overdeveloped. 
Drop immediately to prevent over-roasting.
```

**Machine-Specific Guidance:**
- SR800: Drop immediately, reduce heat by 2 levels
- SR800+ET: Still drop, but extension provides some protection
- Watch for oil development and dark color
- Consider cooling method

### Scenario 3: Optimal DTR

**Example:** City+ roast with 18.5% DTR (target: 17-20%)

**AI Response:**
```
🎯 Perfect! DTR 18.5% is on target for City+. 
FreshRoast SR800 is performing well. 
Continue monitoring development.
```

**Machine-Specific Guidance:**
- Maintain current heat/fan settings
- Continue watching for color development
- Prepare for drop at target temperature
- Monitor for any temperature spikes

## Testing and Validation

### Running DTR Tests

```bash
cd backend/RAG_system
python3 test_dtr_simple.py
```

**Test Coverage:**
- ✅ DTR knowledge system validation
- ✅ Machine profiles DTR integration
- ✅ DTR coach scenarios
- ✅ Endpoint data structures
- ✅ Roast level profiles

### Test Results

The test suite validates:
- DTR calculation accuracy
- Roast level profile completeness
- Machine-specific DTR guidance
- Coaching message generation
- API endpoint functionality

## Integration Benefits

### 1. **Intelligent Coaching**
- DTR-aware recommendations based on roast level
- Machine-specific guidance for different FreshRoast models
- Urgency-based coaching with clear action items

### 2. **Consistent Quality**
- Standardized DTR targets across roast levels
- Visual cues and characteristics for each level
- Common mistake prevention

### 3. **Machine Optimization**
- SR800: Fast response, requires careful monitoring
- SR800+ET: Best DTR control, most forgiving
- SR540: Good for learning, moderate response
- SR540+ET: Stable environment, predictable results

### 4. **Real-Time Guidance**
- Live DTR calculation during development phase
- Immediate feedback on DTR status
- Proactive coaching before problems occur

## Future Enhancements

### Planned Features:
1. **Historical DTR Analysis**: Track DTR trends across roasts
2. **Bean-Specific DTR Targets**: Adjust targets based on bean characteristics
3. **Environmental DTR Adjustments**: Modify targets for altitude, humidity
4. **DTR Learning System**: Improve recommendations based on user feedback

### Advanced DTR Features:
1. **DTR Prediction**: Estimate final DTR based on current progress
2. **DTR Optimization**: Suggest heat/fan changes to achieve target DTR
3. **DTR Comparison**: Compare current roast to historical successful roasts
4. **DTR Alerts**: Proactive notifications for DTR issues

## Conclusion

The DTR integration provides a comprehensive, intelligent coaching system that optimizes roast development based on the most critical quality metric. By combining DTR knowledge with machine-specific guidance, the AI can provide precise, actionable advice that leads to consistently better roasts.

The system is designed to be:
- **Accurate**: Based on proven DTR targets and machine characteristics
- **Intelligent**: Adapts to different roast levels and machine configurations
- **Actionable**: Provides specific heat/fan recommendations
- **Educational**: Explains why DTR matters and how to achieve it

This integration transforms your AI roast chat from a general assistant into a specialized DTR optimization expert that understands both the science of coffee roasting and the specific characteristics of FreshRoast machines.
