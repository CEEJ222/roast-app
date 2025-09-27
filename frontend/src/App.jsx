import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginForm from './components/LoginForm';
import UserProfile from './components/UserProfile';
import SetupWizard from './components/SetupWizard';
import ProfilePage from './components/ProfilePage';
import EnvironmentalConditions from './components/EnvironmentalConditions';
import RoastCurveGraph from './components/RoastCurveGraph';
import HistoricalRoasts from './components/HistoricalRoasts';
import { COFFEE_REGIONS } from './data/coffeeRegions';
import CustomDropdown from './components/CustomDropdown';
import DashboardHistoricalRoasts from './components/DashboardHistoricalRoasts';
import RoastDetailPage from './components/RoastDetailPage';
import ConfirmationModal from './components/ConfirmationModal';
import TemperatureInputModal from './components/TemperatureInputModal';
import ThemeToggle from './components/ThemeToggle';
import { Analytics } from '@vercel/analytics/react';

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
  
  // Phase timing state
  const [dryingStartTime, setDryingStartTime] = useState(null);
  const [dryingTime, setDryingTime] = useState(0);
  const [coolingStartTime, setCoolingStartTime] = useState(null);
  const [coolingTime, setCoolingTime] = useState(0);

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
      
      // Update drying time if we're in drying phase
      if (currentPhase === 'drying' && dryingStartTime) {
        const dryTime = Math.floor((Date.now() - dryingStartTime) / 1000);
        setDryingTime(dryTime);
      }
      
      // Update development time if we're in development phase
      if (currentPhase === 'development' && developmentStartTime) {
        const devTime = Math.floor((Date.now() - developmentStartTime) / 1000);
        setDevelopmentTime(devTime);
      }
      
      // Update cooling time if we're in cooling phase
      if (currentPhase === 'cooling' && coolingStartTime) {
        const coolTime = Math.floor((Date.now() - coolingStartTime) / 1000);
        setCoolingTime(coolTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTs, currentPhase, dryingStartTime, developmentStartTime, coolingStartTime]);

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
      setDryingStartTime(Date.now());
      setDryingTime(0);
      setDevelopmentStartTime(null);
      setDevelopmentTime(0);
      setCoolingStartTime(null);
      setCoolingTime(0);
      
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
          setCoolingStartTime(Date.now());
          setCoolingTime(0);
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
      
      // Determine current phase based on milestones and set start times
      if (hasCool) {
        setCurrentPhase('cooling');
        // Find the COOL event to set cooling start time
        const coolEvent = data.find(event => event.kind === 'COOL');
        if (coolEvent) {
          const coolTime = startTs * 1000 + (coolEvent.t_offset_sec * 1000);
          setCoolingStartTime(coolTime);
          const currentCoolTime = Math.floor((Date.now() - coolTime) / 1000);
          setCoolingTime(currentCoolTime);
        }
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
        // Drying phase starts when roast starts
        setDryingStartTime(startTs * 1000);
        const currentDryingTime = Math.floor((Date.now() - startTs * 1000) / 1000);
        setDryingTime(currentDryingTime);
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
      <div className="min-h-screen bg-light-gradient-blue flex items-center justify-center">
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
    <div className="min-h-screen bg-light-gradient-blue dark:bg-dark-gradient p-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl dark:shadow-dark-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">☕ Roast Buddy</h1>
              <p className="opacity-90">Professional roast logging and analysis</p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserProfile />
            </div>
          </div>
        </div>


        <div className="p-6 dark:bg-dark-bg-secondary">
          {/* Loading indicator */}
          {loading && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-dark-bg-tertiary border-l-4 border-blue-400 dark:border-dark-accent-info text-blue-700 dark:text-dark-accent-info">
              Processing...
            </div>
          )}

          {/* Dashboard - Show when no active roast */}
          {!roastId && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Roast Dashboard</h2>
                  <p className="text-gray-600 dark:text-dark-text-secondary">Your roasting history and quick actions</p>
                </div>
                <button
                  onClick={() => setShowStartRoastWizard(true)}
                  className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant text-white px-6 py-3 rounded-lg hover:from-indigo-800 hover:via-purple-700 hover:to-purple-800 dark:hover:from-dark-accent-primary dark:hover:to-dark-accent-tertiary font-bold shadow-lg dark:shadow-vibrant-glow transform transition hover:scale-105 flex items-center gap-2"
                >
                  🚦 Start New Roast
                </button>
              </div>


              {/* Roast Curve Visualization */}
              {historicalRoasts?.length > 0 && (
                <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow dark:shadow-dark-lg border dark:border-dark-border-primary">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">All Roast Curves</h3>
                      <button
                        onClick={() => setShowHistoricalRoasts(true)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                      >
                        View All Roasts →
                      </button>
                    </div>
                  </div>
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
                      height={500}
                      title=""
                      units={{ temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', time: 'min' }}
                      className=""
                      showLegend={true}
                      showGrid={true}
                      showTooltip={true}
                      enableZoom={true}
                      enablePan={true}
                      compact={false}
                      interactive={true}
                      showRoastLabels={true}
                    />
                </div>
              )}

              {/* Historical Roasts Table */}
              <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow dark:shadow-dark-lg border dark:border-dark-border-primary">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
                      {showFullHistoricalRoasts ? 'All Roasts' : 'Recent Roasts'}
                    </h3>
                    {historicalRoasts?.length > 0 && (
                      <button
                        onClick={() => setShowFullHistoricalRoasts(!showFullHistoricalRoasts)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                      >
                        {showFullHistoricalRoasts ? 'Show Recent Only →' : 'View All Roasts →'}
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
                      hideCompareButton={true}
                    />
                  </div>
                ) : (
                  <div className="p-6">
                    {loadingHistoricalRoasts ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 dark:border-dark-accent-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-dark-text-secondary">Loading roast history...</p>
                      </div>
                    ) : historicalRoasts?.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-dark-text-tertiary">
                        <div className="text-6xl mb-4">☕</div>
                        <p className="text-lg font-semibold mb-2 dark:text-dark-text-primary">Ready to start your roasting journey?</p>
                        <p className="text-sm mb-6 dark:text-dark-text-secondary">Begin with your first roast to see your progress and curves here!</p>
                        <button
                          onClick={() => setShowStartRoastWizard(true)}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-dark-accent-primary dark:to-dark-accent-secondary text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-dark-accent-primary dark:hover:to-dark-accent-tertiary font-bold shadow-lg dark:shadow-vibrant-glow transform transition hover:scale-105"
                        >
                          🚦 Start Your First Roast
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {historicalRoasts.slice(0, 5).map((roast) => (
                          <div key={roast.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors border dark:border-dark-border-primary">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-orange-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center border dark:border-dark-border-primary">
                                <span className="text-orange-600 dark:text-dark-accent-primary font-bold">☕</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                                  {roast.coffee_region && roast.coffee_type 
                                    ? `${roast.coffee_region} ${roast.coffee_type}` 
                                    : roast.coffee_type || roast.coffee_region || 'Unknown Coffee'
                                  }
                                </p>
                                <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
                                  {new Date(roast.created_at).toLocaleDateString()} • {roast.machine_label || 'Unknown Machine'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="px-2 py-1 bg-amber-100 dark:bg-dark-bg-tertiary text-amber-800 dark:text-dark-accent-warning rounded-full text-xs font-medium border dark:border-dark-border-primary">
                                {roast.desired_roast_level}
                              </span>
                              {roast.weight_loss_pct && (
                                <span className="text-gray-600 dark:text-dark-text-secondary">
                                  {roast.weight_loss_pct.toFixed(1)}% loss
                                </span>
                              )}
                              <button
                                onClick={() => handleRoastResume(roast)}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
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
              <div className="bg-white dark:bg-dark-card rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl dark:shadow-dark-glow">
                <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-dark-text-primary">Initial Roaster Settings</h3>
                <p className="text-gray-600 dark:text-dark-text-secondary mb-4">Set your starting fan and heat levels before beginning the roast.</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">Fan Level</label>
                      <input
                        type="number"
                        min="0"
                        max="9"
                        value={initialSettings.fan_level}
                        onChange={(e) => setInitialSettings(prev => ({ ...prev, fan_level: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">Heat Level</label>
                      <input
                        type="number"
                        min="0"
                        max="9"
                        value={initialSettings.heat_level}
                        onChange={(e) => setInitialSettings(prev => ({ ...prev, heat_level: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                      />
                    </div>
                  </div>
                  
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    onClick={startRoast}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition shadow-lg"
                  >
                    🔥 Start Roast
                  </button>
                  <button
                    onClick={() => setShowInitialSettings(false)}
                    className="flex-1 bg-gray-300 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-dark-bg-quaternary font-medium transition"
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
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Active Roast Session</h2>
                </div>
                <div className="w-32"></div> {/* Spacer for centering */}
              </div>

              {/* Clean Header Layout */}
              <div className="mb-8">
                {/* Top Row - Timer and Key Metrics */}
                <div className="flex items-center justify-between mb-6">
                  {/* Timer - Large and prominent */}
                  <div className="text-center">
                    <div className="text-6xl font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                      {formatTime(elapsedTime)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
                      Total Roast Time
                    </div>
                    
                    {/* Development Time - positioned near Total Roast Time */}
                    {currentPhase === 'development' && (
                      <div className="mt-4">
                        <div className="text-2xl font-bold text-orange-500 dark:text-orange-400">
                          {formatTime(developmentTime)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-dark-text-secondary">Development</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Key Metrics Row */}
                  <div className="flex gap-6">
                    {/* Current Temperature */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500 dark:text-red-400">
                        {formData.tempF ? `${formData.tempF}°F` : '—'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-dark-text-secondary">Current Temp</div>
                    </div>
                    
                    {/* Environmental Conditions - Compact */}
                    {environmentalConditions && (
                      <div className="min-w-[200px]">
                        <EnvironmentalConditions 
                          conditions={environmentalConditions} 
                          units={userProfile?.units}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Phase Progress Bar */}
                <div className="bg-gray-200 dark:bg-dark-bg-tertiary rounded-full h-2 mb-4">
                  <div className={`h-2 rounded-full transition-all duration-500 ${
                    currentPhase === 'drying' 
                      ? 'bg-gradient-to-r from-green-500 to-green-400' 
                      : currentPhase === 'development' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-400' 
                      : currentPhase === 'cooling' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
                      : 'bg-gradient-to-r from-gray-400 to-gray-300'
                  }`}
                       style={{
                         width: currentPhase === 'drying' ? '33%' : 
                                currentPhase === 'development' ? '66%' : 
                                currentPhase === 'cooling' ? '100%' : '0%'
                       }}>
                  </div>
                </div>
                
                {/* Phase Indicators with Individual Counters */}
                <div className="flex justify-center gap-8">
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                    currentPhase === 'drying' 
                      ? 'bg-indigo-100 dark:bg-dark-accent-primary/20 text-indigo-800 dark:text-dark-accent-primary' 
                      : 'text-gray-500 dark:text-dark-text-tertiary'
                  }`}>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="flex flex-col items-center">
                      <span className="font-medium">Drying Phase</span>
                      <span className="text-xs font-mono">
                        {milestonesMarked.firstCrack ? formatTime(dryingTime) : formatTime(dryingTime)}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                    currentPhase === 'development' 
                      ? 'bg-indigo-100 dark:bg-dark-accent-primary/20 text-indigo-800 dark:text-dark-accent-primary' 
                      : 'text-gray-500 dark:text-dark-text-tertiary'
                  }`}>
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <div className="flex flex-col items-center">
                      <span className="font-medium">Development Phase</span>
                      <span className="text-xs font-mono">
                        {milestonesMarked.firstCrack ? formatTime(developmentTime) : '—'}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                    currentPhase === 'cooling' 
                      ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-400' 
                      : 'text-gray-500 dark:text-dark-text-tertiary'
                  }`}>
                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                    <div className="flex flex-col items-center">
                      <span className="font-medium">Cooling Phase</span>
                      <span className="text-xs font-mono">
                        {milestonesMarked.cool ? formatTime(coolingTime) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-dark-text-primary mb-4">Roaster Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">BT/ET Temp (°F)</label>
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
                        className="flex-1 border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                      />
                      <button
                        onClick={logChange}
                        disabled={loading}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 flex items-center gap-2 shadow-lg"
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
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
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
                      : 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 shadow-lg'
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
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 shadow-lg'
                  } ${loading ? 'opacity-50' : ''}`}
                >
                  {milestonesMarked.cool ? '✅ Cool' : '🧊 Cool'}
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
              <div className="bg-white dark:bg-dark-card rounded-lg shadow dark:shadow-dark-glow overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary border-b dark:border-dark-border-primary">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text-primary">Roast Event Log</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text-primary">Time</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text-primary">Event</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text-primary">Fan</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text-primary">Heat</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text-primary">Temp °F</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text-primary">Note</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text-primary">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border-primary">
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-dark-text-tertiary">
                            No events logged yet. Start making adjustments!
                          </td>
                        </tr>
                      ) : (
                        events.map((event, index) => (
                          <tr key={event.id} className={index % 2 === 0 ? 'bg-white dark:bg-dark-bg-secondary' : 'bg-gray-50 dark:bg-dark-bg-tertiary'}>
                            <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-dark-text-primary">{formatTime(event.t_offset_sec)}</td>
                            <td className="px-4 py-2 text-sm">
                              {editingEventId === event.id ? (
                                <select
                                  value={editingFormData.kind}
                                  onChange={(e) => setEditingFormData(prev => ({ ...prev, kind: e.target.value }))}
                                  className="w-full text-xs border border-gray-300 dark:border-dark-border-primary rounded px-2 py-1 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                                >
                                  <option value="SET">Settings Change</option>
                                  <option value="FIRST_CRACK">First Crack</option>
                                  <option value="SECOND_CRACK">Second Crack</option>
                                  <option value="COOL">Cool</option>
                                  <option value="END">End Roast</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  event.kind === 'SET' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                  event.kind === 'FIRST_CRACK' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                                  event.kind === 'SECOND_CRACK' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                  event.kind === 'COOL' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' :
                                  event.kind === 'END' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300'
                                }`}>
                                  {event.kind.replace('_', ' ')}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">
                              {editingEventId === event.id ? (
                                <input
                                  type="number"
                                  min="0"
                                  max="9"
                                  value={editingFormData.fan_level}
                                  onChange={(e) => setEditingFormData(prev => ({ ...prev, fan_level: e.target.value }))}
                                  className="w-16 text-xs border border-gray-300 dark:border-dark-border-primary rounded px-2 py-1 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                                />
                              ) : (
                                event.fan_level ?? '—'
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">
                              {editingEventId === event.id ? (
                                <input
                                  type="number"
                                  min="0"
                                  max="9"
                                  value={editingFormData.heat_level}
                                  onChange={(e) => setEditingFormData(prev => ({ ...prev, heat_level: e.target.value }))}
                                  className="w-16 text-xs border border-gray-300 dark:border-dark-border-primary rounded px-2 py-1 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                                />
                              ) : (
                                event.heat_level ?? '—'
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">
                              {editingEventId === event.id ? (
                                <input
                                  type="number"
                                  step="0.1"
                                  value={editingFormData.temp_f}
                                  onChange={(e) => setEditingFormData(prev => ({ ...prev, temp_f: e.target.value }))}
                                  className="w-20 text-xs border border-gray-300 dark:border-dark-border-primary rounded px-2 py-1 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                                />
                              ) : (
                                event.temp_f ?? '—'
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">
                              {editingEventId === event.id ? (
                                <input
                                  type="text"
                                  value={editingFormData.note}
                                  onChange={(e) => setEditingFormData(prev => ({ ...prev, note: e.target.value }))}
                                  className="w-full text-xs border border-gray-300 dark:border-dark-border-primary rounded px-2 py-1 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
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
                                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-xs font-medium"
                                  >
                                    ✅ Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 text-xs font-medium"
                                  >
                                    ❌ Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => startEditEvent(event)}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => deleteEvent(event.id)}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium"
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
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Complete Your Roast</h2>
                  <p className="text-gray-600 dark:text-dark-text-secondary">Record final measurements and notes</p>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Weight After Roast (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weightAfter}
                    onChange={(e) => handleInputChange('weightAfter', e.target.value)}
                    className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-dark-accent-primary focus:border-transparent text-center text-lg bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                    style={{
                      '--tw-ring-color': 'rgb(99 102 241)',
                      '--tw-ring-offset-shadow': 'var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)',
                      '--tw-ring-shadow': 'var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Notes (optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    placeholder="Any special notes about this roast..."
                    className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-dark-accent-primary focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary"
                  />
                </div>

                <button
                  onClick={finishRoast}
                  disabled={loading || !formData.weightAfter}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-bold text-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
              <div className="bg-white dark:bg-dark-card rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary border-b dark:border-dark-border-primary">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text-primary">Complete Roast Event Log</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border-primary">
                    <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Event</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Fan</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Heat</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Temp °F</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Note</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border-primary">
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-dark-text-tertiary">
                            No events logged yet.
                          </td>
                        </tr>
                      ) : (
                        events.map((event, index) => (
                          <tr key={event.id} className={index % 2 === 0 ? 'bg-white dark:bg-dark-bg-secondary' : 'bg-gray-50 dark:bg-dark-bg-tertiary'}>
                            <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-dark-text-primary">{formatTime(event.t_offset_sec)}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.kind === 'SET' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                event.kind === 'FIRST_CRACK' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                                event.kind === 'SECOND_CRACK' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                event.kind === 'COOL' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' :
                                event.kind === 'END' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300'
                              }`}>
                                {event.kind.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">{event.fan_level || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">{event.heat_level || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">{event.temp_f || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">{event.note || '—'}</td>
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
        milestoneType={pendingMilestone === 'FIRST_CRACK' ? 'First Crack' : pendingMilestone === 'SECOND_CRACK' ? 'Second Crack' : 'Cool'}
        title={`${pendingMilestone === 'FIRST_CRACK' ? '🔥' : pendingMilestone === 'SECOND_CRACK' ? '🔥🔥' : '🧊'} ${pendingMilestone === 'FIRST_CRACK' ? 'First Crack' : pendingMilestone === 'SECOND_CRACK' ? 'Second Crack' : 'Cool'}`}
      />

      {/* Start Roast Wizard Modal */}
      {showStartRoastWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">🏁 Start New Roast</h2>
                  <p className="opacity-90">Configure your roast session</p>
                </div>
                <button
                  onClick={handleStartRoastWizardCancel}
                  className="text-white hover:text-indigo-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary px-6 py-4 border-b dark:border-dark-border-primary">
              <div className="flex items-center justify-center space-x-8">
                {[
                  { key: 'machine', label: 'Machine Setup', icon: '⚙️' },
                  { key: 'coffee', label: 'Coffee Details', icon: '☕' },
                  { key: 'review', label: 'Review & Start', icon: '🏁' }
                ].map((step, index) => (
                  <div key={step.key} className="flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center text-lg font-medium">
                      {['machine', 'coffee', 'review'].indexOf(roastSetupStep) > index ? '✅' : step.icon}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      roastSetupStep === step.key ? 'text-indigo-600 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {step.label}
                    </span>
                    {index < 2 && (
                      <div className={`w-16 h-1 mx-4 ${
                        ['machine', 'coffee', 'review'].indexOf(roastSetupStep) > index ? 'bg-green-600' : index === ['machine', 'coffee', 'review'].indexOf(roastSetupStep) ? 'bg-indigo-600' : 'bg-gray-300'
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
                    <h3 className="text-xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Machine Setup</h3>
                    <p className="text-gray-600 dark:text-dark-text-secondary">Select your machine and roasting location</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-700 dark:text-dark-text-primary border-b dark:border-dark-border-primary pb-2">Machine</h4>
                      
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
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <span className="text-green-600 dark:text-green-400 text-xl mr-2">✅</span>
                            <h5 className="font-semibold text-green-800 dark:text-green-300">Machine Selected</h5>
                          </div>
                          <p className="text-green-700 dark:text-green-300">{userMachines[0].name}</p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            {userMachines[0].model}{userMachines[0].has_extension ? ' + Extension Tube' : ''}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
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
                            className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
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
                      <h4 className="text-lg font-semibold text-gray-700 dark:text-dark-text-primary border-b dark:border-dark-border-primary pb-2">Location</h4>
                      
                      {userProfile?.address ? (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <span className="text-green-600 dark:text-green-400 text-xl mr-2">✅</span>
                            <h5 className="font-semibold text-green-800 dark:text-green-300">Location Set</h5>
                          </div>
                          <p className="text-green-700 dark:text-green-300 text-sm">{userProfile.address}</p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
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
                    <h3 className="text-xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Coffee Details</h3>
                    <p className="text-gray-600 dark:text-dark-text-secondary">Tell us about the coffee you're roasting</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                        Coffee Region <span className="text-red-500">*</span>
                      </label>
                      <CustomDropdown
                        options={COFFEE_REGIONS}
                        value={formData.coffeeRegion}
                        onChange={(value) => handleInputChange('coffeeRegion', value)}
                        placeholder="Select a region..."
                        error={!formData.coffeeRegion}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Origin (Subregion)</label>
                      <input
                        type="text"
                        value={formData.coffeeType}
                        onChange={(e) => handleInputChange('coffeeType', e.target.value)}
                        placeholder="Yirgacheffe, Sidama, etc."
                        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                        Process <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.coffeeProcess}
                        onChange={(e) => handleInputChange('coffeeProcess', e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary ${
                          !formData.coffeeProcess ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-dark-border-primary'
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Target Roast</label>
                      <select
                        value={formData.roastLevel}
                        onChange={(e) => handleInputChange('roastLevel', e.target.value)}
                        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                      >
                        <option value="City">City</option>
                        <option value="City Plus">City Plus</option>
                        <option value="Full City">Full City</option>
                        <option value="Full City Plus">Full City Plus</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Weight Before Roast (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.weightBefore}
                        onChange={(e) => handleInputChange('weightBefore', e.target.value)}
                        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
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
                    <h3 className="text-xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Review & Start</h3>
                    <p className="text-gray-600 dark:text-dark-text-secondary">Review your settings and start the roast</p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-700 dark:text-dark-text-primary mb-4">Roast Summary</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-700 dark:text-dark-text-primary mb-2">Machine Setup</h5>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-dark-text-secondary">
                          <p><span className="font-medium">Machine:</span> {userMachines.find(m => m.id === formData.selectedMachineId)?.name || userMachines[0]?.name || 'Not selected'}</p>
                          <p><span className="font-medium">Location:</span> {userProfile?.address || 'Not set'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 dark:text-dark-text-primary mb-2">Coffee Details</h5>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-dark-text-secondary">
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
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary px-6 py-4 border-t dark:border-dark-border-primary flex justify-between">
              <button
                onClick={handleStartRoastWizardCancel}
                className="px-6 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary font-medium transition"
              >
                Cancel
              </button>
              
              <div className="flex space-x-3">
                {roastSetupStep !== 'machine' && (
                  <button
                    onClick={() => setRoastSetupStep(roastSetupStep === 'coffee' ? 'machine' : 'coffee')}
                    className="px-6 py-2 bg-gray-300 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary rounded-lg hover:bg-gray-400 dark:hover:bg-dark-bg-quaternary font-medium transition"
                  >
                    Back
                  </button>
                )}
                
                {roastSetupStep === 'machine' && (
                  <button
                    onClick={() => setRoastSetupStep('coffee')}
                    disabled={userMachines.length === 0}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    Next: Coffee Details
                  </button>
                )}
                
                {roastSetupStep === 'coffee' && (
                  <button
                    onClick={() => setRoastSetupStep('review')}
                    disabled={!formData.coffeeRegion || !formData.coffeeProcess}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                    disabled={!formData.coffeeRegion || !formData.coffeeProcess || userMachines.length === 0}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
    <ThemeProvider>
      <AuthProvider>
        <RoastAssistant />
        <Analytics />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;