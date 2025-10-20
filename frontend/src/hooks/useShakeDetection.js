import { useEffect, useRef } from 'react';

const useShakeDetection = (onShake, threshold = 15, debounceTime = 1000) => {
  const lastShakeTime = useRef(0);
  const isListening = useRef(false);

  useEffect(() => {
    if (!onShake) return;

    const handleDeviceMotion = (event) => {
      const acceleration = event.acceleration;
      if (!acceleration) return;

      const totalAcceleration = Math.sqrt(
        acceleration.x * acceleration.x +
        acceleration.y * acceleration.y +
        acceleration.z * acceleration.z
      );

      const currentTime = Date.now();
      
      // Check if acceleration exceeds threshold and enough time has passed since last shake
      if (totalAcceleration > threshold && 
          currentTime - lastShakeTime.current > debounceTime) {
        lastShakeTime.current = currentTime;
        onShake();
      }
    };

    // Request permission for device motion on iOS
    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
      DeviceMotionEvent.requestPermission().then((response) => {
        if (response === 'granted') {
          isListening.current = true;
          window.addEventListener('devicemotion', handleDeviceMotion);
        }
      });
    } else {
      // For browsers that don't require permission
      isListening.current = true;
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      if (isListening.current) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [onShake, threshold, debounceTime]);

  return isListening.current;
};

export default useShakeDetection;
