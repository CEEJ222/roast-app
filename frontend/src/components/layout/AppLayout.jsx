import React, { useState, useEffect } from 'react';
import BottomNavigation from '../navigation/BottomNavigation';
import RoastsPage from '../mobile-pages/RoastsPage';
import BeansPage from '../mobile-pages/BeansPage';
import ProfilePage from '../mobile-pages/ProfilePage';
import FeedbackPage from '../mobile-pages/FeedbackPage';
import Dashboard from '../dashboard/Dashboard';
import useMobileGestures from '../../hooks/useMobileGestures';

const AppLayout = ({
  // All the props that were passed to Dashboard
  historicalRoasts,
  recentRoastDetails,
  userProfile,
  setShowStartRoastWizard,
  setShowHistoricalRoasts,
  handleRoastResume,
  selectedRoasts,
  setSelectedRoasts,
  roastDetails,
  setRoastDetails,
  roastId,
  getAuthToken,
  onDataChange = null,
  setUserProfile,
  setLoading,
  setShowProfilePage,
  refreshUserProfile
}) => {
  const [activeTab, setActiveTab] = useState('roasts');
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Tab navigation
  const tabs = ['roasts', 'beans', 'profile', 'feedback'];
  const currentIndex = tabs.indexOf(activeTab);

  const handleSwipeLeft = () => {
    if (isMobile && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const handleSwipeRight = () => {
    if (isMobile && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  // Mobile gestures
  useMobileGestures(handleSwipeLeft, handleSwipeRight);

  const renderActivePage = () => {
    // On desktop, always show the traditional Dashboard
    if (!isMobile) {
      return (
        <Dashboard
          historicalRoasts={historicalRoasts}
          recentRoastDetails={recentRoastDetails}
          userProfile={userProfile}
          setShowStartRoastWizard={setShowStartRoastWizard}
          setShowHistoricalRoasts={setShowHistoricalRoasts}
          handleRoastResume={handleRoastResume}
          selectedRoasts={selectedRoasts}
          setSelectedRoasts={setSelectedRoasts}
          roastDetails={roastDetails}
          setRoastDetails={setRoastDetails}
          roastId={roastId}
          getAuthToken={getAuthToken}
          onDataChange={onDataChange}
        />
      );
    }

    // On mobile, show the new tab-based layout
    switch (activeTab) {
      case 'roasts':
        return (
          <RoastsPage
            historicalRoasts={historicalRoasts}
            recentRoastDetails={recentRoastDetails}
            userProfile={userProfile}
            setShowStartRoastWizard={setShowStartRoastWizard}
            setShowHistoricalRoasts={setShowHistoricalRoasts}
            handleRoastResume={handleRoastResume}
            selectedRoasts={selectedRoasts}
            setSelectedRoasts={setSelectedRoasts}
            roastDetails={roastDetails}
            setRoastDetails={setRoastDetails}
            roastId={roastId}
            getAuthToken={getAuthToken}
            onDataChange={onDataChange}
            setActiveTab={setActiveTab}
          />
        );
      case 'beans':
        return (
          <BeansPage
            getAuthToken={getAuthToken}
            onDataChange={onDataChange}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            getAuthToken={getAuthToken}
            setLoading={setLoading}
            setShowProfilePage={setShowProfilePage}
            refreshUserProfile={refreshUserProfile}
          />
        );
      case 'feedback':
        return <FeedbackPage />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Main Content */}
      {renderActivePage()}

      {/* Bottom Navigation - only show on mobile */}
      {isMobile && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </>
  );
};

export default AppLayout;
