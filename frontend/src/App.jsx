import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import UserProfile from './components/UserProfile';
import SetupWizard from './components/SetupWizard';
import ProfilePage from './components/ProfilePage';
import EnvironmentalConditions from './components/EnvironmentalConditions';
import RoastCurveGraph from './components/RoastCurveGraph';
import HistoricalRoasts from './components/HistoricalRoasts';
import DashboardHistoricalRoasts from './components/DashboardHistoricalRoasts';
import RoastDetailPage from './components/RoastDetailPage';
import ConfirmationModal from './components/ConfirmationModal';
import TemperatureInputModal from './components/TemperatureInputModal';
import { Analytics } from '@vercel/analytics/react';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-app-backend.vercel.app';  // Production

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
  const [showHistoricalRoasts, setShowHistoricalRoasts] = useState(false);
  const [showEndRoastConfirm, setShowEndRoastConfirm] = useState(false);
  const [showTemperatureInput, setShowTemperatureInput] = useState(false);
  const [showRoastDetail, setShowRoastDetail] = useState(false);
  const [selectedRoast, setSelectedRoast] = useState(null);
  const [showStartRoastWizard, setShowStartRoastWizard] = useState(false);
  const [roastSetupStep, setRoastSetupStep] = useState('machine'); // 'machine', 'coffee', 'review'
  const [pendingMilestone, setPendingMilestone] = useState(null);
  const [historicalRoasts, setHistoricalRoasts] = useState([]);
  const [loadingHistoricalRoasts, setLoadingHistoricalRoasts] = useState(false);
  const [showFullHistoricalRoasts, setShowFullHistoricalRoasts] = useState(false);
  const [selectedRoasts, setSelectedRoasts] = useState([]);
  const [roastDetails, setRoastDetails] = useState({});
  const [recentRoastDetails, setRecentRoastDetails] = useState({});
  const [milestonesMarked, setMilestonesMarked] = useState({
    firstCrack: false,
    secondCrack: false,
    cool: false
  });
  const [currentPhase, setCurrentPhase] = useState('drying'); // 'drying', 'development', 'cooling'
  const [developmentStartTime, setDevelopmentStartTime] = useState(null);
  const [developmentTime, setDevelopmentTime] = useState(0);

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
      
      // Update development time if we're in development phase
      if (currentPhase === 'development' && developmentStartTime) {
        const devTime = Math.floor((Date.now() - developmentStartTime) / 1000);
        setDevelopmentTime(devTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTs, currentPhase, developmentStartTime]);

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

  // Load historical roasts data for dashboard
  const loadHistoricalRoasts = async () => {
    if (!user) return;
    
    setLoadingHistoricalRoasts(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/roasts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const roasts = await response.json();
        // Sort by created_at descending (newest first)
        const sortedRoasts = roasts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setHistoricalRoasts(sortedRoasts);
        
        // Load details for all roasts for curve visualization
        if (sortedRoasts.length > 0) {
          loadAllRoastDetails(sortedRoasts);
        }
      }
    } catch (error) {
      console.error('Error loading historical roasts:', error);
    } finally {
      setLoadingHistoricalRoasts(false);
    }
  };

  // Load roast details for all roasts (for automatic curve display)
  const loadAllRoastDetails = async (allRoasts) => {
    try {
      const token = await getAuthToken();
      
      // Load details for each roast
      const detailPromises = allRoasts.map(async (roast) => {
        const response = await fetch(`${API_BASE}/roasts/${roast.id}/events`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const events = await response.json();
          return { roastId: roast.id, events };
        }
        return { roastId: roast.id, events: [] };
      });
      
      const details = await Promise.all(detailPromises);
      const detailsMap = {};
      details.forEach(({ roastId, events }) => {
        detailsMap[roastId] = events;
      });
      
      setRecentRoastDetails(detailsMap);
    } catch (error) {
      console.error('Error loading all roast details:', error);
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
    loadHistoricalRoasts();
  }, [user, setupComplete, getAuthToken]);

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    setSetupComplete(true);
  }

  const handleStartRoastWizardComplete = () => {
    setShowStartRoastWizard(false);
    setRoastSetupStep('machine');
  }

  const handleStartRoastWizardCancel = () => {
    setShowStartRoastWizard(false);
    setRoastSetupStep('machine');
  }

  const handleRoastResume = (roast) => {
    // Check if this might be an abandoned active roast
    const currentTime = new Date();
    const roastTime = new Date(roast.created_at);
    const timeDiff = (currentTime - roastTime) / (1000 * 60); // minutes
    
    // If roast is less than 2 hours old and has no weight_after, it might be active
    if (timeDiff < 120 && !roast.weight_after_g) {
      // Resume this roast session
      setRoastId(roast.id);
      setStartTs(Math.floor(new Date(roast.created_at).getTime() / 1000));
      setRoastEnded(false); // Assume not ended if we're resuming
      // Load events for this roast
      refreshEvents(roast.id);
      // Load environmental conditions if available
      if (roast.temperature_f || roast.humidity_pct) {
        setEnvironmentalConditions({
          temperature_f: roast.temperature_f,
          humidity_pct: roast.humidity_pct,
          elevation_ft: roast.elevation_ft,
          pressure_hpa: roast.pressure_hpa
        });
      }
    } else {
      // Show roast detail page for completed roasts
      setSelectedRoast(roast);
      setShowRoastDetail(true);
    }
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
      setEnvironmentalConditions(data.env);
      
      // Reset phase tracking for new roast
      setCurrentPhase('drying');
      setDevelopmentStartTime(null);
      setDevelopmentTime(0);
      
      // Update form data with initial settings
      setFormData(prev => ({
        ...prev,
        fan: initialSettings.fan_level || 5,
        heat: initialSettings.heat_level || 5
      }));
      
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

    // Check if milestone has already been marked
    if (kind === 'FIRST_CRACK' && milestonesMarked.firstCrack) return;
    if (kind === 'SECOND_CRACK' && milestonesMarked.secondCrack) return;
    if (kind === 'COOL' && milestonesMarked.cool) return;

      // For First Crack, Second Crack, and Cool, show temperature input modal
      if (kind === 'FIRST_CRACK' || kind === 'SECOND_CRACK' || kind === 'COOL') {
        setPendingMilestone(kind);
        setShowTemperatureInput(true);
      } else {
        // For other milestones (END), no temperature needed
        try {
          await apiCall(`${API_BASE}/roasts/${roastId}/events`, {
            method: 'POST',
            body: JSON.stringify({ kind })
          });

          refreshEvents();
        } catch (error) {
          // Error already handled in apiCall
        }
      }
  };

  const handleTemperatureConfirm = async (temperature) => {
    if (!pendingMilestone || !roastId) return;

    try {
      await apiCall(`${API_BASE}/roasts/${roastId}/events`, {
        method: 'POST',
        body: JSON.stringify({ 
          kind: pendingMilestone,
          temp_f: temperature
        })
      });

        // Update milestone tracking and phase changes
        if (pendingMilestone === 'FIRST_CRACK') {
          setMilestonesMarked(prev => ({ ...prev, firstCrack: true }));
          setCurrentPhase('development');
          setDevelopmentStartTime(Date.now());
          setDevelopmentTime(0);
        } else if (pendingMilestone === 'SECOND_CRACK') {
          setMilestonesMarked(prev => ({ ...prev, secondCrack: true }));
        } else if (pendingMilestone === 'COOL') {
          setMilestonesMarked(prev => ({ ...prev, cool: true }));
          setCurrentPhase('cooling');
        }

      refreshEvents();
    } catch (error) {
      // Error already handled in apiCall
    } finally {
      setShowTemperatureInput(false);
      setPendingMilestone(null);
    }
  };

  const refreshEvents = async (id = roastId) => {
    if (!id) return;
    try {
      const data = await apiCall(`${API_BASE}/roasts/${id}/events`);
      // Your backend returns the array directly, not wrapped in an object
      setEvents(data); // This is correct
      
      // Check if milestones have already been marked
      const hasFirstCrack = data.some(event => event.kind === 'FIRST_CRACK');
      const hasSecondCrack = data.some(event => event.kind === 'SECOND_CRACK');
      const hasCool = data.some(event => event.kind === 'COOL');
      
      setMilestonesMarked({
        firstCrack: hasFirstCrack,
        secondCrack: hasSecondCrack,
        cool: hasCool
      });
      
      // Determine current phase based on milestones
      if (hasCool) {
        setCurrentPhase('cooling');
      } else if (hasFirstCrack) {
        setCurrentPhase('development');
        // Calculate development time if we're resuming
        const firstCrackEvent = data.find(event => event.kind === 'FIRST_CRACK');
        if (firstCrackEvent) {
          const firstCrackTime = startTs * 1000 + (firstCrackEvent.t_offset_sec * 1000);
          setDevelopmentStartTime(firstCrackTime);
          const currentDevTime = Math.floor((Date.now() - firstCrackTime) / 1000);
          setDevelopmentTime(currentDevTime);
        }
      } else {
        setCurrentPhase('drying');
      }
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
      
      // Reset roast state and redirect to dashboard
      setRoastId(null);
      setStartTs(null);
      setRoastEnded(false);
      setEvents([]);
      setFormData({
        beanType: '',
        weightBefore: '',
        weightAfter: '',
        notes: '',
        fan: 5,
        heat: 5,
        temp: ''
      });
      setMilestonesMarked({
        firstCrack: false,
        secondCrack: false,
        cool: false
      });
      
      // Refresh historical roasts data
      loadHistoricalRoasts();
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
            <div className="flex items-center gap-4">
              <UserProfile />
            </div>
          </div>
        </div>


        <div className="p-6">
          {/* Loading indicator */}
          {loading && (
            <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-700">
              Processing...
            </div>
          )}

          {/* Dashboard - Show when no active roast */}
          {!roastId && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Roast Dashboard</h2>
                  <p className="text-gray-600">Your roasting history and quick actions</p>
                </div>
                <button
                  onClick={() => setShowStartRoastWizard(true)}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-red-700 font-bold shadow-lg transform transition hover:scale-105 flex items-center gap-2"
                >
                  🚦 Start New Roast
                </button>
              </div>


              {/* Roast Curve Visualization */}
              {historicalRoasts?.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800">All Roast Curves</h3>
                      <button
                        onClick={() => setShowFullHistoricalRoasts(!showFullHistoricalRoasts)}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        {showFullHistoricalRoasts ? 'Show Recent Only →' : 'View All Roasts →'}
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <RoastCurveGraph
                      data={historicalRoasts.map(roast => ({
                        id: roast.id,
                        name: roast.coffee_type || 'Unknown',
                        fullName: `${roast.coffee_type || 'Unknown'} - ${new Date(roast.created_at).toLocaleDateString()}`,
                        events: recentRoastDetails[roast.id] || []
                      }))}
                      mode="historical"
                      showROR={true}
                      showMilestones={true}
                      height={400}
                      title="All Roast Curves"
                      units={{ temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', time: 'min' }}
                      className="mb-6"
                      showLegend={true}
                      showGrid={true}
                      showTooltip={true}
                      enableZoom={true}
                      enablePan={true}
                      compact={false}
                      interactive={true}
                      showRoastLabels={true}
                    />
                    <p className="text-sm text-gray-500 text-center">
                      Showing all your roast curves. Use zoom and pan to explore, or click "View All Roasts" for detailed analysis.
                    </p>
                  </div>
                </div>
              )}

              {/* Historical Roasts Table */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {showFullHistoricalRoasts ? 'All Roasts' : 'Recent Roasts'}
                    </h3>
                    {historicalRoasts?.length > 0 && (
                      <button
                        onClick={() => setShowFullHistoricalRoasts(!showFullHistoricalRoasts)}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        {showFullHistoricalRoasts ? 'Show Recent Only →' : 'View All →'}
                      </button>
                    )}
                  </div>
                </div>
                {showFullHistoricalRoasts ? (
                  <div className="p-0">
                    <DashboardHistoricalRoasts
                      selectedRoasts={selectedRoasts}
                      setSelectedRoasts={setSelectedRoasts}
                      roastDetails={roastDetails}
                      setRoastDetails={setRoastDetails}
                      onRoastResume={handleRoastResume}
                      currentActiveRoastId={roastId}
                    />
                  </div>
                ) : (
                  <div className="p-6">
                    {loadingHistoricalRoasts ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading roast history...</p>
                      </div>
                    ) : historicalRoasts?.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">☕</div>
                        <p className="text-lg font-semibold mb-2">Ready to start your roasting journey?</p>
                        <p className="text-sm mb-6">Begin with your first roast to see your progress and curves here!</p>
                        <button
                          onClick={() => setShowStartRoastWizard(true)}
                          className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-red-700 font-bold shadow-lg transform transition hover:scale-105"
                        >
                          🚦 Start Your First Roast
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {historicalRoasts.slice(0, 5).map((roast) => (
                          <div key={roast.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 font-bold">☕</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{roast.coffee_type}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(roast.created_at).toLocaleDateString()} • {roast.machine_label || 'Unknown Machine'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                                {roast.desired_roast_level}
                              </span>
                              {roast.weight_loss_pct && (
                                <span className="text-gray-600">
                                  {roast.weight_loss_pct.toFixed(1)}% loss
                                </span>
                              )}
                              <button
                                onClick={() => handleRoastResume(roast)}
                                className="text-orange-600 hover:text-orange-700 font-medium"
                              >
                                {(() => {
                                  if (roast.id === roastId) return 'Currently Active →';
                                  
                                  const currentTime = new Date();
                                  const roastTime = new Date(roast.created_at);
                                  const timeDiff = (currentTime - roastTime) / (1000 * 60);
                                  
                                  if (timeDiff < 120 && !roast.weight_after_g) {
                                    return 'Continue Roast →';
                                  }
                                  return 'View Details →';
                                })()}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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

          {/* Active Roast - During */}
          {roastId && !roastEnded && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => {
                    setRoastId(null);
                    setStartTs(null);
                    setRoastEnded(false);
                    setEvents([]);
                    setEnvironmentalConditions(null);
                    setMilestonesMarked({
                      firstCrack: false,
                      secondCrack: false,
                      cool: false
                    });
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
                >
                  ← Back to Dashboard
                </button>
                <div className="text-center flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Active Roast Session</h2>
                </div>
                <div className="w-32"></div> {/* Spacer for centering */}
              </div>

              <div className="text-center mb-6 relative">
                <div className="text-5xl font-mono font-bold text-orange-600 bg-gray-100 rounded-lg py-4">
                  ⏱️ {formatTime(elapsedTime)}
                </div>
                
                {/* Phase Indicators */}
                <div className="flex justify-center gap-4 mt-4">
                  <div className={`px-4 py-2 rounded-lg font-medium transition ${
                    currentPhase === 'drying' 
                      ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    🌱 Drying Phase
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-medium transition ${
                    currentPhase === 'development' 
                      ? 'bg-orange-100 text-orange-800 border-2 border-orange-300' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    🔥 Development Phase
                    {currentPhase === 'development' && (
                      <div className="text-sm font-bold mt-1">
                        {formatTime(developmentTime)}
                      </div>
                    )}
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-medium transition ${
                    currentPhase === 'cooling' 
                      ? 'bg-cyan-100 text-cyan-800 border-2 border-cyan-300' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    🧊 Cooling Phase
                  </div>
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
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="1"
                        value={formData.tempF}
                        onChange={(e) => handleInputChange('tempF', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            logChange();
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            const currentValue = parseFloat(formData.tempF) || 0;
                            handleInputChange('tempF', (currentValue + 1).toString());
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            const currentValue = parseFloat(formData.tempF) || 0;
                            handleInputChange('tempF', (currentValue - 1).toString());
                          }
                        }}
                        placeholder="Optional"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <button
                        onClick={logChange}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50 flex items-center gap-2"
                      >
                        ⚙️ Log
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestone Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <button
                  onClick={() => markMilestone('FIRST_CRACK')}
                  disabled={loading || milestonesMarked.firstCrack}
                  className={`px-4 py-3 rounded-lg font-medium transition ${
                    milestonesMarked.firstCrack 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  } ${loading ? 'opacity-50' : ''}`}
                >
                  {milestonesMarked.firstCrack ? '✅ First Crack' : '🔥 First Crack'}
                </button>
                <button
                  onClick={() => markMilestone('SECOND_CRACK')}
                  disabled={loading || milestonesMarked.secondCrack}
                  className={`px-4 py-3 rounded-lg font-medium transition ${
                    milestonesMarked.secondCrack 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  } ${loading ? 'opacity-50' : ''}`}
                >
                  {milestonesMarked.secondCrack ? '✅ Second Crack' : '🔥🔥 Second Crack'}
                </button>
                <button
                  onClick={() => markMilestone('COOL')}
                  disabled={loading || milestonesMarked.cool}
                  className={`px-4 py-3 rounded-lg font-medium transition ${
                    milestonesMarked.cool 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-cyan-600 text-white hover:bg-cyan-700'
                  } ${loading ? 'opacity-50' : ''}`}
                >
                  {milestonesMarked.cool ? '✅ Drop/Cool' : '🧊 Drop/Cool'}
                </button>
                <button
                  onClick={() => setShowEndRoastConfirm(true)}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium transition disabled:opacity-50"
                >
                  🛑 End Roast
                </button>
              </div>

              {/* Live Roast Curve Graph */}
              <RoastCurveGraph
                data={events}
                mode="live"
                showROR={true}
                showMilestones={true}
                height={300}
                title="Live Roast Curve"
                units={{ temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', time: 'min' }}
                className="mb-6"
                showLegend={true}
                showGrid={true}
                showTooltip={true}
                enableZoom={false}
                enablePan={false}
                compact={false}
                interactive={true}
              />

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

          {/* Active Roast - After */}
          {roastId && roastEnded && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => {
                    setRoastId(null);
                    setStartTs(null);
                    setRoastEnded(false);
                    setEvents([]);
                    setEnvironmentalConditions(null);
                    setMilestonesMarked({
                      firstCrack: false,
                      secondCrack: false,
                      cool: false
                    });
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
                >
                  ← Back to Dashboard
                </button>
                <div className="text-center flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Roast</h2>
                  <p className="text-gray-600">Record final measurements and notes</p>
                </div>
                <div className="w-32"></div> {/* Spacer for centering */}
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

              {/* Completed Roast Curve */}
              {events.length > 0 && (
                <RoastCurveGraph
                  data={events}
                  mode="live"
                  showROR={true}
                  showMilestones={true}
                  height={250}
                  title="Completed Roast Curve"
                  units={{ temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', time: 'min' }}
                  className="mb-6"
                  showLegend={true}
                  showGrid={true}
                  showTooltip={true}
                  enableZoom={true}
                  enablePan={true}
                  compact={true}
                  interactive={true}
                />
              )}

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

      {/* Historical Roasts Modal */}
      {showHistoricalRoasts && (
        <HistoricalRoasts 
          onClose={() => setShowHistoricalRoasts(false)} 
        />
      )}

      {/* Roast Detail Page */}
      {showRoastDetail && (
        <RoastDetailPage
          roast={selectedRoast}
          onClose={() => {
            setShowRoastDetail(false);
            setSelectedRoast(null);
          }}
          userProfile={userProfile}
        />
      )}

      {/* End Roast Confirmation Modal */}
      <ConfirmationModal
        isOpen={showEndRoastConfirm}
        onClose={() => setShowEndRoastConfirm(false)}
        onConfirm={() => {
          setShowEndRoastConfirm(false);
          endRoastSession();
        }}
        title="End Roast Session"
        message="Are you sure you want to end the roast session? This will complete the roast and move to the final step where you can record the final weight and notes."
        confirmText="End Roast"
        cancelText="Continue Roasting"
        confirmButtonColor="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        icon="🛑"
      />

      {/* Temperature Input Modal */}
      <TemperatureInputModal
        isOpen={showTemperatureInput}
        onClose={() => {
          setShowTemperatureInput(false);
          setPendingMilestone(null);
        }}
        onConfirm={handleTemperatureConfirm}
        milestoneType={pendingMilestone === 'FIRST_CRACK' ? 'First Crack' : pendingMilestone === 'SECOND_CRACK' ? 'Second Crack' : 'Drop/Cool'}
        title={`${pendingMilestone === 'FIRST_CRACK' ? '🔥' : pendingMilestone === 'SECOND_CRACK' ? '🔥🔥' : '🧊'} ${pendingMilestone === 'FIRST_CRACK' ? 'First Crack' : pendingMilestone === 'SECOND_CRACK' ? 'Second Crack' : 'Drop/Cool'}`}
      />

      {/* Start Roast Wizard Modal */}
      {showStartRoastWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">🚦 Start New Roast</h2>
                  <p className="opacity-90">Configure your roast session</p>
                </div>
                <button
                  onClick={handleStartRoastWizardCancel}
                  className="text-white hover:text-amber-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-center space-x-8">
                {[
                  { key: 'machine', label: 'Machine Setup', icon: '⚙️' },
                  { key: 'coffee', label: 'Coffee Details', icon: '☕' },
                  { key: 'review', label: 'Review & Start', icon: '🚦' }
                ].map((step, index) => (
                  <div key={step.key} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      roastSetupStep === step.key
                        ? 'bg-orange-600 text-white'
                        : ['machine', 'coffee', 'review'].indexOf(roastSetupStep) > index
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {['machine', 'coffee', 'review'].indexOf(roastSetupStep) > index ? '✓' : step.icon}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      roastSetupStep === step.key ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      {step.label}
                    </span>
                    {index < 2 && (
                      <div className={`w-16 h-1 mx-4 ${
                        ['machine', 'coffee', 'review'].indexOf(roastSetupStep) > index ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Machine Setup Step */}
              {roastSetupStep === 'machine' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Machine Setup</h3>
                    <p className="text-gray-600">Select your machine and roasting location</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Machine</h4>
                      
                      {userMachines.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <span className="text-yellow-600 text-xl mr-2">⚠️</span>
                            <h5 className="font-semibold text-yellow-800">No Machines Found</h5>
                          </div>
                          <p className="text-yellow-700 mb-3">You need to add a machine to your profile before starting a roast.</p>
                          <button
                            onClick={() => setShowProfilePage(true)}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 font-medium transition"
                          >
                            Add Machine to Profile
                          </button>
                        </div>
                      ) : userMachines.length === 1 ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <span className="text-green-600 text-xl mr-2">✅</span>
                            <h5 className="font-semibold text-green-800">Machine Selected</h5>
                          </div>
                          <p className="text-green-700">{userMachines[0].name}</p>
                          <p className="text-sm text-green-600">
                            {userMachines[0].model}{userMachines[0].has_extension ? ' + Extension Tube' : ''}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Machine <span className="text-red-500">*</span>
                          </label>
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
                                {machine.name} ({machine.model}{machine.has_extension ? ' + ET' : ''})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Location</h4>
                      
                      {userProfile?.address ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <span className="text-green-600 text-xl mr-2">✅</span>
                            <h5 className="font-semibold text-green-800">Location Set</h5>
                          </div>
                          <p className="text-green-700 text-sm">{userProfile.address}</p>
                          <p className="text-xs text-green-600 mt-1">
                            Environmental data will be fetched automatically
                          </p>
                        </div>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <span className="text-blue-600 text-xl mr-2">📍</span>
                            <h5 className="font-semibold text-blue-800">No Location Set</h5>
                          </div>
                          <p className="text-blue-700 mb-3">Add your location to get environmental data for better roast tracking.</p>
                          <button
                            onClick={() => setShowProfilePage(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
                          >
                            Add Location to Profile
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Coffee Details Step */}
              {roastSetupStep === 'coffee' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Coffee Details</h3>
                    <p className="text-gray-600">Tell us about the coffee you're roasting</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weight Before Roast (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.weightBefore}
                        onChange={(e) => handleInputChange('weightBefore', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="e.g., 250"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Review Step */}
              {roastSetupStep === 'review' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Review & Start</h3>
                    <p className="text-gray-600">Review your settings and start the roast</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Roast Summary</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Machine Setup</h5>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Machine:</span> {userMachines.find(m => m.id === formData.selectedMachineId)?.name || userMachines[0]?.name || 'Not selected'}</p>
                          <p><span className="font-medium">Location:</span> {userProfile?.address || 'Not set'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Coffee Details</h5>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Region:</span> {formData.coffeeType || 'Not specified'}</p>
                          <p><span className="font-medium">Process:</span> {formData.coffeeProcess}</p>
                          <p><span className="font-medium">Target:</span> {formData.roastLevel}</p>
                          <p><span className="font-medium">Weight:</span> {formData.weightBefore ? `${formData.weightBefore}g` : 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-between">
              <button
                onClick={handleStartRoastWizardCancel}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition"
              >
                Cancel
              </button>
              
              <div className="flex space-x-3">
                {roastSetupStep !== 'machine' && (
                  <button
                    onClick={() => setRoastSetupStep(roastSetupStep === 'coffee' ? 'machine' : 'coffee')}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition"
                  >
                    Back
                  </button>
                )}
                
                {roastSetupStep === 'machine' && (
                  <button
                    onClick={() => setRoastSetupStep('coffee')}
                    disabled={userMachines.length === 0}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Coffee Details
                  </button>
                )}
                
                {roastSetupStep === 'coffee' && (
                  <button
                    onClick={() => setRoastSetupStep('review')}
                    disabled={!formData.coffeeType || !formData.coffeeProcess}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Review
                  </button>
                )}
                
                {roastSetupStep === 'review' && (
                  <button
                    onClick={() => {
                      setShowStartRoastWizard(false);
                      setRoastSetupStep('machine');
                      showInitialSettingsForm();
                    }}
                    disabled={!formData.coffeeType || !formData.coffeeProcess || userMachines.length === 0}
                    className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🚦 Start Roast Session
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <RoastAssistant />
      <Analytics />
    </AuthProvider>
  );
}

export default App;