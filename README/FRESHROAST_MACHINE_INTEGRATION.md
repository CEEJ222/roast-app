# FreshRoast Machine Integration

## Overview

The Enhanced AI Chatbot System now includes comprehensive FreshRoast machine integration, providing machine-specific guidance tailored to the unique characteristics of each FreshRoast model and configuration.

## Supported Machines

### FreshRoast SR540
- **Power**: 1400W
- **Capacity**: 85-120g (optimal)
- **Heat Response**: Fast (15-20 seconds)
- **Fan Effect**: Significant (can reduce temp by 20-30°F)
- **Typical Roast Time**: 8-12 minutes

### FreshRoast SR540 + Extension Tube
- **Power**: 1400W
- **Capacity**: 120-150g (with extension)
- **Heat Response**: Moderate (25-30 seconds)
- **Fan Effect**: Reduced (need higher fan settings)
- **Typical Roast Time**: 10-14 minutes

### FreshRoast SR800
- **Power**: 1500W
- **Capacity**: 110-150g
- **Heat Response**: Very Fast (10-15 seconds)
- **Fan Effect**: Powerful (use carefully)
- **Typical Roast Time**: 8-13 minutes

### FreshRoast SR800 + Extension Tube
- **Power**: 1500W
- **Capacity**: 140-180g (with extension)
- **Heat Response**: Moderate (20-25 seconds)
- **Fan Effect**: Strong but buffered
- **Typical Roast Time**: 10-15 minutes

## Machine-Specific Features

### Phase-Specific Guidance

Each machine has specific recommendations for each roasting phase:

#### Drying Phase (0-4 minutes)
- **SR540**: Heat 7-9, Fan 8-9
- **SR540+ET**: Heat 8-9, Fan 9 (max fan needed)
- **SR800**: Heat 6-8, Fan 8-9 (less heat than SR540!)
- **SR800+ET**: Heat 7-9, Fan 9 (best combination)

#### Maillard Phase (4-8 minutes)
- **SR540**: Heat 6-8, Fan 7-8
- **SR540+ET**: Heat 7-9, Fan 8-9
- **SR800**: Heat 5-7, Fan 7-8 (aggressive heating)
- **SR800+ET**: Heat 6-8, Fan 8-9 (sweet spot)

#### Development Phase (8-12 minutes)
- **SR540**: Heat 4-6, Fan 6-7
- **SR540+ET**: Heat 5-7, Fan 7-8
- **SR800**: Heat 4-6, Fan 6-8 (maintains momentum)
- **SR800+ET**: Heat 5-7, Fan 7-8 (best control)

### Machine-Specific Advice

The system provides tailored advice based on:

1. **Current Settings Assessment**
   - Compares current heat/fan to recommended ranges
   - Provides specific warnings for inappropriate settings
   - Suggests optimal adjustments

2. **Temperature Analysis**
   - Considers machine power characteristics
   - Accounts for heat response times
   - Provides machine-specific temperature targets

3. **Rate of Rise (ROR) Monitoring**
   - Machine-specific ROR expectations
   - Power-aware recommendations
   - Extension tube effects on temperature response

### Common Issues and Solutions

Each machine profile includes specific troubleshooting:

#### SR540 Issues
- Scorching on bottom → Reduce heat by 1-2 levels
- Uneven roast → Increase fan for better circulation
- Stalling before first crack → Increase heat by 1 level

#### SR800 Issues
- Temperature spiking → Reduce heat by 2 levels (powerful machine)
- First crack too early → Started with too much heat
- Beans flying out → Reduce fan to 7-8

#### Extension Tube Effects
- **SR540+ET**: Requires more heat and fan, slower response
- **SR800+ET**: Best combination, most control and evenness

## Implementation Details

### Machine Profile Integration

```python
# Get machine profile
machine_profile = machine_profiles.get_profile("SR800", True)  # SR800 with extension

# Get phase-specific advice
advice = machine_profiles.get_phase_specific_advice(
    machine_profile, "drying", current_heat=7, current_fan=8, elapsed_seconds=180
)

# Get heat recommendations
recommendations = machine_profiles.get_heat_recommendation(
    machine_profile, "drying", current_temp=280, target_temp=300, ror=8.5
)
```

### Phase-Aware Integration

```python
# Get machine-specific phase context
context = phase_detector.get_machine_specific_phase_context(
    phase, elapsed_seconds, current_temp, 
    machine_model="SR800", has_extension=True,
    current_heat=7, current_fan=8
)

# Build FreshRoast-aware prompts
prompt = prompt_builder.build_freshroast_aware_prompt(
    current_phase="drying", context=roast_context,
    machine_model="SR800", has_extension=True,
    current_heat=7, current_fan=8
)
```

## API Integration

### Enhanced Endpoints

The existing API endpoints now support machine-specific guidance:

```javascript
// During-roast advice with machine info
const response = await fetch('/api/rag/during-roast-advice', {
  method: 'POST',
  body: JSON.stringify({
    roast_progress: {
      ...roastData,
      machine_model: "SR800",
      has_extension: true
    },
    user_question: "How's my roast going?"
  })
});
```

### Machine Information

The system expects machine information in the roast progress data:

```javascript
roast_progress: {
  machine_model: "SR800",        // "SR540" or "SR800"
  has_extension: true,           // true/false
  current_heat: 7,              // 1-9
  current_fan: 8,               // 1-9
  // ... other roast data
}
```

## Benefits

### Machine-Specific Guidance
- **SR540**: Conservative approach, higher heat settings
- **SR800**: More powerful, lower heat settings needed
- **Extension Tubes**: Adjusted timing and settings

### Improved Accuracy
- Machine-specific temperature targets
- Power-aware heat/fan recommendations
- Extension tube effects considered

### Better User Experience
- Tailored advice for specific machine
- Machine-specific pro tips and warnings
- Appropriate settings for machine capabilities

## Testing

The FreshRoast integration includes comprehensive testing:

```bash
cd backend/RAG_system
python3 test_freshroast_integration.py
```

Test coverage includes:
- Machine profile loading and validation
- Phase-specific advice generation
- Heat/fan recommendation accuracy
- Machine-specific context generation
- Integration with existing enhanced features

## Future Enhancements

### Planned Improvements
1. **Batch Size Optimization**: Machine-specific batch size recommendations
2. **Environmental Factors**: Machine-specific adjustments for temperature/humidity
3. **Roast Level Optimization**: Machine-specific roast level guidance
4. **Performance Analytics**: Machine-specific success metrics

### Advanced Features
1. **Machine Learning**: Learn from successful roasts on specific machines
2. **Predictive Modeling**: Anticipate machine behavior based on settings
3. **Custom Profiles**: User-defined machine characteristics
4. **Firmware Integration**: Real-time machine data integration

## Conclusion

The FreshRoast machine integration provides a significant improvement in AI chatbot accuracy and relevance by:

- **Tailoring advice** to specific machine characteristics
- **Accounting for power differences** between SR540 and SR800
- **Considering extension tube effects** on roasting dynamics
- **Providing machine-specific troubleshooting** and pro tips

This integration ensures that users receive the most accurate and relevant guidance for their specific FreshRoast machine configuration.
