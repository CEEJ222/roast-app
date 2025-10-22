import React, { useState, useEffect } from 'react';
import { COFFEE_REGIONS } from '../../data/coffeeRegions';
import CustomDropdown from '../ux_ui/CustomDropdown';
import BeanProfileForm from '../bean_profile/BeanProfileForm';
import BeanProfileSearch from '../bean_profile/BeanProfileSearch';
import MobileModal from '../shared/MobileModal';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app';

const StartNewRoastModal = ({
  isOpen,
  onClose,
  onStart,
  userProfile,
  userMachines,
  environmentalConditions,
  getAuthToken,
  setLoading,
  setShowProfilePage,
  refreshUserProfile
}) => {
  const [roastSetupStep, setRoastSetupStep] = useState('machine'); // 'machine', 'bean-profile', 'roast-parameters', 'review'
  const [beanProfileScreen, setBeanProfileScreen] = useState('choice'); // 'choice', 'select', 'create'
  const [formData, setFormData] = useState({
    selectedMachineId: '',
    model: 'SR800',
    hasExtension: false,
    address: '',
    roastLevel: 'City',
    weightBefore: '',
    roastTime: 10, // Default 10 minutes
    selectedBeanProfile: null,
    beanProfileMode: 'select' // 'select', 'create' - removed 'auto'
  });
  const [beanProfiles, setBeanProfiles] = useState([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isStartingRoast, setIsStartingRoast] = useState(false);

  // Load bean profiles when modal opens
  useEffect(() => {
    if (isOpen) {
      setRoastSetupStep('machine');
      setIsLoadingLocation(true);
      setIsStartingRoast(false);
      setFormData(prev => {
        const firstMachine = userMachines.length > 0 ? userMachines[0] : null;
        return {
          ...prev,
          address: userProfile?.address || '',
          selectedMachineId: firstMachine?.id || '',
          model: firstMachine?.model || 'SR800',
          hasExtension: firstMachine?.has_extension || false
        };
      });
      loadBeanProfiles();
      
      // Check if location is available immediately
      if (userProfile?.address) {
        setIsLoadingLocation(false);
      } else {
        // Set a shorter timeout and add a fallback
        const timeoutId = setTimeout(() => {
          setIsLoadingLocation(false);
        }, 500); // Reduced from 1000ms to 500ms
        
        // Clean up timeout if component unmounts or profile loads
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isOpen, userProfile?.address]); // Re-added userProfile.address dependency for proper reactivity

  // Separate effect to handle location loading state
  useEffect(() => {
    if (isOpen && userProfile?.address) {
      setIsLoadingLocation(false);
      // Update form data when profile loads
      setFormData(prev => ({
        ...prev,
        address: userProfile.address
      }));
    }
  }, [isOpen, userProfile?.address]);

  const loadBeanProfiles = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/bean-profiles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const profiles = await response.json();
        setBeanProfiles(profiles);
      }
    } catch (error) {
      console.error('Error loading bean profiles:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMachineSetup = () => {
    setRoastSetupStep('bean-profile');
  };

  const handleBeanProfileSetup = () => {
    setRoastSetupStep('roast-parameters');
  };

  const handleBeanProfileBack = () => {
    if (beanProfileScreen === 'choice') {
      setRoastSetupStep('machine');
    } else {
      setBeanProfileScreen('choice');
    }
  };

  const handleRoastParametersSetup = () => {
    setRoastSetupStep('review');
  };

  const handleStartRoast = async () => {
    if (!formData.selectedBeanProfile || !formData.weightBefore || userMachines.length === 0 || isStartingRoast) {
      return;
    }

    // Get the selected machine name or use a fallback
    const selectedMachine = userMachines.find(m => m.id === formData.selectedMachineId);
    const machineLabel = selectedMachine?.name || `${formData.model}${formData.hasExtension ? ' + ET' : ''}`;
    
    // Debug: Log the data being sent
    const requestData = {
      machine_label: machineLabel,
      address: formData.address,
      bean_profile_id: formData.selectedBeanProfile?.id,
      desired_roast_level: formData.roastLevel,
      weight_before_g: parseFloat(formData.weightBefore) || null,
      expected_roast_time_minutes: formData.roastTime
    };
    console.log('Starting roast with data:', requestData);
    
    setIsStartingRoast(true);
    setLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/roasts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      // Pass the roast data and roast time (bean profile will come from backend response)
      onStart(data, formData.roastTime);
      onClose();
    } catch (error) {
      console.error('Error starting roast:', error);
      alert('Failed to start roast. Please try again.');
    } finally {
      setLoading(false);
      setIsStartingRoast(false);
    }
  };

  const handleCancel = () => {
    setRoastSetupStep('machine');
    onClose();
  };

  const handleCloseAttempt = () => {
    setShowCloseConfirm(true);
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    handleCancel();
  };

  const handleLocationRefresh = async () => {
    setIsRefreshingLocation(true);
    if (refreshUserProfile) {
      await refreshUserProfile();
    }
    setIsRefreshingLocation(false);
    setShowProfilePage(true);
  };

  const handleBack = () => {
    if (roastSetupStep === 'bean-profile') {
      handleBeanProfileBack();
    } else if (roastSetupStep === 'roast-parameters') {
      setRoastSetupStep('bean-profile');
    } else if (roastSetupStep === 'review') {
      setRoastSetupStep('roast-parameters');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <MobileModal
        isOpen={isOpen}
        onClose={handleCloseAttempt}
        title="🔥 Start New Roast"
        subtitle="Configure your roast session"
        className="max-w-5xl"
        headerClassName="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant text-white"
      >
      {/* Progress Steps - Mobile Optimized */}
      <div className="bg-gray-50 dark:bg-dark-bg-tertiary px-4 sm:px-6 py-3 sm:py-4 border-b dark:border-dark-border-primary">
        <div className="flex items-center justify-between sm:justify-center sm:space-x-4">
          {/* Mobile: Show current step prominently with progress bar */}
          <div className="flex-1 sm:hidden">
            <div className="text-center">
              <div className="text-2xl mb-1">
                {roastSetupStep === 'machine' && '⚙️'}
                {roastSetupStep === 'bean-profile' && '☕'}
                {roastSetupStep === 'roast-parameters' && '🔥'}
                {roastSetupStep === 'review' && '✅'}
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                {roastSetupStep === 'machine' && 'Machine Setup'}
                {roastSetupStep === 'bean-profile' && 'Bean Profile'}
                {roastSetupStep === 'roast-parameters' && 'Roast Parameters'}
                {roastSetupStep === 'review' && 'Review & Start'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Step {['machine', 'bean-profile', 'roast-parameters', 'review'].indexOf(roastSetupStep) + 1} of 4
              </div>
              {/* Mobile progress bar */}
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((['machine', 'bean-profile', 'roast-parameters', 'review'].indexOf(roastSetupStep) + 1) / 4) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Desktop: Full progress bar */}
          <div className="hidden sm:flex items-center space-x-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center">
                <span className={`text-xl ${
                  roastSetupStep === 'machine' ? 'text-indigo-600' : 
                  ['bean-profile', 'coffee-details', 'roast-parameters', 'review'].includes(roastSetupStep) ? 'text-green-600' : 'text-gray-400'
                }`}>
                  ⚙️
                </span>
              </div>
              <span className={`ml-2 text-xs font-medium ${
                roastSetupStep === 'machine' ? 'text-indigo-600' : 
                ['bean-profile', 'coffee-details', 'roast-parameters', 'review'].includes(roastSetupStep) ? 'text-green-600' : 'text-gray-500'
              }`}>
                Machine
              </span>
            </div>
            <div className="w-6 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center">
                <span className={`text-xl ${
                  roastSetupStep === 'bean-profile' ? 'text-indigo-600' : 
                  ['coffee-details', 'roast-parameters', 'review'].includes(roastSetupStep) ? 'text-green-600' : 'text-gray-400'
                }`}>
                  ☕
                </span>
              </div>
              <span className={`ml-2 text-xs font-medium ${
                roastSetupStep === 'bean-profile' ? 'text-indigo-600' : 
                ['coffee-details', 'roast-parameters', 'review'].includes(roastSetupStep) ? 'text-green-600' : 'text-gray-500'
              }`}>
                Bean Profile
              </span>
            </div>
            <div className="w-6 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center">
                <span className={`text-xl ${
                  roastSetupStep === 'roast-parameters' ? 'text-indigo-600' : 
                  roastSetupStep === 'review' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  🔥
                </span>
              </div>
              <span className={`ml-2 text-xs font-medium ${
                roastSetupStep === 'roast-parameters' ? 'text-indigo-600' : 
                roastSetupStep === 'review' ? 'text-green-600' : 'text-gray-500'
              }`}>
                Roast Parameters
              </span>
            </div>
            <div className="w-6 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center">
                <span className={`text-xl ${
                  roastSetupStep === 'review' ? 'text-indigo-600' : 'text-gray-400'
                }`}>
                  ✅
                </span>
              </div>
              <span className={`ml-2 text-xs font-medium ${
                roastSetupStep === 'review' ? 'text-indigo-600' : 'text-gray-500'
              }`}>
                Review & Start
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Responsive Layout */}
      <div className="p-4 sm:p-6 lg:p-8 max-h-[calc(80vh-80px)] overflow-y-auto flex-1 min-h-0">
        {roastSetupStep === 'machine' && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Machine Setup */}
              <div className="space-y-4">
                
                {userMachines.length === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">No Machines Found</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          You need to add a machine to your profile before starting a roast.
                        </p>
                        <button
                          onClick={() => setShowProfilePage(true)}
                          className="mt-3 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors border border-red-600 min-h-[44px] flex items-center justify-center touch-manipulation"
                        >
                          Add Machine to Profile
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 lg:p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-200">Machine Selected</h4>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {userMachines.find(m => m.id === formData.selectedMachineId)?.name || userMachines[0]?.name}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {userMachines.find(m => m.id === formData.selectedMachineId)?.model || userMachines[0]?.model}
                          {userMachines.find(m => m.id === formData.selectedMachineId)?.has_extension || userMachines[0]?.has_extension ? ' + ET' : ''}
                        </p>
                        {userMachines.length > 1 && (
                          <CustomDropdown
                            options={userMachines.map(machine => ({
                              value: machine.id,
                              label: `${machine.name} (${machine.model}${machine.has_extension ? ' + ET' : ''})`
                            }))}
                            value={formData.selectedMachineId}
                            onChange={(value) => handleInputChange('selectedMachineId', value)}
                            placeholder="Select machine..."
                            className="mt-3"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Location Setup */}
              <div className="space-y-4">
                
                {isLoadingLocation ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">⏳</span>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Loading Location...</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Fetching your location data...
                        </p>
                      </div>
                    </div>
                  </div>
                ) : !formData.address ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">📍</span>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">No Location Set</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Set your location to get environmental data for your roasts.
                        </p>
                        <button
                          onClick={handleLocationRefresh}
                          disabled={isRefreshingLocation}
                          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center touch-manipulation"
                        >
                          {isRefreshingLocation ? 'Refreshing...' : 'Set Location'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 lg:p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-200">Location Set</h4>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {formData.address}
                        </p>
                        <button
                          onClick={handleLocationRefresh}
                          disabled={isRefreshingLocation}
                          className="mt-3 text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 py-2 px-3 rounded min-h-[36px] flex items-center justify-center touch-manipulation"
                        >
                          {isRefreshingLocation ? 'Refreshing...' : 'Refresh Location'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bean Profile Step - Responsive Layout */}
        {roastSetupStep === 'bean-profile' && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {beanProfileScreen === 'choice' && (
              <div className="space-y-6 lg:space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  <button
                    onClick={() => setBeanProfileScreen('select')}
                    className="p-6 lg:p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors text-center min-h-[140px] lg:min-h-[160px] flex flex-col items-center justify-center touch-manipulation"
                  >
                    <div className="text-4xl lg:text-5xl mb-3">☕</div>
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary text-lg">Select Existing</h4>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-2">
                      Choose from your saved bean profiles
                    </p>
                  </button>
                  
                  <button
                    onClick={() => setBeanProfileScreen('create')}
                    className="p-6 lg:p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors text-center min-h-[140px] lg:min-h-[160px] flex flex-col items-center justify-center touch-manipulation"
                  >
                    <div className="text-4xl lg:text-5xl mb-3">➕</div>
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary text-lg">Create New</h4>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-2">
                      Add a new bean profile
                    </p>
                  </button>
                </div>
              </div>
            )}

            {beanProfileScreen === 'select' && (
              <BeanProfileSearch
                beanProfiles={beanProfiles}
                selectedProfileId={formData.selectedBeanProfile?.id}
                onSelect={(profile) => {
                  handleInputChange('selectedBeanProfile', profile);
                  setRoastSetupStep('roast-parameters');
                }}
                defaultOpen={true}
              />
            )}

            {beanProfileScreen === 'create' && (
              <BeanProfileForm
                isOpen={true}
                onClose={() => setBeanProfileScreen('choice')}
                onSave={(profile) => {
                  handleInputChange('selectedBeanProfile', profile);
                  setRoastSetupStep('roast-parameters');
                }}
                getAuthToken={getAuthToken}
                onDataUpdate={loadBeanProfiles}
                hideHeader={true}
                showBackButton={true}
                onBack={() => setBeanProfileScreen('choice')}
              />
            )}
          </div>
        )}

        {/* Roast Parameters Step - Compact Layout */}
        {roastSetupStep === 'roast-parameters' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                  Desired Roast Level
                </label>
                <CustomDropdown
                  options={[
                    { value: 'City', label: 'City' },
                    { value: 'City+', label: 'City+' },
                    { value: 'Full City', label: 'Full City' },
                    { value: 'Full City+', label: 'Full City+' }
                  ]}
                  value={formData.roastLevel}
                  onChange={(value) => handleInputChange('roastLevel', value)}
                  placeholder="Select roast level..."
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                  Expected Roast Time (minutes)
                </label>
                <input
                  type="number"
                  value={formData.roastTime}
                  onChange={(e) => handleInputChange('roastTime', parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-dark-text-primary text-base"
                  min="5"
                  max="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                  Weight Before Roasting (grams)
                </label>
                <input
                  type="number"
                  value={formData.weightBefore}
                  onChange={(e) => handleInputChange('weightBefore', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-dark-text-primary text-base"
                  placeholder="Enter weight in grams"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Review Step - Responsive Layout */}
        {roastSetupStep === 'review' && (
          <div className="space-y-4 lg:space-y-6">
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary text-base">Machine</h4>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                      {userMachines.find(m => m.id === formData.selectedMachineId)?.name || 'Unknown'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary text-base">Bean Profile</h4>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                      {formData.selectedBeanProfile?.name || 'Not selected'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary text-base">Location</h4>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                      {formData.address || 'Not set'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary text-base">Roast Level</h4>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">{formData.roastLevel}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary text-base">Weight Before</h4>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                      {formData.weightBefore ? `${formData.weightBefore}g` : 'Not set'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary text-base">Expected Time</h4>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                      {formData.roastTime} minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Navigation Buttons - Always Visible at Bottom */}
      <div className="flex justify-between items-center pt-4 sm:pt-6 border-t dark:border-dark-border-primary bg-white dark:bg-dark-card flex-shrink-0">
        <div>
          {roastSetupStep !== 'machine' && (
            <button
              onClick={handleBack}
              className="px-4 py-3 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary font-medium transition min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              <span className="mr-1">←</span> Back
            </button>
          )}
        </div>
        
        <div>
          {roastSetupStep === 'machine' && (
            <button
              onClick={handleMachineSetup}
              disabled={userMachines.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              Next
            </button>
          )}
          
          {roastSetupStep === 'roast-parameters' && (
            <button
              onClick={handleRoastParametersSetup}
              disabled={!formData.weightBefore}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              Review
            </button>
          )}
          
            {roastSetupStep === 'review' && (
              <button
                onClick={handleStartRoast}
                disabled={!formData.selectedBeanProfile || !formData.weightBefore || userMachines.length === 0 || isStartingRoast}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg min-h-[44px] flex items-center justify-center touch-manipulation"
              >
                {isStartingRoast ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Starting...
                  </>
                ) : (
                  'Start Roast'
                )}
              </button>
            )}
        </div>
      </div>
      </MobileModal>

      {/* Close Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" style={{zIndex: 100}}>
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
              Cancel Roast Setup?
            </h3>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
              You have entered some roast configuration data. Are you sure you want to cancel and lose your progress?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Continue Setup
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cancel Setup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StartNewRoastModal;
