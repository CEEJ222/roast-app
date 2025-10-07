import React, { useState, useEffect } from 'react';
import { COFFEE_REGIONS } from '../../data/coffeeRegions';
import CustomDropdown from '../ux_ui/CustomDropdown';
import BeanProfileForm from '../bean_profile/BeanProfileForm';
import BeanProfileSearch from '../bean_profile/BeanProfileSearch';

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
    notes: '',
    selectedBeanProfile: null,
    beanProfileMode: 'select' // 'select', 'create' - removed 'auto'
  });
  const [beanProfiles, setBeanProfiles] = useState([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  // Load bean profiles when modal opens
  useEffect(() => {
    if (isOpen) {
      setRoastSetupStep('machine');
      setIsLoadingLocation(true);
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
    if (userMachines.length === 0) {
      setShowProfilePage(true);
      return;
    }
    setRoastSetupStep('bean-profile');
  };

  const handleBeanProfileSetup = () => {
    setRoastSetupStep('roast-parameters');
  };

  const handleBeanProfileChoice = (choice) => {
    if (choice === 'select') {
      setBeanProfileScreen('select');
    } else if (choice === 'create') {
      setBeanProfileScreen('create');
    }
  };

  const handleBeanProfileBack = () => {
    if (beanProfileScreen === 'select' || beanProfileScreen === 'create') {
      setBeanProfileScreen('choice');
    } else {
      setRoastSetupStep('machine');
    }
  };

  // Removed handleCoffeeDetailsSetup - no longer needed

  const handleRoastParametersSetup = () => {
    if (!formData.weightBefore) {
      return;
    }
    setRoastSetupStep('review');
  };

  const handleStartRoast = async () => {
    if (!formData.selectedBeanProfile || !formData.weightBefore || userMachines.length === 0) {
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
      expected_roast_time_minutes: formData.roastTime,
      notes: formData.notes || null
    };
      console.log('Starting roast with data:', requestData);
    
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
    }
  };

  const handleCancel = () => {
    setRoastSetupStep('machine');
    onClose();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-5xl max-h-[98vh] sm:max-h-[98vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">🏁 Start New Roast</h2>
              <p className="opacity-90">Configure your roast session</p>
            </div>
            <button
              onClick={handleCancel}
              className="text-white hover:text-indigo-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-gray-50 dark:bg-dark-bg-tertiary px-6 py-4 border-b dark:border-dark-border-primary">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center">
                <span className={`text-xl ${
                  roastSetupStep === 'machine' ? 'text-indigo-600' : 
                  ['bean-profile', 'coffee-details', 'roast-parameters', 'review'].includes(roastSetupStep) ? 'text-green-600' : 'text-gray-400'
                }`}>
                  ⚙️
                </span>
              </div>
              <span className={`ml-2 text-xs font-medium hidden sm:block ${
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
              <span className={`ml-2 text-xs font-medium hidden sm:block ${
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
              <span className={`ml-2 text-xs font-medium hidden sm:block ${
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
                  ✓
                </span>
              </div>
              <span className={`ml-2 text-xs font-medium hidden sm:block ${
                roastSetupStep === 'review' ? 'text-indigo-600' : 'text-gray-500'
              }`}>
                Review & Start
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {roastSetupStep === 'machine' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Machine Setup */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Machine Setup</h3>
                  
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
                            className="mt-3 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-600"
                          >
                            Add Machine to Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
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
                              className="mt-2"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location Setup */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Location</h3>
                  
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
                            className="mt-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            {isRefreshingLocation ? 'Refreshing...' : 'Set Location in Profile'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <span className="text-2xl">✅</span>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-green-800 dark:text-green-200">Location Set</h4>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            {formData.address}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Environmental data will be fetched automatically
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bean Profile Step */}
          {roastSetupStep === 'bean-profile' && (
            <div className="space-y-6">
              {/* Choice Screen - Show when user has existing profiles */}
              {beanProfileScreen === 'choice' && beanProfiles.length > 0 && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Bean Profile Selection</h3>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-6">
                      You have {beanProfiles.length} existing bean profile{beanProfiles.length !== 1 ? 's' : ''}. How would you like to proceed?
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <button
                      onClick={() => handleBeanProfileChoice('select')}
                      className="w-full p-4 border-2 border-gray-200 dark:border-dark-border-primary rounded-lg hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">📋</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-dark-text-primary">Select Existing Profile</div>
                          <div className="text-sm text-gray-500 dark:text-dark-text-secondary">Choose from your saved bean profiles</div>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleBeanProfileChoice('create')}
                      className="w-full p-4 border-2 border-gray-200 dark:border-dark-border-primary rounded-lg hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">✨</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-dark-text-primary">Create New Profile</div>
                          <div className="text-sm text-gray-500 dark:text-dark-text-secondary">Add a new bean profile with detailed information</div>
                        </div>
                      </div>
                    </button>
                    
                    {/* Quick Start option removed - bean profiles must be created explicitly */}
                  </div>
                </div>
              )}

              {/* Choice Screen - Show when user has no existing profiles */}
              {beanProfileScreen === 'choice' && beanProfiles.length === 0 && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Bean Profile Selection</h3>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-6">
                      You don't have any saved bean profiles yet. How would you like to proceed?
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <button
                      onClick={() => handleBeanProfileChoice('create')}
                      className="w-full p-4 border-2 border-gray-200 dark:border-dark-border-primary rounded-lg hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">✨</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-dark-text-primary">Create New Profile</div>
                          <div className="text-sm text-gray-500 dark:text-dark-text-secondary">Add a detailed bean profile for better AI coaching</div>
                        </div>
                      </div>
                    </button>
                    
                    {/* Quick Start option removed - bean profiles must be created explicitly */}
                  </div>
                </div>
              )}

              {/* Select Existing Profile Screen */}
              {beanProfileScreen === 'select' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Select Bean Profile</h3>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-6">
                      Choose from your existing bean profiles:
                    </p>
                  </div>
                  
                  <div className="min-h-[400px]">
                  <BeanProfileSearch
                    beanProfiles={beanProfiles}
                    onSelect={(profile) => {
                      console.log('Bean profile selected:', profile);
                      if (profile) {
                        setFormData(prev => {
                          const newData = {
                            ...prev,
                            selectedBeanProfile: profile,  // Store the full profile object, not just ID
                            beanProfileMode: 'select'
                          };
                          console.log('Updated formData with bean profile:', newData.selectedBeanProfile);
                          return newData;
                        });
                        // Go directly to roast parameters
                        setRoastSetupStep('roast-parameters');
                      } else {
                        handleInputChange('selectedBeanProfile', null);
                        handleInputChange('beanProfileMode', 'select');
                      }
                    }}
                    selectedProfileId={formData.selectedBeanProfile?.id}
                    placeholder="Search bean profiles..."
                    showDetails={true}
                    defaultOpen={true}
                  />
                  </div>
                </div>
              )}

              {/* Create New Profile Screen */}
              {beanProfileScreen === 'create' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Create New Bean Profile</h3>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-6">
                      Create a detailed bean profile for better AI coaching and roast recommendations.
                    </p>
                  </div>
                  
                  <div className="min-h-[500px]">
                    <BeanProfileForm
                      isOpen={true}
                      onClose={() => {
                        setBeanProfileScreen('choice');
                      }}
                      onSave={(profile) => {
                        console.log('DEBUG: BeanProfileForm onSave callback received:', profile);
                        // Update the bean profiles list
                        setBeanProfiles(prev => [profile, ...prev]);
                        // Set the selected profile and advance to next step
                        setFormData(prev => ({
                          ...prev,
                          selectedBeanProfile: profile, // Store the full profile object, not just ID
                          beanProfileMode: 'create'
                        }));
                        // Skip coffee details step and go directly to roast parameters
                        setRoastSetupStep('roast-parameters');
                      }}
                      onDataUpdate={(updatedData) => {
                        // Update the parent form data when HTML parsing completes
                        setFormData(prev => ({
                          ...prev,
                          coffeeRegion: updatedData.origin || prev.coffeeRegion,
                          coffeeType: updatedData.variety || prev.coffeeType,
                          coffeeProcess: updatedData.process_method || prev.coffeeProcess,
                          coffeeSubregion: updatedData.origin || prev.coffeeSubregion
                        }));
                      }}
                      getAuthToken={getAuthToken}
                      beanProfileId={null} // This is a new profile
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Coffee Details Step removed - data now comes from bean profiles */}

          {/* Roast Parameters Step */}
          {roastSetupStep === 'roast-parameters' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Roast Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                      Desired Roast Level
                    </label>
                    <CustomDropdown
                      options={['City', 'City+', 'Full City', 'Full City+']}
                      value={formData.roastLevel}
                      onChange={(value) => handleInputChange('roastLevel', value)}
                      placeholder="Select roast level..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                        Weight Before Roast (grams) *
                      </label>
                      <input
                        type="number"
                        value={formData.weightBefore}
                        onChange={(e) => handleInputChange('weightBefore', e.target.value)}
                        placeholder="e.g., 250"
                        min="0"
                        step="1"
                        required
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary ${
                          !formData.weightBefore && roastSetupStep === 'roast-parameters' 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 dark:border-dark-border-primary focus:ring-indigo-500'
                        }`}
                      />
                      {!formData.weightBefore && roastSetupStep === 'roast-parameters' && (
                        <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                          Weight is required to start the roast
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                        Expected Roast Time (minutes) *
                      </label>
                      <input
                        type="number"
                        value={formData.roastTime}
                        onChange={(e) => handleInputChange('roastTime', parseInt(e.target.value) || 10)}
                        placeholder="e.g., 10"
                        min="5"
                        max="20"
                        step="1"
                        required
                        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Most FreshRoast roasts are 8-12 minutes
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {roastSetupStep === 'review' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Review Your Roast Setup</h3>
              {console.log('DEBUG: Review step - formData.selectedBeanProfile:', formData.selectedBeanProfile)}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Machine & Location */}
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-dark-text-primary mb-3">Machine & Location</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-secondary">Machine:</span>
                        <span className="text-gray-900 dark:text-dark-text-primary">
                          {userMachines.find(m => m.id === formData.selectedMachineId)?.name || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-secondary">Location:</span>
                        <span className="text-gray-900 dark:text-dark-text-primary">
                          {formData.address || 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bean Profile Details */}
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-dark-text-primary mb-3">Bean Profile</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-secondary">Profile:</span>
                        <span className="text-gray-900 dark:text-dark-text-primary">
                          {formData.selectedBeanProfile?.name || 'Not selected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-secondary">Origin:</span>
                        <span className="text-gray-900 dark:text-dark-text-primary">
                          {formData.selectedBeanProfile?.origin || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-secondary">Variety:</span>
                        <span className="text-gray-900 dark:text-dark-text-primary">
                          {formData.selectedBeanProfile?.variety || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-secondary">Process:</span>
                        <span className="text-gray-900 dark:text-dark-text-primary">
                          {formData.selectedBeanProfile?.process_method || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-secondary">Roast Level:</span>
                        <span className="text-gray-900 dark:text-dark-text-primary capitalize">{formData.roastLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-secondary">Weight:</span>
                        <span className="text-gray-900 dark:text-dark-text-primary">
                          {formData.weightBefore ? `${formData.weightBefore}g` : 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-secondary">Expected Time:</span>
                        <span className="text-gray-900 dark:text-dark-text-primary">
                          {formData.roastTime ? `${formData.roastTime} minutes` : 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {formData.notes && (
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-dark-text-primary mb-2">Notes</h4>
                  <p className="text-sm text-gray-700 dark:text-dark-text-secondary">{formData.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-dark-bg-tertiary px-6 py-4 flex justify-between items-center border-t dark:border-dark-border-primary">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary font-medium transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex space-x-3">
            {roastSetupStep !== 'machine' && (
              <button
                onClick={handleBack}
                className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 font-medium transition"
              >
                Back
              </button>
            )}
            
            {roastSetupStep === 'machine' && (
              <button
                onClick={handleMachineSetup}
                disabled={userMachines.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Next: Bean Profile
              </button>
            )}
            
            {roastSetupStep === 'bean-profile' && beanProfileScreen === 'choice' && (
              <div className="text-sm text-gray-500 dark:text-dark-text-secondary">
                Choose an option above to continue
              </div>
            )}
            
            {roastSetupStep === 'bean-profile' && beanProfileScreen === 'select' && (
              <div className="text-sm text-gray-500 dark:text-dark-text-secondary">
                Select a profile to continue
              </div>
            )}
            
            {roastSetupStep === 'bean-profile' && beanProfileScreen === 'create' && (
              <div className="text-sm text-gray-500 dark:text-dark-text-secondary">
                Click the button above to create a profile
              </div>
            )}
            
            {/* Coffee details step removed */}
            
            {roastSetupStep === 'roast-parameters' && (
              <button
                onClick={handleRoastParametersSetup}
                disabled={!formData.weightBefore}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Next: Review
              </button>
            )}
            
            {roastSetupStep === 'review' && (
              <button
                onClick={handleStartRoast}
                disabled={!formData.selectedBeanProfile || !formData.weightBefore || userMachines.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                🏁 Start Roast Session
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default StartNewRoastModal;

