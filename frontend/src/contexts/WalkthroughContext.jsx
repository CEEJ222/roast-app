import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  isWalkthroughMode, 
  enableWalkthroughMode, 
  disableWalkthroughMode, 
  getWalkthroughData 
} from '../utils/walkthroughData';

const WalkthroughContext = createContext();

export const useWalkthrough = () => {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider');
  }
  return context;
};

export const WalkthroughProvider = ({ children }) => {
  const [isWalkthrough, setIsWalkthrough] = useState(false);
  const [walkthroughData, setWalkthroughData] = useState(null);
  const [showWalkthroughPrompt, setShowWalkthroughPrompt] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Check for walkthrough mode on mount
  useEffect(() => {
    const walkthroughMode = isWalkthroughMode();
    const hasSeenOnboardingFlag = localStorage.getItem('has_seen_onboarding');
    const hasSeenOnboarding = hasSeenOnboardingFlag === 'true';
    const tourCompleted = localStorage.getItem('tour_completed') === 'true';
    
    console.log('🎯 WalkthroughContext: Initial check:', { walkthroughMode, hasSeenOnboarding, tourCompleted });
    
    // If tour is completed, never show demo data again
    if (tourCompleted) {
      console.log('🎯 Tour completed - no demo data ever again');
      setIsWalkthrough(false);
      setWalkthroughData(null);
      return;
    }
    
    // Only enable walkthrough mode AFTER onboarding is completed
    if (hasSeenOnboarding && !walkthroughMode) {
      console.log('🎯 Onboarding completed - enabling walkthrough mode for demo');
      enableWalkthroughMode();
      setIsWalkthrough(true);
      const data = getWalkthroughData();
      setWalkthroughData(data);
    } else if (walkthroughMode && hasSeenOnboarding) {
      console.log('🎯 Walkthrough mode active after onboarding');
      setIsWalkthrough(true);
      const data = getWalkthroughData();
      setWalkthroughData(data);
    } else {
      console.log('🎯 Onboarding not completed yet - no demo data');
      setIsWalkthrough(false);
      setWalkthroughData(null);
    }
  }, []);

  // Note: Storage events only fire from other tabs, not same tab
  // So we rely on the disableWalkthrough function to update state directly

  // Check if user has completed onboarding
  useEffect(() => {
    const hasSeenOnboardingFlag = localStorage.getItem('has_seen_onboarding');
    const hasSeen = hasSeenOnboardingFlag === 'true';
    console.log('🎯 Onboarding check:', { hasSeenOnboardingFlag, hasSeen });
    setHasSeenOnboarding(hasSeen);
  }, []);

  // Auto-show onboarding for new users ONLY if they haven't completed onboarding AND tour is not active
  useEffect(() => {
    const tourCompleted = localStorage.getItem('tour_completed') === 'true';
    console.log('🎯 Onboarding prompt check:', { hasSeenOnboarding, isWalkthrough, tourCompleted, shouldShow: !hasSeenOnboarding && !isWalkthrough && !tourCompleted });
    
    // Only show onboarding if: not seen onboarding AND not in walkthrough AND tour not completed
    if (!hasSeenOnboarding && !isWalkthrough && !tourCompleted) {
      console.log('🎯 Showing onboarding prompt for new user');
      setShowWalkthroughPrompt(true);
    } else {
      console.log('🎯 Not showing onboarding prompt');
    }
  }, [hasSeenOnboarding, isWalkthrough]);

  const enableWalkthrough = () => {
    enableWalkthroughMode();
    setIsWalkthrough(true);
    const data = getWalkthroughData();
    setWalkthroughData(data);
    setShowWalkthroughPrompt(false);
    // Mark onboarding as completed
    localStorage.setItem('has_seen_onboarding', 'true');
    setHasSeenOnboarding(true);
    console.log('🎯 Walkthrough enabled manually - no setup modal');
  };

  const disableWalkthrough = () => {
    try {
      console.log('🚫 Disabling walkthrough mode and clearing all demo data');
      disableWalkthroughMode();
      console.log('🚫 After disableWalkthroughMode, localStorage walkthrough_mode:', localStorage.getItem('walkthrough_mode'));
      setIsWalkthrough(false);
      setWalkthroughData(null);
      
      // IMPORTANT: Mark onboarding as completed AND tour as completed
      // This prevents ANY prompts from showing again
      localStorage.setItem('has_seen_onboarding', 'true');
      localStorage.setItem('tour_completed', 'true');
      setHasSeenOnboarding(true);
      
      console.log('🚫 Walkthrough state updated to false, onboarding and tour marked as completed');
      console.log('🚫 All demo data cleared - refreshing page automatically');
      
      // Automatically refresh the page to clear all demo data
      setTimeout(() => {
        console.log('🚫 Refreshing page to complete tour end');
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('❌ Error disabling walkthrough mode:', error);
      // Even if there's an error, try to clean up
      setIsWalkthrough(false);
      setWalkthroughData(null);
      // Still mark everything as completed to prevent future prompts
      localStorage.setItem('has_seen_onboarding', 'true');
      localStorage.setItem('tour_completed', 'true');
      setHasSeenOnboarding(true);
      // Still refresh the page
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const dismissWalkthroughPrompt = () => {
    setShowWalkthroughPrompt(false);
    // Mark onboarding as completed even if they skip
    localStorage.setItem('has_seen_onboarding', 'true');
    setHasSeenOnboarding(true);
    console.log('🎯 Onboarding dismissed - enabling walkthrough mode');
    // Enable walkthrough mode after dismissing onboarding
    enableWalkthroughMode();
    setIsWalkthrough(true);
    const data = getWalkthroughData();
    setWalkthroughData(data);
  };

  const resetOnboarding = () => {
    console.log('🔄 Resetting onboarding state');
    localStorage.removeItem('has_seen_onboarding');
    localStorage.removeItem('walkthrough_mode');
    setHasSeenOnboarding(false);
    setIsWalkthrough(false);
    setWalkthroughData(null);
    setShowWalkthroughPrompt(false);
  };

  const getMockData = (endpoint) => {
    console.log('🎯 getMockData called:', { endpoint, isWalkthrough, hasWalkthroughData: !!walkthroughData });
    
    if (!isWalkthrough || !walkthroughData) {
      console.log('🚫 No walkthrough data available');
      return null;
    }

    switch (endpoint) {
      case '/roasts?limit=100':
        console.log('🎯 Returning demo roasts:', walkthroughData.roasts?.length);
        return walkthroughData.roasts;
      case '/bean-profiles':
        console.log('🎯 Returning demo bean profiles:', walkthroughData.beanProfiles?.length);
        return walkthroughData.beanProfiles;
      default:
        if (endpoint.startsWith('/roasts/') && endpoint.endsWith('/events')) {
          const roastId = endpoint.split('/')[2];
          return walkthroughData.roastDetails[roastId] || [];
        }
        return null;
    }
  };

  const value = {
    isWalkthrough,
    walkthroughData,
    showWalkthroughPrompt,
    enableWalkthrough,
    disableWalkthrough,
    dismissWalkthroughPrompt,
    resetOnboarding,
    getMockData
  };

  return (
    <WalkthroughContext.Provider value={value}>
      {children}
    </WalkthroughContext.Provider>
  );
};
