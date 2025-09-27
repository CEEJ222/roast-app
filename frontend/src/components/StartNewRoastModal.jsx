import React, { useState, useEffect } from 'react';
import { COFFEE_REGIONS } from '../data/coffeeRegions';
import CustomDropdown from './CustomDropdown';

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
  setShowProfilePage
}) => {
  const [roastSetupStep, setRoastSetupStep] = useState('machine'); // 'machine', 'coffee', 'review'
  const [formData, setFormData] = useState({
    selectedMachineId: '',
    model: 'SR800',
    hasExtension: false,
    address: '',
    coffeeRegion: '',
    coffeeSubregion: '',
    coffeeType: '',
    coffeeProcess: '',
    roastLevel: 'medium',
    weightBefore: '',
    notes: ''
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRoastSetupStep('machine');
      setFormData(prev => ({
        ...prev,
        address: userProfile?.address || '',
        coffeeRegion: userProfile?.coffee_region || '',
        coffeeProcess: userProfile?.coffee_process || '',
        selectedMachineId: userMachines.length > 0 ? userMachines[0].id : ''
      }));
    }
  }, [isOpen]); // Only depend on isOpen to prevent infinite loops

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMachineSetup = () => {
    if (userMachines.length === 0) {
      setShowProfilePage(true);
      return;
    }
    setRoastSetupStep('coffee');
  };

  const handleCoffeeSetup = () => {
    if (!formData.coffeeRegion || !formData.coffeeProcess || !formData.weightBefore) {
      return;
    }
    setRoastSetupStep('review');
  };

  const handleStartRoast = async () => {
    if (!formData.coffeeRegion || !formData.coffeeProcess || !formData.weightBefore || userMachines.length === 0) {
      return;
    }

    // Get the selected machine name or use a fallback
    const selectedMachine = userMachines.find(m => m.id === formData.selectedMachineId);
    const machineLabel = selectedMachine?.name || `${formData.model}${formData.hasExtension ? ' + ET' : ''}`;
    
    // Debug: Log the data being sent
    const requestData = {
      machine_label: machineLabel,
      address: formData.address,
      coffee_region: formData.coffeeRegion,
      coffee_subregion: formData.coffeeSubregion,
      coffee_type: formData.coffeeType,
      coffee_process: formData.coffeeProcess,
      desired_roast_level: formData.roastLevel,
      weight_before_g: parseFloat(formData.weightBefore) || null,
      notes: formData.notes
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
      onStart(data);
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

  const handleBack = () => {
    if (roastSetupStep === 'coffee') {
      setRoastSetupStep('machine');
    } else if (roastSetupStep === 'review') {
      setRoastSetupStep('coffee');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
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
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className="flex items-center justify-center">
                <span className={`text-2xl ${
                  roastSetupStep === 'machine' ? 'text-indigo-600' : 
                  roastSetupStep === 'coffee' || roastSetupStep === 'review' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  ⚙️
                </span>
              </div>
              <span className={`ml-2 text-sm font-medium ${
                roastSetupStep === 'machine' ? 'text-indigo-600' : 
                roastSetupStep === 'coffee' || roastSetupStep === 'review' ? 'text-green-600' : 'text-gray-500'
              }`}>
                Machine Setup
              </span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center">
                <span className={`text-2xl ${
                  roastSetupStep === 'coffee' ? 'text-indigo-600' : 
                  roastSetupStep === 'review' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  ☕
                </span>
              </div>
              <span className={`ml-2 text-sm font-medium ${
                roastSetupStep === 'coffee' ? 'text-indigo-600' : 
                roastSetupStep === 'review' ? 'text-green-600' : 'text-gray-500'
              }`}>
                Coffee Details
              </span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center">
                <span className={`text-2xl ${
                  roastSetupStep === 'review' ? 'text-indigo-600' : 'text-gray-400'
                }`}>
                  ✓
                </span>
              </div>
              <span className={`ml-2 text-sm font-medium ${
                roastSetupStep === 'review' ? 'text-indigo-600' : 'text-gray-500'
              }`}>
                Review & Start
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
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
                  
                  {!formData.address ? (
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
                            onClick={() => setShowProfilePage(true)}
                            className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Set Location in Profile
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

          {roastSetupStep === 'coffee' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coffee Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Coffee Selection</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                      Coffee Region *
                    </label>
                    <CustomDropdown
                      options={COFFEE_REGIONS}
                      value={formData.coffeeRegion}
                      onChange={(value) => handleInputChange('coffeeRegion', value)}
                      placeholder="Select a region..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                      Processing Method *
                    </label>
                    <CustomDropdown
                      options={['Washed', 'Natural', 'Honey', 'Anaerobic', 'Other']}
                      value={formData.coffeeProcess}
                      onChange={(value) => handleInputChange('coffeeProcess', value)}
                      placeholder="Select process..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                      Origin (Subregion)
                    </label>
                    <input
                      type="text"
                      value={formData.coffeeSubregion}
                      onChange={(e) => handleInputChange('coffeeSubregion', e.target.value)}
                      placeholder="e.g., Yirgacheffe, Sidama, etc."
                      className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                      Coffee Type
                    </label>
                    <input
                      type="text"
                      value={formData.coffeeType}
                      onChange={(e) => handleInputChange('coffeeType', e.target.value)}
                      placeholder="e.g., Bourbon, Typica, Gesha"
                      className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                    />
                  </div>
                </div>

                {/* Roast Parameters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Roast Parameters</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                      Desired Roast Level
                    </label>
                    <CustomDropdown
                      options={['light', 'medium-light', 'medium', 'medium-dark', 'dark']}
                      value={formData.roastLevel}
                      onChange={(value) => handleInputChange('roastLevel', value)}
                      placeholder="Select roast level..."
                    />
                  </div>

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
                        !formData.weightBefore && roastSetupStep === 'coffee' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 dark:border-dark-border-primary focus:ring-indigo-500'
                      }`}
                    />
                    {!formData.weightBefore && roastSetupStep === 'coffee' && (
                      <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                        Weight is required to start the roast
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Any special notes for this roast..."
                      rows={3}
                      className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {roastSetupStep === 'review' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Review Your Roast Setup</h3>
              
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

                {/* Coffee Details */}
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-dark-text-primary mb-3">Coffee Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-secondary">Region:</span>
                        <span className="text-gray-900 dark:text-dark-text-primary">{formData.coffeeRegion || 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-secondary">Type:</span>
                        <span className="text-gray-900 dark:text-dark-text-primary">{formData.coffeeType || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-secondary">Process:</span>
                        <span className="text-gray-900 dark:text-dark-text-primary">{formData.coffeeProcess || 'Not selected'}</span>
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
                Next: Coffee Details
              </button>
            )}
            
            {roastSetupStep === 'coffee' && (
              <button
                onClick={handleCoffeeSetup}
                disabled={!formData.coffeeRegion || !formData.coffeeProcess || !formData.weightBefore}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Next: Review
              </button>
            )}
            
            {roastSetupStep === 'review' && (
              <button
                onClick={handleStartRoast}
                disabled={!formData.coffeeRegion || !formData.coffeeProcess || !formData.weightBefore || userMachines.length === 0}
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
