"""
Temperature Calibration System for FreshRoast Coffee Roasters

This module provides temperature calibration for different sensor types:
- Built-in FreshRoast sensor: Measures air temperature (chamber temp)
- External temperature probe: Measures actual bean temperature

The built-in sensor reads 10-35°F higher than actual bean temperature,
requiring calibration based on roast phase and elapsed time.
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

@dataclass
class TemperatureReading:
    """Structured temperature reading with calibration data"""
    raw_temp_f: float
    calibrated_temp_f: float
    sensor_type: str
    confidence: str
    notes: str
    offset_applied: float

class TemperatureCalibrator:
    """Calibrates temperature readings based on sensor type and roast phase"""
    
    def __init__(self):
        # Built-in sensor offsets by elapsed time (in seconds)
        self.builtin_offsets = {
            (0, 180): 35.0,      # 0-3 min: +35°F offset
            (180, 300): 25.0,    # 3-5 min: +25°F offset  
            (300, 420): 15.0,    # 5-7 min: +15°F offset
            (420, 600): 10.0,    # 7-10 min: +10°F offset
            (600, float('inf')): 8.0  # 10+ min: +8°F offset
        }
        
        # Sensor-specific temperature targets for milestones
        self.milestone_targets = {
            'builtin': {
                'first_crack': (405, 415),
                'city_drop': (410, 420),
                'city_plus_drop': (420, 430),
                'full_city_drop': (430, 440),
                'full_city_plus_drop': (440, 450)
            },
            'probe': {
                'first_crack': (390, 400),
                'city_drop': (395, 405),
                'city_plus_drop': (405, 415),
                'full_city_drop': (415, 425),
                'full_city_plus_drop': (425, 435)
            }
        }
    
    def calibrate_reading(
        self, 
        raw_temp_f: float, 
        sensor_type: str, 
        elapsed_seconds: int, 
        user_offset: Optional[float] = None
    ) -> TemperatureReading:
        """
        Calibrate temperature reading based on sensor type and elapsed time
        
        Args:
            raw_temp_f: Raw temperature reading from sensor
            sensor_type: 'builtin' or 'probe'
            elapsed_seconds: Time elapsed since roast start
            user_offset: Optional user-defined offset for probe calibration
            
        Returns:
            TemperatureReading with calibrated temperature and metadata
        """
        
        if sensor_type == 'probe':
            # Probe measures actual bean temperature - use directly
            calibrated_temp = raw_temp_f
            if user_offset:
                calibrated_temp += user_offset
            
            return TemperatureReading(
                raw_temp_f=raw_temp_f,
                calibrated_temp_f=calibrated_temp,
                sensor_type=sensor_type,
                confidence="high",
                notes="Probe measures actual bean temperature",
                offset_applied=user_offset or 0.0
            )
        
        elif sensor_type == 'builtin':
            # Built-in sensor measures air temperature - needs calibration
            offset = self._get_builtin_offset(elapsed_seconds)
            calibrated_temp = raw_temp_f - offset
            
            return TemperatureReading(
                raw_temp_f=raw_temp_f,
                calibrated_temp_f=calibrated_temp,
                sensor_type=sensor_type,
                confidence="medium",
                notes=f"Built-in sensor reads ~{offset:.0f}°F higher than bean temp",
                offset_applied=-offset
            )
        
        else:
            # Unknown sensor type - return raw reading
            logger.warning(f"Unknown sensor type: {sensor_type}")
            return TemperatureReading(
                raw_temp_f=raw_temp_f,
                calibrated_temp_f=raw_temp_f,
                sensor_type=sensor_type,
                confidence="low",
                notes="Unknown sensor type - using raw reading",
                offset_applied=0.0
            )
    
    def _get_builtin_offset(self, elapsed_seconds: int) -> float:
        """Get built-in sensor offset based on elapsed time"""
        for time_range, offset in self.builtin_offsets.items():
            if time_range[0] <= elapsed_seconds < time_range[1]:
                return offset
        
        # Fallback to last offset if time exceeds all ranges
        return self.builtin_offsets[(600, float('inf'))]
    
    def get_target_temperature_range(
        self, 
        sensor_type: str, 
        milestone: str
    ) -> Tuple[float, float]:
        """
        Get target temperature range for a specific milestone and sensor type
        
        Args:
            sensor_type: 'builtin' or 'probe'
            milestone: 'first_crack', 'city_drop', 'city_plus_drop', etc.
            
        Returns:
            Tuple of (min_temp, max_temp) for the milestone
        """
        if sensor_type not in self.milestone_targets:
            logger.warning(f"Unknown sensor type: {sensor_type}")
            return (0, 0)
        
        if milestone not in self.milestone_targets[sensor_type]:
            logger.warning(f"Unknown milestone: {milestone}")
            return (0, 0)
        
        return self.milestone_targets[sensor_type][milestone]
    
    def get_sensor_characteristics(self, sensor_type: str) -> Dict[str, str]:
        """Get human-readable characteristics of the sensor type"""
        characteristics = {
            'builtin': {
                'name': 'Built-in FreshRoast Sensor',
                'measures': 'Air Temperature (Chamber Temperature)',
                'accuracy': 'Reads 10-35°F higher than actual bean temperature',
                'calibration': 'Automatically calibrated based on roast phase',
                'best_for': 'General roasting guidance and relative temperature changes',
                'limitations': 'Not accurate for absolute bean temperature'
            },
            'probe': {
                'name': 'External Temperature Probe',
                'measures': 'Bean Temperature (Direct Contact)',
                'accuracy': 'Direct measurement of actual bean temperature',
                'calibration': 'Minimal calibration needed (user offset optional)',
                'best_for': 'Precise temperature control and milestone timing',
                'limitations': 'Requires proper placement in bean mass'
            }
        }
        
        return characteristics.get(sensor_type, {
            'name': 'Unknown Sensor',
            'measures': 'Unknown',
            'accuracy': 'Unknown',
            'calibration': 'Unknown',
            'best_for': 'Unknown',
            'limitations': 'Unknown'
        })
    
    def format_temperature_display(
        self, 
        reading: TemperatureReading, 
        show_calibrated: bool = True
    ) -> str:
        """
        Format temperature reading for display
        
        Args:
            reading: TemperatureReading object
            show_calibrated: Whether to show calibrated temperature for built-in sensors
            
        Returns:
            Formatted temperature string
        """
        if reading.sensor_type == 'builtin':
            if show_calibrated and reading.offset_applied != 0:
                return f"{reading.raw_temp_f:.0f}°F (Est. Bean: {reading.calibrated_temp_f:.0f}°F)"
            else:
                return f"{reading.raw_temp_f:.0f}°F"
        else:
            return f"{reading.calibrated_temp_f:.0f}°F"
    
    def get_coaching_context(
        self, 
        reading: TemperatureReading, 
        milestone: str
    ) -> str:
        """
        Get coaching context for temperature reading
        
        Args:
            reading: TemperatureReading object
            milestone: Current roast milestone
            
        Returns:
            Coaching context string
        """
        target_range = self.get_target_temperature_range(reading.sensor_type, milestone)
        
        if reading.sensor_type == 'builtin':
            # For built-in sensor, compare calibrated temperature to targets
            temp_to_compare = reading.calibrated_temp_f
            sensor_note = f" (Built-in reads ~{abs(reading.offset_applied):.0f}°F higher)"
        else:
            # For probe, compare raw temperature to targets
            temp_to_compare = reading.raw_temp_f
            sensor_note = " (Probe measures actual bean temp)"
        
        if temp_to_compare < target_range[0]:
            return f"Temperature {temp_to_compare:.0f}°F is below target range {target_range[0]}-{target_range[1]}°F for {milestone}{sensor_note}"
        elif temp_to_compare > target_range[1]:
            return f"Temperature {temp_to_compare:.0f}°F is above target range {target_range[0]}-{target_range[1]}°F for {milestone}{sensor_note}"
        else:
            return f"Temperature {temp_to_compare:.0f}°F is in target range {target_range[0]}-{target_range[1]}°F for {milestone}{sensor_note}"

# Global instance
temperature_calibrator = TemperatureCalibrator()
