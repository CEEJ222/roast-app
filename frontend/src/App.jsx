import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginForm from './components/user_profile/LoginForm';
import UserProfile from './components/user_profile/UserProfile';
import SetupWizard from './components/wizards/SetupWizard';
import ProfilePage from './components/user_profile/ProfilePage';
import StartNewRoastModal from './components/wizards/StartNewRoastModal';
import EnvironmentalConditions from './components/shared/EnvironmentalConditions';
import RoastCurveGraph from './components/shared/RoastCurveGraph';
import HistoricalRoasts from './components/modals/CompareRoasts';
import { COFFEE_REGIONS } from './data/coffeeRegions';
import CustomDropdown from './components/ux_ui/CustomDropdown';
import DashboardHistoricalRoasts from './components/dashboard/DashboardHistoricalRoasts';
import RoastDetailPage from './components/RoastDetailPage';
import ConfirmationModal from './components/modals/ConfirmationModal';
import TemperatureInputModal from './components/modals/TemperatureInputModal';
import ThemeToggle from './components/user_profile/ThemeToggle';
import InitialRoasterSettings from './components/modals/InitialRoasterSettings';
import RoastControls from './components/during_roast/RoastControls';
import EventsTable from './components/during_roast/EventsTable';
import RoastTimer from './components/during_roast/RoastTimer';
import AfterRoast from './components/during_roast/AfterRoast';
import ActiveRoast from './components/during_roast/ActiveRoast';
import Dashboard from './components/dashboard/Dashboard';
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
      const response = await fetch(`${API_BASE}/roasts?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const roasts = await response.json();
        // Sort by created_at descending (newest first)
        const sortedRoasts = roasts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setHistoricalRoasts(sortedRoasts);
        
        // Load details for all roasts to display curves on dashboard
        await loadAllRoastDetails(sortedRoasts);
      }
    } catch (error) {
      console.error('Error loading historical roasts:', error);
    } finally {
      setLoadingHistoricalRoasts(false);
    }
  };

  // Load roast details for all roasts (for automatic curve display)
  const loadAllRoastDetails = async (allRoasts) => {
    if (!allRoasts || allRoasts.length === 0) {
      setRecentRoastDetails({});
      return;
    }

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
      setRecentRoastDetails({});
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
    // The roast has already been created by StartNewRoastModal
    // This function just sets the initial fan/heat levels and starts the session
    console.log('Setting initial roast settings and starting session');
    
    setLoading(true);
    try {
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
        
        await apiCall(`${API_BASE}/roasts/${roastId}/events`, {
          method: 'POST',
          body: JSON.stringify({
            kind: 'SET',
            fan_level: fanLevel,
            heat_level: heatLevel,
            note: 'Initial settings'
          })
        });
      }
      
      refreshEvents(roastId);
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
            <Dashboard
              historicalRoasts={historicalRoasts}
              recentRoastDetails={recentRoastDetails}
              userProfile={userProfile}
              loadingHistoricalRoasts={loadingHistoricalRoasts}
              showFullHistoricalRoasts={showFullHistoricalRoasts}
              setShowFullHistoricalRoasts={setShowFullHistoricalRoasts}
              setShowStartRoastWizard={setShowStartRoastWizard}
              setShowHistoricalRoasts={setShowHistoricalRoasts}
              handleRoastResume={handleRoastResume}
              selectedRoasts={selectedRoasts}
              getAuthToken={getAuthToken}
              setSelectedRoasts={setSelectedRoasts}
              roastDetails={roastDetails}
              setRoastDetails={setRoastDetails}
              roastId={roastId}
            />
          )}


          {/* Initial Settings Modal */}
          <InitialRoasterSettings
            isOpen={showInitialSettings}
            onClose={() => setShowInitialSettings(false)}
            onStart={startRoast}
            initialSettings={initialSettings}
            setInitialSettings={setInitialSettings}
            loading={loading}
            weightBefore={formData.weightBefore}
          />

          {/* Active Roast */}
          {roastId && (
            <ActiveRoast
              roastId={roastId}
              roastEnded={roastEnded}
              formData={formData}
              handleInputChange={handleInputChange}
              logChange={logChange}
              loading={loading}
              elapsedTime={elapsedTime}
              formatTime={formatTime}
              currentPhase={currentPhase}
              dryingTime={dryingTime}
              developmentTime={developmentTime}
              coolingTime={coolingTime}
              milestonesMarked={milestonesMarked}
              isPaused={isPaused}
              pauseRoast={pauseRoast}
              resumeRoast={resumeRoast}
              markMilestone={markMilestone}
              events={events}
              editingEventId={editingEventId}
              editingFormData={editingFormData}
              setEditingFormData={setEditingFormData}
              startEditEvent={startEditEvent}
              saveEditedEvent={saveEditedEvent}
              cancelEdit={cancelEdit}
              deleteEvent={deleteEvent}
              environmentalConditions={environmentalConditions}
              userProfile={userProfile}
              finishRoast={finishRoast}
              endRoastSession={endRoastSession}
              setRoastId={setRoastId}
              setStartTs={setStartTs}
              setRoastEnded={setRoastEnded}
              setEvents={setEvents}
              setEnvironmentalConditions={setEnvironmentalConditions}
              setIsPaused={setIsPaused}
              setPauseStartTime={setPauseStartTime}
              setTotalPausedTime={setTotalPausedTime}
              setMilestonesMarked={setMilestonesMarked}
              showEndRoastConfirm={showEndRoastConfirm}
              setShowEndRoastConfirm={setShowEndRoastConfirm}
              getAuthToken={getAuthToken}
            />
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

      {/* Start New Roast Modal */}
      <StartNewRoastModal
        isOpen={showStartRoastWizard}
        onClose={() => {
          setShowStartRoastWizard(false);
          setRoastSetupStep('machine');
        }}
        onStart={(data) => {
          console.log('DEBUG: onStart received data:', data);
          console.log('DEBUG: weight_before_g in data:', data.weight_before_g);
          
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
          
          // Update form data with initial settings and weight
          setFormData(prev => {
            const newData = {
              ...prev,
              weightBefore: data.weight_before_g || prev.weightBefore,
              fan: initialSettings.fan_level !== undefined && initialSettings.fan_level !== '' ? parseInt(initialSettings.fan_level) : 8,
              heat: initialSettings.heat_level !== undefined && initialSettings.heat_level !== '' ? parseInt(initialSettings.heat_level) : 4
            };
            console.log('DEBUG: Setting formData.weightBefore to:', newData.weightBefore);
            return newData;
          });
          
          // Create initial SET event with user-provided settings (without loading state)
          if (initialSettings.fan_level !== undefined || initialSettings.heat_level !== undefined) {
            // This will be handled by the component
          }
          
          setShowStartRoastWizard(false);
          setRoastSetupStep('machine');
          showInitialSettingsForm();
        }}
        userProfile={userProfile}
        userMachines={userMachines}
        environmentalConditions={environmentalConditions}
        getAuthToken={getAuthToken}
        setLoading={setLoading}
        setShowProfilePage={setShowProfilePage}
      />
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