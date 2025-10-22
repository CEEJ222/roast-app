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
    <MobileModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="🔥 Start New Roast"
      subtitle="Configure your roast session"
      className="max-w-5xl"
      headerClassName="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant text-white"
    >
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
                ✅
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
                          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {isRefreshingLocation ? 'Refreshing...' : 'Set Location'}
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
                        <button
                          onClick={handleLocationRefresh}
                          disabled={isRefreshingLocation}
                          className="mt-2 text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
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

        {/* Bean Profile Step */}
        {roastSetupStep === 'bean-profile' && (
          <div className="space-y-6">
            {beanProfileScreen === 'choice' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Choose Bean Profile</h3>
                  <p className="text-gray-600 dark:text-dark-text-secondary">Select an existing bean profile or create a new one</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setBeanProfileScreen('select')}
                    className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors text-center"
                  >
                    <div className="text-4xl mb-2">☕</div>
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">Select Existing</h4>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                      Choose from your saved bean profiles
                    </p>
                  </button>
                  
                  <button
                    onClick={() => setBeanProfileScreen('create')}
                    className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors text-center"
                  >
                    <div className="text-4xl mb-2">➕</div>
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">Create New</h4>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                      Add a new bean profile
                    </p>
                  </button>
                </div>
              </div>
            )}

            {beanProfileScreen === 'select' && (
              <BeanProfileSearch
                beanProfiles={beanProfiles}
                selectedBeanProfile={formData.selectedBeanProfile}
                onSelectBeanProfile={(profile) => {
                  handleInputChange('selectedBeanProfile', profile);
                  setBeanProfileScreen('choice');
                }}
                onBack={() => setBeanProfileScreen('choice')}
              />
            )}

            {beanProfileScreen === 'create' && (
              <BeanProfileForm
                onSave={(profile) => {
                  handleInputChange('selectedBeanProfile', profile);
                  setBeanProfileScreen('choice');
                }}
                onCancel={() => setBeanProfileScreen('choice')}
                getAuthToken={getAuthToken}
                onDataChange={loadBeanProfiles}
              />
            )}
          </div>
        )}

        {/* Roast Parameters Step */}
        {roastSetupStep === 'roast-parameters' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Roast Parameters</h3>
              <p className="text-gray-600 dark:text-dark-text-secondary">Set your roast preferences</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-dark-text-primary"
                    min="5"
                    max="30"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                    Weight Before Roasting (grams)
                  </label>
                  <input
                    type="number"
                    value={formData.weightBefore}
                    onChange={(e) => handleInputChange('weightBefore', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-dark-text-primary"
                    placeholder="Enter weight in grams"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-dark-text-primary"
                    placeholder="Any special notes for this roast..."
                    rows="3"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Step */}
        {roastSetupStep === 'review' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Review & Start</h3>
              <p className="text-gray-600 dark:text-dark-text-secondary">Review your roast configuration</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">Machine</h4>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    {userMachines.find(m => m.id === formData.selectedMachineId)?.name || 'Unknown'}
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">Bean Profile</h4>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    {formData.selectedBeanProfile?.name || 'Not selected'}
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">Location</h4>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    {formData.address || 'Not set'}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">Roast Level</h4>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{formData.roastLevel}</p>
                  
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">Weight Before</h4>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    {formData.weightBefore ? `${formData.weightBefore}g` : 'Not set'}
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">Expected Time</h4>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    {formData.roastTime} minutes
                  </p>
                </div>
              </div>
              
              {formData.notes && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">Notes</h4>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{formData.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t dark:border-dark-border-primary">
          <div>
            {roastSetupStep !== 'machine' && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary font-medium transition"
              >
                ← Back
              </button>
            )}
          </div>
          
          <div>
            {roastSetupStep === 'machine' && (
              <button
                onClick={handleMachineSetup}
                disabled={userMachines.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Next
              </button>
            )}
            
            {roastSetupStep === 'bean-profile' && beanProfileScreen === 'choice' && (
              <button
                onClick={handleBeanProfileSetup}
                disabled={!formData.selectedBeanProfile}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Next
              </button>
            )}
            
            {roastSetupStep === 'roast-parameters' && (
              <button
                onClick={handleRoastParametersSetup}
                disabled={!formData.weightBefore}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Review
              </button>
            )}
            
            {roastSetupStep === 'review' && (
              <button
                onClick={handleStartRoast}
                disabled={!formData.selectedBeanProfile || !formData.weightBefore || userMachines.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Start Roast
              </button>
            )}
          </div>
        </div>
      </div>
    </MobileModal>
  );
};

export default StartNewRoastModal;
