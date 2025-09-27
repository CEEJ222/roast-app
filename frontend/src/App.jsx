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
    fan_level: 8,
    heat_level: 4
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

  // Pause state
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);

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
    fan: 8,
    heat: 4,
    tempF: '',
    weightAfter: ''
  });

  // Timer effect
  useEffect(() => {
    if (!startTs) return;
    
    const interval = setInterval(() => {
      if (isPaused) return; // Don't update timers when paused
      
      const roastStartTimeMs = startTs * 1000;
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - roastStartTimeMs - totalPausedTime) / 1000);
      setElapsedTime(Math.max(0, elapsed));
      
      // Update drying time if we're in drying phase (use same calculation as main timer)
      if (currentPhase === 'drying') {
        const dryTime = Math.floor((currentTime - roastStartTimeMs - totalPausedTime) / 1000);
        setDryingTime(Math.max(0, dryTime));
      }
      
      // Update development time if we're in development phase
      if (currentPhase === 'development' && developmentStartTime) {
        const devTime = Math.floor((currentTime - developmentStartTime - totalPausedTime) / 1000);
        setDevelopmentTime(Math.max(0, devTime));
      }
      
      // Update cooling time if we're in cooling phase
      if (currentPhase === 'cooling' && coolingStartTime) {
        const coolTime = Math.floor((currentTime - coolingStartTime - totalPausedTime) / 1000);
        setCoolingTime(Math.max(0, coolTime));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTs, currentPhase, dryingStartTime, developmentStartTime, coolingStartTime, isPaused, totalPausedTime]);

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

  const handleRoastResume = async (roast) => {
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
      
      // Reset pause state
      setIsPaused(false);
      setPauseStartTime(null);
      setTotalPausedTime(0);
      
      // Load events for this roast
      refreshEvents(roast.id);
      
      // Load environmental conditions from the roast data
      if (roast.temperature_c || roast.temperature_f || roast.humidity_pct) {
        setEnvironmentalConditions({
          temperature_c: roast.temperature_c,
          temperature_f: roast.temperature_f,
          humidity_pct: roast.humidity_pct,
          elevation_m: roast.elevation_m,
          elevation_ft: roast.elevation_ft,
          pressure_hpa: roast.pressure_hpa,
          as_of: roast.as_of,
          timezone: roast.timezone,
          timezone_abbreviation: roast.timezone_abbreviation
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

  // Get the latest temperature from events
  const getLatestTemperature = () => {
    if (!events || events.length === 0) return null;
    
    // Find the most recent event with a temperature
    const tempEvents = events
      .filter(event => event.temp_f !== null && event.temp_f !== undefined)
      .sort((a, b) => b.t_offset_sec - a.t_offset_sec);
    
    return tempEvents.length > 0 ? tempEvents[0].temp_f : null;
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
        let errorMessage = `HTTP ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.detail || error.message || errorMessage;
          console.error('API Error:', error);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Call failed:', error);
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
    
    // Debug: Log the data being sent
    const requestData = {
      machine_label: machineLabel,
      address: formData.address,
      coffee_region: formData.coffeeRegion,
      coffee_type: formData.coffeeType,
      coffee_process: formData.coffeeProcess,
      desired_roast_level: formData.roastLevel,
      weight_before_g: parseFloat(formData.weightBefore) || null,
      notes: formData.notes
    };
    console.log('Starting roast with data:', requestData);
    
    setLoading(true);
    try {
      const data = await apiCall(`${API_BASE}/roasts`, {
        method: 'POST',
        body: JSON.stringify(requestData)
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
        fan: initialSettings.fan_level !== undefined && initialSettings.fan_level !== '' ? parseInt(initialSettings.fan_level) : 8,
        heat: initialSettings.heat_level !== undefined && initialSettings.heat_level !== '' ? parseInt(initialSettings.heat_level) : 4
      }));
      
      // Create initial SET event with user-provided settings (without loading state)
      if (initialSettings.fan_level !== undefined || initialSettings.heat_level !== undefined) {
        const fanLevel = initialSettings.fan_level !== undefined && initialSettings.fan_level !== '' ? parseInt(initialSettings.fan_level) : null;
        const heatLevel = initialSettings.heat_level !== undefined && initialSettings.heat_level !== '' ? parseInt(initialSettings.heat_level) : null;
        
        await apiCall(`${API_BASE}/roasts/${data.roast_id}/events`, {
          method: 'POST',
          body: JSON.stringify({
            kind: 'SET',
            fan_level: fanLevel,
            heat_level: heatLevel,
            note: 'Initial settings'
          })
        });
      }
      
      refreshEvents(data.roast_id);
      setShowInitialSettings(false);
    } catch (error) {
      console.error('Start roast failed:', error);
      // Error already handled in apiCall, but let's show more specific info
      setStatus(`Failed to start roast: ${error.message}`);
    } finally {
      setLoading(false);
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
        // Drying phase starts when roast starts (startTs is in seconds)
        const roastStartTimeMs = startTs * 1000;
        setDryingStartTime(roastStartTimeMs);
        const currentDryingTime = Math.floor((Date.now() - roastStartTimeMs) / 1000);
        setDryingTime(Math.max(0, currentDryingTime));
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
      setIsPaused(false);
      setPauseStartTime(null);
      setTotalPausedTime(0);
      setFormData({
        beanType: '',
        weightBefore: '',
        weightAfter: '',
        notes: '',
        fan: 8,
        heat: 4,
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

  const pauseRoast = () => {
    if (!roastId || isPaused) return;

    // Just pause locally for now (backend doesn't support PAUSE events yet)
    setIsPaused(true);
    setPauseStartTime(Date.now());
    setStatus(`⏸️ Roast paused at ${formatTime(elapsedTime)}`);
  };

  const resumeRoast = () => {
    if (!roastId || !isPaused) return;

    // Calculate how long we were paused and add to total paused time
    const pauseDuration = Date.now() - pauseStartTime;
    setTotalPausedTime(prev => prev + pauseDuration);

    setIsPaused(false);
    setPauseStartTime(null);
    setStatus(`▶️ Roast resumed at ${formatTime(elapsedTime)}`);
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
    <div className="min-h-screen bg-light-gradient-blue dark:bg-dark-gradient p-2 sm:p-4">
      <div className="max-w-7xl mx-auto bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl dark:shadow-dark-xl overflow-hidden">
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text-primary mb-2">Starting Your Roast</h3>
              <p className="text-gray-600 dark:text-dark-text-secondary">Setting up your roast session...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant px-3 sm:px-6 py-2 sm:py-4 text-white">
          <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold truncate">☕ Roast Buddy</h1>
              <p className="opacity-90 text-xs sm:text-base hidden sm:block">Professional roast logging and analysis</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 ml-3">
              <UserProfile />
            </div>
          </div>
        </div>


        <div className="p-3 sm:p-6 dark:bg-dark-bg-secondary">

          {/* Dashboard - Show when no active roast */}
          {!roastId && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Roast Dashboard</h2>
                  <p className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">Your roasting history and quick actions</p>
                </div>
                <button
                  onClick={() => setShowStartRoastWizard(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant text-white px-4 sm:px-6 py-3 rounded-lg hover:from-indigo-800 hover:via-purple-700 hover:to-purple-800 dark:hover:from-dark-accent-primary dark:hover:to-dark-accent-tertiary font-bold shadow-lg dark:shadow-vibrant-glow transform transition hover:scale-105 flex items-center justify-center gap-2"
                >
                  🏁 Start New Roast
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
                        Compare Roasts →
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
                          <div 
                            key={roast.id} 
                            onClick={() => handleRoastResume(roast)}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors border dark:border-dark-border-primary cursor-pointer"
                          >
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
                              {/* Click indicator for all screen sizes */}
                              <div className="text-indigo-600 dark:text-indigo-400">
                                {(() => {
                                  if (roast.id === roastId) {
                                    return 'Currently Active →';
                                  }
                                  
                                  const currentTime = new Date();
                                  const roastTime = new Date(roast.created_at);
                                  const timeDiff = (currentTime - roastTime) / (1000 * 60);
                                  
                                  if (timeDiff < 120 && !roast.weight_after_g) {
                                    return 'Continue Roast →';
                                  }
                                  return (
                                    <>
                                      <span className="hidden sm:inline">View Details </span>→
                                    </>
                                  );
                                })()}
                              </div>
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-dark-card rounded-lg p-4 sm:p-6 w-full max-w-md shadow-2xl dark:shadow-dark-glow">
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
                    onClick={() => {
                      startRoast();
                    }}
                    disabled={loading || !formData.weightBefore || parseFloat(formData.weightBefore) <= 0}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Starting...
                      </div>
                    ) : !formData.weightBefore || parseFloat(formData.weightBefore) <= 0 ? (
                      '⚠️ Enter Valid Weight'
                    ) : (
                      '🏁 Start Roast'
                    )}
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <button
                  onClick={() => {
                    setRoastId(null);
                    setStartTs(null);
                    setRoastEnded(false);
                    setEvents([]);
                    setEnvironmentalConditions(null);
                    setIsPaused(false);
                    setPauseStartTime(null);
                    setTotalPausedTime(0);
                    setMilestonesMarked({
                      firstCrack: false,
                      secondCrack: false,
                      cool: false
                    });
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition flex items-center gap-2 w-full sm:w-auto"
                >
                  ← Back to Dashboard
                </button>
                <div className="text-center flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Active Roast Session</h2>
                </div>
                <div className="w-full sm:w-32"></div> {/* Spacer for centering */}
              </div>

              {/* Clean Header Layout */}
              <div className="mb-8">
                {/* Responsive Layout - Stack on mobile, side-by-side on larger screens */}
                <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 mb-6">
                  {/* Timer with Circular Progress Chart and Phase Indicators */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 lg:gap-8">
                    {/* Circular Chart and Timer */}
                    <div className="text-center flex-shrink-0">
                      <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 lg:w-80 lg:h-80">
                        {/* Circular Progress Chart */}
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                          {/* Background circle */}
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="#374151"
                            strokeWidth="8"
                          />
                          
                          {/* Progress segments drawn sequentially */}
                          {(() => {
                            const circumference = 2 * Math.PI * 50;
                            const radius = 50;
                            const centerX = 60;
                            const centerY = 60;
                            
                            // Calculate phase angles
                            const dryingAngle = (dryingTime / elapsedTime) * 2 * Math.PI;
                            const developmentAngle = (developmentTime / elapsedTime) * 2 * Math.PI;
                            const coolingAngle = (coolingTime / elapsedTime) * 2 * Math.PI;
                            
                            // Helper function to create arc path
                            const createArcPath = (startAngle, endAngle, radius) => {
                              const start = {
                                x: centerX + radius * Math.cos(startAngle - Math.PI / 2),
                                y: centerY + radius * Math.sin(startAngle - Math.PI / 2)
                              };
                              const end = {
                                x: centerX + radius * Math.cos(endAngle - Math.PI / 2),
                                y: centerY + radius * Math.sin(endAngle - Math.PI / 2)
                              };
                              
                              const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
                              
                              return [
                                `M ${start.x} ${start.y}`,
                                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`
                              ].join(" ");
                            };
                            
                            let currentAngle = 0;
                            
                            return (
                              <>
                                {/* Drying phase (green) */}
                                {elapsedTime > 0 && dryingTime > 0 && (
                                  <path
                                    d={createArcPath(currentAngle, currentAngle + dryingAngle, radius)}
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    style={{ transition: 'all 0.5s ease' }}
                                  />
                                )}
                                
                                {/* Development phase (orange) */}
                                {elapsedTime > 0 && developmentTime > 0 && (
                                  <path
                                    d={createArcPath(
                                      currentAngle + dryingAngle, 
                                      currentAngle + dryingAngle + developmentAngle, 
                                      radius
                                    )}
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    style={{ transition: 'all 0.5s ease' }}
                                  />
                                )}
                                
                                {/* Cooling phase (blue) */}
                                {elapsedTime > 0 && coolingTime > 0 && (
                                  <path
                                    d={createArcPath(
                                      currentAngle + dryingAngle + developmentAngle,
                                      currentAngle + dryingAngle + developmentAngle + coolingAngle,
                                      radius
                                    )}
                                    fill="none"
                                    stroke="#06b6d4"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    style={{ transition: 'all 0.5s ease' }}
                                  />
                                )}
                              </>
                            );
                          })()}
                        </svg>
                        
                        {/* Timer in center - Responsive sizing */}
                        <div className="p-4 sm:p-6 w-32 h-20 sm:w-44 sm:h-28 lg:w-48 lg:h-32">
                          <div className="flex flex-col items-center justify-center gap-2 sm:gap-3">
                            <div className="text-3xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-green-400 text-center" style={{
                              fontFamily: '"Orbitron", "Seven Segment", "DS-Digital", monospace',
                              letterSpacing: '0.1em',
                              textShadow: '0 0 3px #22c55e',
                              fontWeight: '900',
                              fontVariantNumeric: 'tabular-nums',
                              lineHeight: '1'
                            }}>
                              {formatTime(elapsedTime)}
                            </div>
                            
                            {/* Pause/Resume Button - Below timer inside chart */}
                            <button
                              onClick={isPaused ? resumeRoast : pauseRoast}
                              disabled={loading}
                              className={`p-2 sm:p-3 rounded-full border-2 transition-all duration-200 hover:scale-105 ${
                                isPaused 
                                  ? 'border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                  : 'border-gray-400 text-gray-600 hover:border-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-500 dark:hover:border-gray-300 dark:hover:bg-gray-800/20'
                              } ${loading ? 'opacity-50' : ''}`}
                            >
                              {isPaused ? (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                    </div>

                    {/* Phase Indicators - Responsive layout */}
                    <div className="flex flex-row md:flex-col gap-2 sm:gap-4 md:gap-4 pt-4 sm:pt-8">
                      <div className={`flex items-center space-x-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition ${
                        currentPhase === 'drying' 
                          ? 'bg-indigo-100 dark:bg-dark-accent-primary/20 text-indigo-800 dark:text-dark-accent-primary' 
                          : 'text-gray-500 dark:text-dark-text-tertiary'
                      }`}>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 flex-shrink-0"></div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm sm:text-base truncate">Drying</span>
                          <span className="text-xs sm:text-sm font-mono">
                            {formatTime(dryingTime)}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`flex items-center space-x-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition ${
                        currentPhase === 'development' 
                          ? 'bg-indigo-100 dark:bg-dark-accent-primary/20 text-indigo-800 dark:text-dark-accent-primary' 
                          : 'text-gray-500 dark:text-dark-text-tertiary'
                      }`}>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-orange-500 flex-shrink-0"></div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm sm:text-base truncate">Development</span>
                          <span className="text-xs sm:text-sm font-mono">
                            {milestonesMarked.firstCrack ? formatTime(developmentTime) : '—'}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`flex items-center space-x-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition ${
                        currentPhase === 'cooling' 
                          ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-400' 
                          : 'text-gray-500 dark:text-dark-text-tertiary'
                      }`}>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-cyan-500 flex-shrink-0"></div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm sm:text-base truncate">Cooling</span>
                          <span className="text-xs sm:text-sm font-mono">
                            {milestonesMarked.cool ? formatTime(coolingTime) : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Roaster Controls - Improved layout */}
                  <div className="w-full max-w-md lg:flex-1">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 sm:p-6">
                      <h3 className="text-lg font-bold text-white mb-6 text-center">Roaster Controls</h3>
                      
                      <div className="space-y-6">
                        {/* Left Side - Fan & Heat Controls */}
                        <div className="space-y-4">
                          {/* Fan Control */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="text-xs font-semibold tracking-wide text-gray-300">
                                FAN SPEED
                              </div>
                              <div className="text-sm font-bold text-white">
                                {formData.fan}
                              </div>
                            </div>
                            
                            <div className="relative h-4 rounded-full overflow-hidden cursor-pointer"
                                 onClick={(e) => {
                                   const rect = e.currentTarget.getBoundingClientRect();
                                   const x = e.clientX - rect.left;
                                   const newValue = Math.round((x / rect.width) * 9);
                                   handleInputChange('fan', Math.max(0, Math.min(9, newValue)));
                                 }}>
                              {/* Color spectrum background */}
                              <div 
                                className="absolute inset-0 rounded-full"
                                style={{
                                  background: 'linear-gradient(to right, #8b5cf6, #a855f7, #c084fc, #ddd6fe, #10b981, #34d399, #6ee7b7, #a7f3d0)'
                                }}
                              />
                              
                              {/* Overlay for inactive portion */}
                              <div 
                                className="absolute inset-0 bg-gray-800/60 rounded-full transition-all duration-300"
                                style={{
                                  clipPath: `polygon(${(formData.fan / 9) * 100}% 0%, 100% 0%, 100% 100%, ${(formData.fan / 9) * 100}% 100%)`
                                }}
                              />
                              
                              {/* Active indicator */}
                              <div 
                                className="absolute top-1/2 w-2 h-2 bg-white rounded-full border border-gray-900 transform -translate-y-1/2 transition-all duration-300 shadow-lg"
                                style={{
                                  left: `calc(${(formData.fan / 9) * 100}% - 4px)`
                                }}
                              />
                            </div>
                            
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>0</span>
                              <span>5</span>
                              <span>9</span>
                            </div>
                          </div>

                          {/* Heat Control */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="text-xs font-semibold tracking-wide text-gray-300">
                                HEAT LEVEL
                              </div>
                              <div className="text-sm font-bold text-white">
                                {formData.heat}
                              </div>
                            </div>
                            
                            <div className="relative h-4 rounded-full overflow-hidden cursor-pointer"
                                 onClick={(e) => {
                                   const rect = e.currentTarget.getBoundingClientRect();
                                   const x = e.clientX - rect.left;
                                   const newValue = Math.round((x / rect.width) * 9);
                                   handleInputChange('heat', Math.max(0, Math.min(9, newValue)));
                                 }}>
                              {/* Color spectrum background */}
                              <div 
                                className="absolute inset-0 rounded-full"
                                style={{
                                  background: 'linear-gradient(to right, #f97316, #fb923c, #fdba74, #fed7aa, #dc2626, #ef4444, #f87171, #fca5a5)'
                                }}
                              />
                              
                              {/* Overlay for inactive portion */}
                              <div 
                                className="absolute inset-0 bg-gray-800/60 rounded-full transition-all duration-300"
                                style={{
                                  clipPath: `polygon(${(formData.heat / 9) * 100}% 0%, 100% 0%, 100% 100%, ${(formData.heat / 9) * 100}% 100%)`
                                }}
                              />
                              
                              {/* Active indicator */}
                              <div 
                                className="absolute top-1/2 w-2 h-2 bg-white rounded-full border border-gray-900 transform -translate-y-1/2 transition-all duration-300 shadow-lg"
                                style={{
                                  left: `calc(${(formData.heat / 9) * 100}% - 4px)`
                                }}
                              />
                            </div>
                            
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>0</span>
                              <span>5</span>
                              <span>9</span>
                            </div>
                          </div>
                        </div>

                        {/* Temperature Input Section */}
                        <div className="bg-gray-800 rounded-lg p-3 w-full border border-gray-600">
                          <div className="text-sm font-semibold tracking-wide text-cyan-400 text-center mb-3">
                            TEMP LOG
                          </div>
                          
                          <div className="flex items-center gap-3 mb-3">
                            <button
                              onClick={() => {
                                const currentValue = parseFloat(formData.tempF) || 0;
                                handleInputChange('tempF', (currentValue - 1).toString());
                              }}
                              className="bg-gray-700 hover:bg-gray-600 text-white text-lg font-bold py-2 px-3 rounded transition-all duration-150"
                            >
                              −
                            </button>
                            
                            <input
                              type="number"
                              step="1"
                              value={formData.tempF}
                              onChange={(e) => handleInputChange('tempF', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  logChange();
                                }
                              }}
                              placeholder="°F"
                              className="flex-1 min-w-0 bg-gray-900 text-white text-lg font-bold text-center rounded px-3 py-2 border border-gray-600 focus:border-cyan-400 focus:outline-none"
                            />
                            
                            <button
                              onClick={() => {
                                const currentValue = parseFloat(formData.tempF) || 0;
                                handleInputChange('tempF', (currentValue + 1).toString());
                              }}
                              className="bg-gray-700 hover:bg-gray-600 text-white text-lg font-bold py-2 px-3 rounded transition-all duration-150"
                            >
                              +
                            </button>
                          </div>
                          
                          <button
                            onClick={logChange}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-2 rounded-lg text-sm font-bold transition-all duration-150 disabled:opacity-50"
                          >
                            LOG
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
                
              </div>


              {/* Milestone Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <button
                  onClick={() => markMilestone('FIRST_CRACK')}
                  disabled={loading || milestonesMarked.firstCrack || isPaused}
                  className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                    milestonesMarked.firstCrack 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                  } ${loading || isPaused ? 'opacity-50' : ''}`}
                >
                  {milestonesMarked.firstCrack ? '✅ First Crack' : '🔥 First Crack'}
                </button>
                <button
                  onClick={() => markMilestone('SECOND_CRACK')}
                  disabled={loading || milestonesMarked.secondCrack || isPaused}
                  className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                    milestonesMarked.secondCrack 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 shadow-lg'
                  } ${loading || isPaused ? 'opacity-50' : ''}`}
                >
                  {milestonesMarked.secondCrack ? '✅ Second Crack' : '🔥🔥 Second Crack'}
                </button>
                <button
                  onClick={() => markMilestone('COOL')}
                  disabled={loading || milestonesMarked.cool || isPaused}
                  className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                    milestonesMarked.cool 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 shadow-lg'
                  } ${loading || isPaused ? 'opacity-50' : ''}`}
                >
                  {milestonesMarked.cool ? '✅ Cool' : '🧊 Cool'}
                </button>
                <button
                  onClick={() => setShowEndRoastConfirm(true)}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium transition disabled:opacity-50 text-sm sm:text-base"
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

              {/* Events Table and Weather Layout */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Events Table - Reduced Width */}
                <div className="flex-1 max-w-4xl bg-white dark:bg-dark-card rounded-lg shadow dark:shadow-dark-glow overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary border-b dark:border-dark-border-primary">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text-primary">Roast Event Log</h3>
                  </div>
                <div className="overflow-x-auto text-sm sm:text-base">
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
                                <CustomDropdown
                                  options={['SET', 'FIRST_CRACK', 'SECOND_CRACK', 'COOL', 'PAUSE', 'RESUME', 'END']}
                                  value={editingFormData.kind}
                                  onChange={(value) => setEditingFormData(prev => ({ ...prev, kind: value }))}
                                  placeholder="Select event type..."
                                  className="text-xs"
                                />
                              ) : (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  event.kind === 'SET' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                  event.kind === 'FIRST_CRACK' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                                  event.kind === 'SECOND_CRACK' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                  event.kind === 'COOL' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' :
                                  event.kind === 'END' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                  event.kind === 'PAUSE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                  event.kind === 'RESUME' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
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
                
                {/* Weather Component - Bottom Right */}
                <div className="flex-shrink-0">
                  <div className="w-80">
                    {/* Environmental Conditions - Compact */}
                    {environmentalConditions && (
                      <div>
                        <EnvironmentalConditions 
                          conditions={environmentalConditions} 
                          units={userProfile?.units}
                          userProfile={userProfile}
                        />
                      </div>
                    )}
                  </div>
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
                    setIsPaused(false);
                    setPauseStartTime(null);
                    setTotalPausedTime(0);
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Weight After Roast (g) <span className="text-red-500">*</span></label>
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
                    required
                  />
                  {!formData.weightAfter && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">Weight is required to complete the roast</p>
                  )}
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
                                event.kind === 'PAUSE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                event.kind === 'RESUME' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
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
            <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
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
                          <CustomDropdown
                            options={userMachines.map(machine => ({
                              value: machine.id,
                              label: `${machine.name} (${machine.model}${machine.has_extension ? ' + ET' : ''})`
                            }))}
                            value={formData.selectedMachineId || userMachines[0]?.id}
                            onChange={(value) => {
                              const selectedMachine = userMachines.find(m => m.id === value);
                              setFormData(prev => ({
                                ...prev,
                                selectedMachineId: value,
                                model: selectedMachine?.model || '',
                                hasExtension: selectedMachine?.has_extension || false
                              }));
                            }}
                            placeholder="Select machine..."
                          />
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
                      <CustomDropdown
                        options={['Washed', 'Natural', 'Honey', 'Anaerobic', 'Other']}
                        value={formData.coffeeProcess}
                        onChange={(value) => handleInputChange('coffeeProcess', value)}
                        placeholder="Select process..."
                        error={!formData.coffeeProcess}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Target Roast</label>
                      <CustomDropdown
                        options={['City', 'City Plus', 'Full City', 'Full City Plus']}
                        value={formData.roastLevel}
                        onChange={(value) => handleInputChange('roastLevel', value)}
                        placeholder="Select roast level..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Weight Before Roast (g) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.weightBefore}
                        onChange={(e) => handleInputChange('weightBefore', e.target.value)}
                        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                        placeholder="e.g., 250"
                        required
                      />
                      {!formData.weightBefore && (
                        <p className="text-sm text-red-500 dark:text-red-400 mt-1">Initial weight is required to start the roast</p>
                      )}
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
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary px-4 sm:px-6 py-4 border-t dark:border-dark-border-primary flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
              <button
                onClick={handleStartRoastWizardCancel}
                className="px-6 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary font-medium transition"
              >
                Cancel
              </button>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
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
                    🏁 Start Roast Session
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