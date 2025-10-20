import { useEffect, useState } from 'react';
import { Device } from '@capacitor/device';
import { ScreenOrientation } from '@capacitor/screen-orientation';

const useDeviceSensors = () => {
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [orientation, setOrientation] = useState('portrait');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Get device information
    const getDeviceInfo = async () => {
      try {
        const info = await Device.getInfo();
        setDeviceInfo(info);
        console.log('Device info:', info);
      } catch (error) {
        console.error('Failed to get device info:', error);
      }
    };

    getDeviceInfo();

    // Listen for orientation changes
    const handleOrientationChange = () => {
      const currentOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      setOrientation(currentOrientation);
    };

    window.addEventListener('resize', handleOrientationChange);
    handleOrientationChange(); // Initial check

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  const lockOrientation = async (orientation = 'portrait') => {
    try {
      await ScreenOrientation.lock({ orientation });
      setIsLocked(true);
      console.log(`Screen orientation locked to ${orientation}`);
    } catch (error) {
      console.error('Failed to lock orientation:', error);
    }
  };

  const unlockOrientation = async () => {
    try {
      await ScreenOrientation.unlock();
      setIsLocked(false);
      console.log('Screen orientation unlocked');
    } catch (error) {
      console.error('Failed to unlock orientation:', error);
    }
  };

  const isMobileDevice = deviceInfo?.platform === 'ios' || deviceInfo?.platform === 'android';
  const isTablet = deviceInfo?.platform === 'ios' && deviceInfo?.model?.includes('iPad') ||
                   deviceInfo?.platform === 'android' && deviceInfo?.model?.includes('Tablet');

  return {
    deviceInfo,
    orientation,
    isLocked,
    lockOrientation,
    unlockOrientation,
    isMobileDevice,
    isTablet
  };
};

export default useDeviceSensors;
