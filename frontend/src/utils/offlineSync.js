import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';

// Enhanced API call function with offline support
export const apiCall = async (url, options = {}) => {
  try {
    // Check network status
    const status = await Network.getStatus();
    
    if (!status.connected) {
      // Store request for later synchronization
      await storeOfflineRequest(url, options);
      return { offline: true, message: 'Request stored for offline sync' };
    }

    // Make API call
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Handle offline scenario
    if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
      await storeOfflineRequest(url, options);
      return { offline: true, message: 'Request stored for offline sync' };
    }
    throw error;
  }
};

// Store offline requests for later synchronization
const storeOfflineRequest = async (url, options) => {
  try {
    const offlineRequests = await Preferences.get({ key: 'offlineRequests' });
    const requests = offlineRequests.value ? JSON.parse(offlineRequests.value) : [];
    
    requests.push({
      url,
      options,
      timestamp: Date.now()
    });
    
    await Preferences.set({
      key: 'offlineRequests',
      value: JSON.stringify(requests)
    });
    
    console.log('Request stored for offline sync:', url);
  } catch (error) {
    console.error('Failed to store offline request:', error);
  }
};

// Sync offline requests when connection is restored
export const syncOfflineRequests = async () => {
  try {
    const offlineRequests = await Preferences.get({ key: 'offlineRequests' });
    
    if (offlineRequests.value) {
      const requests = JSON.parse(offlineRequests.value);
      
      for (const request of requests) {
        try {
          await fetch(request.url, request.options);
          console.log('Successfully synced offline request:', request.url);
        } catch (error) {
          console.error('Failed to sync offline request:', error);
        }
      }
      
      // Clear synced requests
      await Preferences.remove({ key: 'offlineRequests' });
      console.log('All offline requests synced and cleared');
    }
  } catch (error) {
    console.error('Failed to sync offline requests:', error);
  }
};

// Check if we're online
export const isOnline = async () => {
  const status = await Network.getStatus();
  return status.connected;
};

// Listen for network status changes
export const onNetworkStatusChange = (callback) => {
  Network.addListener('networkStatusChange', callback);
};

// Store data locally for offline access
export const storeLocalData = async (key, data) => {
  try {
    await Preferences.set({
      key: key,
      value: JSON.stringify(data)
    });
  } catch (error) {
    console.error('Failed to store local data:', error);
  }
};

// Retrieve data from local storage
export const getLocalData = async (key) => {
  try {
    const result = await Preferences.get({ key: key });
    return result.value ? JSON.parse(result.value) : null;
  } catch (error) {
    console.error('Failed to get local data:', error);
    return null;
  }
};

// Clear local data
export const clearLocalData = async (key) => {
  try {
    await Preferences.remove({ key: key });
  } catch (error) {
    console.error('Failed to clear local data:', error);
  }
};
