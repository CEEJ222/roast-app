# DTR (Development Time Ratio) Coaching System

## Overview

The DTR Coaching System provides sophisticated roast development tracking and guidance for the AI chatbot. It calculates the Development Time Ratio (DTR) - the percentage of total roast time spent in the development phase (from first crack to drop) - and provides targeted coaching based on roast level targets.

## Key Features

### 🎯 **DTR Calculation & Assessment**
- **Real-time DTR calculation**: `(development_time / total_time) * 100`
- **Roast level specific targets**: Each roast level has optimal DTR ranges
- **Status assessment**: Categorizes DTR as optimal, low, high, too low, or too high
- **Urgency levels**: Low, medium, high priority responses

### 📊 **Comprehensive Roast Profiles**
- **8 roast levels**: From Cinnamon to French roast
- **Detailed characteristics**: Flavor profiles, development times, drop temperatures
- **Common mistakes**: Roast-level specific pitfalls to avoid
- **Target ranges**: DTR, temperature, and timing targets

### 🤖 **AI Integration**
- **System prompt enhancement**: DTR context integrated into LLM prompts
- **Machine-aware coaching**: Combines DTR guidance with FreshRoast machine profiles
- **Real-time feedback**: Provides immediate coaching based on current DTR status

## DTR Target Ranges by Roast Level

| Roast Level | DTR Target | Development Time | Drop Temperature |
|-------------|------------|-----------------|------------------|
| Cinnamon | 12-15% | 1.0-1.5 min | 385-395°F |
| Light City | 14-17% | 1.2-1.8 min | 395-405°F |
| City | 15-18% | 1.5-2.5 min | 400-410°F |
| City+ | 17-20% | 2.0-3.0 min | 405-415°F |
| Full City | 20-25% | 2.5-3.5 min | 410-425°F |
| Full City+ | 22-28% | 3.0-4.0 min | 415-430°F |
| Vienna | 25-30% | 3.5-4.5 min | 425-440°F |
| French | 28-35% | 4.0-5.0 min | 435-450°F |

## Usage

### Basic DTR Coaching Context
```python
from dtr_coaching import build_dtr_coaching_context

context = build_dtr_coaching_context(
    target_roast_level="City",
    current_phase="development",
    first_crack_time_sec=360,  # First crack at 6 minutes
    elapsed_seconds=420,       # 7 minutes total
    current_temp=400
)
```

### DTR Calculations
```python
from dtr_coaching import DTRTargets

# Calculate current DTR
dtr = DTRTargets.calculate_dtr(first_crack_time, current_time)

# Assess DTR against target range
assessment = DTRTargets.assess_dtr(dtr, target_range)
```

## DTR Coaching Principles

### 1. **DTR is More Important Than Temperature Alone**
- Good temperature + wrong DTR = poor roast
- Monitor BOTH temperature and DTR

### 2. **Development Time is Critical**
- Measured from FIRST CRACK to DROP
- Not total roast time
- Not from second crack

### 3. **DTR Too Low = Underdeveloped**
- Beans haven't developed enough complexity
- Results in baked, grassy flavors
- Even if temperature is correct

### 4. **DTR Too High = Over-developed**
- Extended development can cause scorching
- Loss of origin characteristics
- Flat, burnt flavors

### 5. **FreshRoast Timing Considerations**
- Total roast: 8-13 minutes typically
- City: 8-11 min total (1.5-2.5 min development)
- City+: 9-12 min total (2-3 min development)
- Full City: 10-13 min total (2.5-3.5 min development)

## Integration with AI Chatbot

The DTR coaching context is automatically integrated into the AI system prompts, providing:

- **Real-time DTR status** with urgency indicators
- **Machine-specific guidance** for FreshRoast models
- **Phase-aware coaching** based on current roast phase
- **Targeted recommendations** for heat/fan adjustments
- **Common mistake warnings** specific to roast level

## Example DTR Coaching Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DTR (DEVELOPMENT TIME RATIO) GUIDANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TARGET ROAST LEVEL: City
DTR TARGET RANGE: 15-18%
Drop Temperature: 400-410°F
Expected Development Time: 1.5-2.5 minutes

📊 CURRENT DTR STATUS:
⚠️ Current DTR: 14.3%
Status: DTR slightly low (14.3%) - monitor closely

First Crack Time: 6:00
Current Elapsed: 7:00
Development Time So Far: 1:00

⚠️ DTR CONCERN: Roast is developing too quickly for City

RECOMMENDED ACTIONS:
1. Reduce heat by 1-2 levels to slow development
2. Allow more time before dropping
3. Target DTR: 15-18%

If you drop now, the roast will be UNDERDEVELOPED (baked, grassy, unbalanced).
```

## Benefits

1. **Precision Roasting**: DTR provides objective measurement of development
2. **Consistency**: Repeatable results across roast sessions
3. **Quality Control**: Prevents under/over-development issues
4. **Learning Tool**: Helps roasters understand development timing
5. **Machine Optimization**: Combines with FreshRoast machine profiles

## Technical Implementation

- **Modular design**: Separate DTR coaching from main LLM integration
- **Comprehensive profiles**: Detailed roast level characteristics
- **Real-time calculation**: Dynamic DTR assessment during roast
- **AI integration**: Seamless integration with existing chatbot system
- **Error handling**: Graceful fallbacks for missing data

The DTR Coaching System represents a significant advancement in AI-powered roasting guidance, providing professional-level development tracking and coaching for home roasters.
