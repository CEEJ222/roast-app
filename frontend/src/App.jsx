import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import UserProfile from './components/UserProfile';
import SetupWizard from './components/SetupWizard';
import ProfilePage from './components/ProfilePage';
import EnvironmentalConditions from './components/EnvironmentalConditions';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

// Using inline editing instead of modal

function RoastAssistant() {
  const { user, getAuthToken, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [userMachines, setUserMachines] = useState([]);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [environmentalConditions, setEnvironmentalConditions] = useState(null);
  const [currentTab, setCurrentTab] = useState('before');
  const [roastId, setRoastId] = useState(null);
  const [startTs, setStartTs] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingFormData, setEditingFormData] = useState({});
  const [showInitialSettings, setShowInitialSettings] = useState(false);
  const [initialSettings, setInitialSettings] = useState({
    fan_level: 5,
    heat_level: 5
  });
  const [roastEnded, setRoastEnded] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    model: 'SR800',
    hasExtension: true,
    address: '',
    coffeeRegion: '',
    coffeeType: '',
    coffeeProcess: 'Washed',
    roastLevel: 'City',
    weightBefore: '',
    notes: '',
    fan: 5,
    heat: 5,
    tempF: '',
    weightAfter: ''
  });

  // Timer effect
  useEffect(() => {
    if (!startTs) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTs * 1000) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTs]);

  // Load user profile data
  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Load user machines data
  const loadUserMachines = async () => {
    if (!user) return;
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/user/machines`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const machines = await response.json();
        setUserMachines(machines);
      }
    } catch (error) {
      console.error('Error loading user machines:', error);
    }
  };

  // Check if user has completed setup
  useEffect(() => {
    const checkSetupStatus = async () => {
      if (user && !setupComplete) {
        try {
          const token = await getAuthToken();
          const response = await fetch(`${API_BASE}/user/machines`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const machines = await response.json();
            // If user has no machines, show setup wizard
            if (machines.length === 0) {
              setShowSetupWizard(true);
            } else {
              setSetupComplete(true);
            }
          }
        } catch (error) {
          console.error('Error checking setup status:', error);
          // On error, assume setup is needed
          setShowSetupWizard(true);
        }
      }
    };

    checkSetupStatus();
    loadUserProfile();
    loadUserMachines();
  }, [user, setupComplete, getAuthToken]);

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    setSetupComplete(true);
  }

  // Set form data to user profile settings when available
  useEffect(() => {
    if (userProfile?.address) {
      setFormData(prev => ({
        ...prev,
        address: userProfile.address
      }));
    }
  }, [userProfile?.address]);

  // Set form machine data to user's first machine when available
  useEffect(() => {
    if (userMachines.length > 0) {
      const firstMachine = userMachines[0];
      setFormData(prev => ({
        ...prev,
        selectedMachineId: firstMachine.id,
        model: firstMachine.model,
        hasExtension: firstMachine.has_extension
      }));
    }
  }, [userMachines]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const apiCall = async (url, options = {}) => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        headers,
        ...options
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const showInitialSettingsForm = () => {
    setShowInitialSettings(true);
  };

  const startRoast = async () => {
    // Get the selected machine name or use a fallback
    const selectedMachine = userMachines.find(m => m.id === formData.selectedMachineId);
    const machineLabel = selectedMachine?.name || `${formData.model}${formData.hasExtension ? ' + ET' : ''}`;
    
    try {
      const data = await apiCall(`${API_BASE}/roasts`, {
        method: 'POST',
        body: JSON.stringify({
          machine_label: machineLabel,
          address: formData.address,
          coffee_region: formData.coffeeRegion,
          coffee_type: formData.coffeeType,
          coffee_process: formData.coffeeProcess,
          desired_roast_level: formData.roastLevel,
          weight_before_g: parseFloat(formData.weightBefore) || null,
          notes: formData.notes
        })
      });

      setRoastId(data.roast_id);
      setStartTs(data.start_ts);
      setCurrentTab('during');
      setEnvironmentalConditions(data.env);
      
      // Create initial SET event with user-provided settings
      if (initialSettings.fan_level || initialSettings.heat_level) {
        await apiCall(`${API_BASE}/roasts/${data.roast_id}/events`, {
          method: 'POST',
          body: JSON.stringify({
            kind: 'SET',
            fan_level: initialSettings.fan_level ? parseInt(initialSettings.fan_level) : null,
            heat_level: initialSettings.heat_level ? parseInt(initialSettings.heat_level) : null,
            note: 'Initial settings'
          })
        });
      }
      
      refreshEvents(data.roast_id);
      setShowInitialSettings(false);
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  const logChange = async () => {
    if (!roastId) return;

    try {
      await apiCall(`${API_BASE}/roasts/${roastId}/events`, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'SET',
          fan_level: formData.fan,
          heat_level: formData.heat,
          temp_f: parseFloat(formData.tempF) || null
        })
      });

      const tempStr = formData.tempF ? `, ${formData.tempF}°F` : '';
      setStatus(`⚙️ Change @ ${formatTime(elapsedTime)} — Fan ${formData.fan}, Heat ${formData.heat}${tempStr}`);
      refreshEvents();
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  const markMilestone = async (kind) => {
    if (!roastId) return;

    try {
      await apiCall(`${API_BASE}/roasts/${roastId}/events`, {
        method: 'POST',
        body: JSON.stringify({ kind })
      });

      refreshEvents();
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  const refreshEvents = async (id = roastId) => {
    if (!id) return;
    try {
      const data = await apiCall(`${API_BASE}/roasts/${id}/events`);
      // Your backend returns the array directly, not wrapped in an object
      setEvents(data); // This is correct
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const finishRoast = async () => {
    if (!roastId) return;

    try {
      await apiCall(`${API_BASE}/roasts/${roastId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          weight_after_g: parseFloat(formData.weightAfter) || null
        })
      });

      setStatus(`✅ Roast finished! Weight out: ${formData.weightAfter}g`);
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  const deleteEvent = async (eventId) => {
    if (!roastId || !eventId) return;

    try {
      await apiCall(`${API_BASE}/roasts/${roastId}/events/${eventId}`, {
        method: 'DELETE'
      });

      setStatus(`🗑️ Event deleted`);
      refreshEvents();
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  const startEditEvent = (event) => {
    setEditingEventId(event.id);
    setEditingFormData({
      kind: event.kind,
      fan_level: event.fan_level || '',
      heat_level: event.heat_level || '',
      temp_f: event.temp_f || '',
      note: event.note || ''
    });
  };

  const cancelEdit = () => {
    setEditingEventId(null);
    setEditingFormData({});
  };

  const saveEditedEvent = async (eventId) => {
    if (!roastId) return;

    try {
      await apiCall(`${API_BASE}/roasts/${roastId}/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify({
          kind: editingFormData.kind,
          fan_level: editingFormData.fan_level ? parseInt(editingFormData.fan_level) : null,
          heat_level: editingFormData.heat_level ? parseInt(editingFormData.heat_level) : null,
          temp_f: editingFormData.temp_f ? parseFloat(editingFormData.temp_f) : null,
          note: editingFormData.note || null
        })
      });

      setStatus(`✏️ Event updated`);
      setEditingEventId(null);
      setEditingFormData({});
      refreshEvents();
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  const endRoastSession = async () => {
    if (!roastId) return;

    try {
      // Create an END event to mark the roast completion
      await apiCall(`${API_BASE}/roasts/${roastId}/events`, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'END',
          note: 'Roast session ended'
        })
      });

      setRoastEnded(true);
      setCurrentTab('after');
      setEnvironmentalConditions(null);
      refreshEvents();
    } catch (error) {
      // Error already handled in apiCall
    }
  };


  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if user is not authenticated
  if (!user) {
    return <LoginForm />;
  }

  // Show setup wizard if user hasn't completed setup
  if (showSetupWizard) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">☕ FreshRoast Assistant</h1>
              <p className="opacity-90">Professional roast logging and analysis</p>
            </div>
            <UserProfile />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {[
            { key: 'before', label: '1) Before', icon: '🚦' },
            { key: 'during', label: '2) During', icon: '⏱️' },
            { key: 'after', label: '3) After', icon: '✅' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrentTab(tab.key)}
              disabled={tab.key === 'during' && !roastId}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                currentTab === tab.key
                  ? 'border-b-3 border-orange-500 text-orange-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              } ${tab.key === 'during' && !roastId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Loading indicator */}
          {loading && (
            <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-700">
              Processing...
            </div>
          )}


          {/* Before Tab */}
          {currentTab === 'before' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Setup Your Roast</h2>
                <p className="text-gray-600">Configure your machine and coffee details</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Machine Setup</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Machine <span className="text-red-500">*</span>
                    </label>
                    {userMachines.length === 0 ? (
                      <button
                        onClick={() => setShowProfilePage(true)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 italic hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
                      >
                        <span>Click to add a machine in your profile settings</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    ) : userMachines.length === 1 ? (
                      <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700">
                        {userMachines[0].name}
                      </div>
                    ) : (
                      <select
                        value={formData.selectedMachineId || userMachines[0]?.id}
                        onChange={(e) => {
                          const selectedMachine = userMachines.find(m => m.id === e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            selectedMachineId: e.target.value,
                            model: selectedMachine?.model || '',
                            hasExtension: selectedMachine?.has_extension || false
                          }));
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                      >
                        {userMachines.map((machine) => (
                          <option key={machine.id} value={machine.id}>
                            {machine.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roasting Location</label>
                    {userProfile?.address ? (
                      <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700">
                        {userProfile.address}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowProfilePage(true)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 italic hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
                      >
                        <span>Click to add an address in your profile settings</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      We'll fetch elevation, temperature, humidity, and pressure data for this roast.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Coffee Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coffee Region <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.coffeeType}
                      onChange={(e) => handleInputChange('coffeeType', e.target.value)}
                      placeholder="Ethiopia"
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        !formData.coffeeType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Origin (Subregion)</label>
                    <input
                      type="text"
                      value={formData.coffeeRegion}
                      onChange={(e) => handleInputChange('coffeeRegion', e.target.value)}
                      placeholder="Yirgacheffe, Sidama, etc."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Process <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.coffeeProcess}
                        onChange={(e) => handleInputChange('coffeeProcess', e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          !formData.coffeeProcess ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="Washed">Washed</option>
                        <option value="Natural">Natural</option>
                        <option value="Honey">Honey</option>
                        <option value="Anaerobic">Anaerobic</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Roast</label>
                      <select
                        value={formData.roastLevel}
                        onChange={(e) => handleInputChange('roastLevel', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="City">City</option>
                        <option value="City Plus">City Plus</option>
                        <option value="Full City">Full City</option>
                        <option value="Full City Plus">Full City Plus</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight Before Roast (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weightBefore}
                      onChange={(e) => handleInputChange('weightBefore', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={showInitialSettingsForm}
                  disabled={loading || !formData.coffeeType || !formData.coffeeProcess || userMachines.length === 0}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-lg hover:from-orange-700 hover:to-red-700 font-bold text-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  🚦 Start Roast Session
                </button>
              </div>
            </div>
          )}

          {/* Initial Settings Modal */}
          {showInitialSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold mb-4">Initial Roaster Settings</h3>
                <p className="text-gray-600 mb-4">Set your starting fan and heat levels before beginning the roast.</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fan Level</label>
                      <input
                        type="number"
                        min="0"
                        max="9"
                        value={initialSettings.fan_level}
                        onChange={(e) => setInitialSettings(prev => ({ ...prev, fan_level: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Heat Level</label>
                      <input
                        type="number"
                        min="0"
                        max="9"
                        value={initialSettings.heat_level}
                        onChange={(e) => setInitialSettings(prev => ({ ...prev, heat_level: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    onClick={startRoast}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4 rounded-lg hover:from-orange-700 hover:to-red-700 font-medium transition"
                  >
                    🔥 Start Roast
                  </button>
                  <button
                    onClick={() => setShowInitialSettings(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* During Tab */}
          {currentTab === 'during' && (
            <div className="space-y-6">
              <div className="text-center mb-6 relative">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Active Roast Session</h2>
                <div className="text-5xl font-mono font-bold text-orange-600 bg-gray-100 rounded-lg py-4">
                  ⏱️ {formatTime(elapsedTime)}
                </div>
                
                {/* Environmental Conditions - Upper Right */}
                {environmentalConditions && (
                  <div className="absolute top-0 right-0 max-w-xs">
                    <EnvironmentalConditions 
                      conditions={environmentalConditions} 
                      units={userProfile?.units}
                    />
                  </div>
                )}
                
                <div className="mt-4">
                  <button
                    onClick={endRoastSession}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold text-lg shadow-lg transform transition hover:scale-105"
                  >
                    🛑 End Roast Session
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Roaster Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fan: {formData.fan}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="9"
                      value={formData.fan}
                      onChange={(e) => handleInputChange('fan', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>9</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heat: {formData.heat}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="9"
                      value={formData.heat}
                      onChange={(e) => handleInputChange('heat', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>9</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">BT/ET Temp (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.tempF}
                      onChange={(e) => handleInputChange('tempF', e.target.value)}
                      placeholder="Optional"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                  onClick={logChange}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50"
                >
                  ⚙️ Log Change
                </button>
                <button
                  onClick={() => markMilestone('FIRST_CRACK')}
                  disabled={loading}
                  className="bg-amber-600 text-white px-4 py-3 rounded-lg hover:bg-amber-700 font-medium transition disabled:opacity-50"
                >
                  🔥 First Crack
                </button>
                <button
                  onClick={() => markMilestone('SECOND_CRACK')}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-medium transition disabled:opacity-50"
                >
                  🔥 Second Crack
                </button>
                <button
                  onClick={() => markMilestone('COOL')}
                  disabled={loading}
                  className="bg-cyan-600 text-white px-4 py-3 rounded-lg hover:bg-cyan-700 font-medium transition disabled:opacity-50"
                >
                  🧊 Drop/Cool
                </button>
              </div>

              {/* Events Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h3 className="text-lg font-medium text-gray-800">Roast Event Log</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Event</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fan</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Heat</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Temp °F</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Note</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            No events logged yet. Start making adjustments!
                          </td>
                        </tr>
                      ) : (
                        events.map((event, index) => (
                          <tr key={event.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-sm font-mono">{formatTime(event.t_offset_sec)}</td>
                            <td className="px-4 py-2 text-sm">
                              {editingEventId === event.id ? (
                                <select
                                  value={editingFormData.kind}
                                  onChange={(e) => setEditingFormData(prev => ({ ...prev, kind: e.target.value }))}
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="SET">Settings Change</option>
                                  <option value="FIRST_CRACK">First Crack</option>
                                  <option value="SECOND_CRACK">Second Crack</option>
                                  <option value="COOL">Cool</option>
                                  <option value="END">End Roast</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  event.kind === 'SET' ? 'bg-blue-100 text-blue-800' :
                                  event.kind === 'FIRST_CRACK' ? 'bg-amber-100 text-amber-800' :
                                  event.kind === 'SECOND_CRACK' ? 'bg-red-100 text-red-800' :
                                  event.kind === 'COOL' ? 'bg-cyan-100 text-cyan-800' :
                                  event.kind === 'END' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {event.kind.replace('_', ' ')}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {editingEventId === event.id ? (
                                <input
                                  type="number"
                                  min="0"
                                  max="9"
                                  value={editingFormData.fan_level}
                                  onChange={(e) => setEditingFormData(prev => ({ ...prev, fan_level: e.target.value }))}
                                  className="w-16 text-xs border border-gray-300 rounded px-2 py-1"
                                />
                              ) : (
                                event.fan_level ?? '—'
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {editingEventId === event.id ? (
                                <input
                                  type="number"
                                  min="0"
                                  max="9"
                                  value={editingFormData.heat_level}
                                  onChange={(e) => setEditingFormData(prev => ({ ...prev, heat_level: e.target.value }))}
                                  className="w-16 text-xs border border-gray-300 rounded px-2 py-1"
                                />
                              ) : (
                                event.heat_level ?? '—'
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {editingEventId === event.id ? (
                                <input
                                  type="number"
                                  step="0.1"
                                  value={editingFormData.temp_f}
                                  onChange={(e) => setEditingFormData(prev => ({ ...prev, temp_f: e.target.value }))}
                                  className="w-20 text-xs border border-gray-300 rounded px-2 py-1"
                                />
                              ) : (
                                event.temp_f ?? '—'
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {editingEventId === event.id ? (
                                <input
                                  type="text"
                                  value={editingFormData.note}
                                  onChange={(e) => setEditingFormData(prev => ({ ...prev, note: e.target.value }))}
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                  placeholder="Note"
                                />
                              ) : (
                                event.note || '—'
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {editingEventId === event.id ? (
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => saveEditedEvent(event.id)}
                                    className="text-green-600 hover:text-green-800 text-xs font-medium"
                                  >
                                    ✅ Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="text-gray-600 hover:text-gray-800 text-xs font-medium"
                                  >
                                    ❌ Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => startEditEvent(event)}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => deleteEvent(event.id)}
                                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* After Tab */}
          {currentTab === 'after' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Roast</h2>
                <p className="text-gray-600">Record final measurements and notes</p>
              </div>
              
              {!roastEnded && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-400 text-2xl">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Roast Session Not Ended
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>It looks like you haven't ended the roast session yet. If you're weighing your beans, the roast is complete!</p>
                        <div className="mt-3">
                          <button
                            onClick={endRoastSession}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium"
                          >
                            🛑 End Roast Session Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight After Roast (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weightAfter}
                    onChange={(e) => handleInputChange('weightAfter', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    placeholder="Any special notes about this roast..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={finishRoast}
                  disabled={loading || !formData.weightAfter}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold text-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  ✅ Complete Roast Session
                </button>
              </div>

              {/* Events Log - Show complete event history */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h3 className="text-lg font-medium text-gray-800">Complete Roast Event Log</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fan</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heat</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp °F</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            No events logged yet.
                          </td>
                        </tr>
                      ) : (
                        events.map((event, index) => (
                          <tr key={event.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-sm font-mono">{formatTime(event.t_offset_sec)}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.kind === 'SET' ? 'bg-blue-100 text-blue-800' :
                                event.kind === 'FIRST_CRACK' ? 'bg-amber-100 text-amber-800' :
                                event.kind === 'SECOND_CRACK' ? 'bg-red-100 text-red-800' :
                                event.kind === 'COOL' ? 'bg-cyan-100 text-cyan-800' :
                                event.kind === 'END' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {event.kind.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">{event.fan_level || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{event.heat_level || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{event.temp_f || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{event.note || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Page Modal */}
      {showProfilePage && (
        <ProfilePage 
          onClose={() => {
            setShowProfilePage(false);
            // Reload user data when profile page closes
            loadUserProfile();
            loadUserMachines();
          }} 
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <RoastAssistant />
    </AuthProvider>
  );
}

export default App;