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
import HistoricalRoasts from './pages/CompareRoasts';
import { COFFEE_REGIONS } from './data/coffeeRegions';
import CustomDropdown from './components/ux_ui/CustomDropdown';
import DashboardHistoricalRoasts from './components/dashboard/DashboardHistoricalRoasts';
import RoastDetailPage from './components/roast-details/RoastDetailPage';
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
import AppLayout from './components/layout/AppLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import { Analytics } from '@vercel/analytics/react';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

// Using inline editing instead of modal

function RoastAssistant() {
  const { user, getAuthToken, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
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
  const [showAdminPage, setShowAdminPage] = useState(false);
  const [roastDetails, setRoastDetails] = useState({});
  const [recentRoastDetails, setRecentRoastDetails] = useState({});
  const [milestonesMarked, setMilestonesMarked] = useState({
    dryEnd: false,
    firstCrack: false,
    secondCrack: false,
    cool: false
  });
  const [currentPhase, setCurrentPhase] = useState('drying'); // 'drying', 'maillard', 'development', 'cooling'
  const [developmentStartTime, setDevelopmentStartTime] = useState(null);
  const [developmentTime, setDevelopmentTime] = useState(0);
  
  // Phase timing state
  const [dryingStartTime, setDryingStartTime] = useState(null);
  const [dryingTime, setDryingTime] = useState(0);
  const [maillardStartTime, setMaillardStartTime] = useState(null);
  const [maillardTime, setMaillardTime] = useState(0);
  const [coolingStartTime, setCoolingStartTime] = useState(null);
  const [coolingTime, setCoolingTime] = useState(0);

  // Roast duration (expected roast time + 3 min cooling buffer)
  const [roastDuration, setRoastDuration] = useState(13); // Default 10 min roast + 3 min cooling

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
      
      // Update maillard time if we're in maillard phase
      if (currentPhase === 'maillard' && maillardStartTime) {
        const maillardTime = Math.floor((currentTime - maillardStartTime - totalPausedTime) / 1000);
        // Cap maillard time at reasonable maximum (e.g., 30 minutes)
        const cappedMaillardTime = Math.min(Math.max(0, maillardTime), 1800);
        if (cappedMaillardTime !== maillardTime) {
          console.log('DEBUG: Timer - Capped maillard time from', maillardTime, 'to', cappedMaillardTime);
        }
        setMaillardTime(cappedMaillardTime);
      }
      
      // Update development time if we're in development phase
      if (currentPhase === 'development' && developmentStartTime) {
        const devTime = Math.floor((currentTime - developmentStartTime - totalPausedTime) / 1000);
        // Cap development time at reasonable maximum (e.g., 20 minutes)
        const cappedDevTime = Math.min(Math.max(0, devTime), 1200);
        setDevelopmentTime(cappedDevTime);
      }
      
      // Update cooling time if we're in cooling phase
      if (currentPhase === 'cooling' && coolingStartTime) {
        const coolTime = Math.floor((currentTime - coolingStartTime - totalPausedTime) / 1000);
        setCoolingTime(Math.max(0, coolTime));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTs, currentPhase, dryingStartTime, maillardStartTime, developmentStartTime, coolingStartTime, isPaused, totalPausedTime]);

  // Load user profile data with caching
  const loadUserProfile = async (forceRefresh = false) => {
    if (!user) return;
    
    // Check if we already have profile data and don't need to refresh
    if (!forceRefresh && userProfile && userProfile.address) {
      return;
    }
    
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

  // Add a function to refresh profile data when needed
  const refreshUserProfile = () => {
    loadUserProfile(true);
  };

  // Disable pull-to-refresh when modals are open
  useEffect(() => {
    if (showRoastDetail || showHistoricalRoasts) {
      document.body.style.overscrollBehavior = 'none';
      document.body.style.touchAction = 'pan-x pan-y';
    } else {
      document.body.style.overscrollBehavior = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overscrollBehavior = '';
      document.body.style.touchAction = '';
    };
  }, [showRoastDetail, showHistoricalRoasts]);

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
      const roastStartTs = Math.floor(new Date(roast.created_at).getTime() / 1000);
      setStartTs(roastStartTs);
      setRoastEnded(false); // Assume not ended if we're resuming
      
      // Set roast duration (default to 13 minutes if not specified)
      setRoastDuration(13);
      
      // Reset pause state
      setIsPaused(false);
      setPauseStartTime(null);
      setTotalPausedTime(0);
      
      // Load events for this roast with the correct startTs
      refreshEvents(roast.id, roastStartTs);
      
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
      
      // Load bean profile data if available
      if (roast.bean_profile_id) {
        try {
          const token = await getAuthToken();
          const response = await fetch(`${API_BASE}/bean-profiles/${roast.bean_profile_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const beanProfile = await response.json();
            console.log('Loaded bean profile for resumed roast:', beanProfile);
            
            // Update formData with bean profile and machine info
            setFormData(prev => {
              // Find the machine used for this roast
              const selectedMachineId = prev.selectedMachineId;
              const hasExtension = prev.hasExtension || prev.has_extension;
              const foundMachine = userMachines.find(m => m.id === selectedMachineId);
              
              const selectedMachine = foundMachine || {
                id: selectedMachineId,
                name: prev.model + (hasExtension ? ' + ET' : ''),
                model: prev.model,
                has_extension: hasExtension
              };
              
              return {
                ...prev,
                selectedBeanProfile: beanProfile,
                selectedMachine: selectedMachine,
                weightBefore: roast.weight_before_g || prev.weightBefore,
                roastLevel: roast.desired_roast_level || prev.roastLevel
              };
            });
          }
        } catch (error) {
          console.error('Error loading bean profile for resumed roast:', error);
        }
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

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    if (kind === 'DRY_END' && milestonesMarked.dryEnd) return;
    if (kind === 'FIRST_CRACK' && milestonesMarked.firstCrack) return;
    if (kind === 'SECOND_CRACK' && milestonesMarked.secondCrack) return;
    if (kind === 'COOL' && milestonesMarked.cool) return;

    // For all milestones, no temperature input required - log directly
    try {
      await apiCall(`${API_BASE}/roasts/${roastId}/events`, {
        method: 'POST',
        body: JSON.stringify({ kind })
      });

      // Update milestone tracking and phase changes immediately
      if (kind === 'DRY_END') {
        setMilestonesMarked(prev => ({ ...prev, dryEnd: true }));
        setCurrentPhase('maillard');
        setMaillardStartTime(Date.now());
        setMaillardTime(0);
      } else if (kind === 'FIRST_CRACK') {
        setMilestonesMarked(prev => ({ ...prev, firstCrack: true }));
        setCurrentPhase('development');
        setDevelopmentStartTime(Date.now());
        setDevelopmentTime(0);
      } else if (kind === 'SECOND_CRACK') {
        setMilestonesMarked(prev => ({ ...prev, secondCrack: true }));
      } else if (kind === 'COOL') {
        setMilestonesMarked(prev => ({ ...prev, cool: true }));
        setCurrentPhase('cooling');
        setCoolingStartTime(Date.now());
        setCoolingTime(0);
      }

      refreshEvents();
    } catch (error) {
      // Error already handled in apiCall
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
        if (pendingMilestone === 'DRY_END') {
          setMilestonesMarked(prev => ({ ...prev, dryEnd: true }));
          setCurrentPhase('maillard');
          setMaillardStartTime(Date.now());
          setMaillardTime(0);
        } else if (pendingMilestone === 'FIRST_CRACK') {
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

  const refreshEvents = async (id = roastId, startTsOverride = null) => {
    if (!id) return;
    
    // Use the provided startTs or fall back to the state
    const effectiveStartTs = startTsOverride || startTs;
    if (startTsOverride) {
      console.log('DEBUG: Using startTs override:', startTsOverride, 'instead of state:', startTs);
    }
    try {
      const data = await apiCall(`${API_BASE}/roasts/${id}/events`);
      // Your backend returns the array directly, not wrapped in an object
      setEvents(data); // This is correct
      
      // Check if milestones have already been marked
      const hasDryEnd = data.some(event => event.kind === 'DRY_END');
      const hasFirstCrack = data.some(event => event.kind === 'FIRST_CRACK');
      const hasSecondCrack = data.some(event => event.kind === 'SECOND_CRACK');
      const hasCool = data.some(event => event.kind === 'COOL');
      
      setMilestonesMarked({
        dryEnd: hasDryEnd,
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
          const coolTime = effectiveStartTs * 1000 + (coolEvent.t_offset_sec * 1000);
          setCoolingStartTime(coolTime);
          const currentCoolTime = Math.floor((Date.now() - coolTime) / 1000);
          setCoolingTime(Math.max(0, currentCoolTime));
          
          // Set all previous phase data
          const roastStartTimeMs = effectiveStartTs * 1000;
          setDryingStartTime(roastStartTimeMs);
          
          // Set maillard and development phase data
          const dryEndEvent = data.find(event => event.kind === 'DRY_END');
          const firstCrackEvent = data.find(event => event.kind === 'FIRST_CRACK');
          
          if (dryEndEvent && firstCrackEvent) {
            const dryEndTimeMs = roastStartTimeMs + (dryEndEvent.t_offset_sec * 1000);
            const firstCrackTimeMs = roastStartTimeMs + (firstCrackEvent.t_offset_sec * 1000);
            
            setDryingTime(dryEndEvent.t_offset_sec);
            setMaillardStartTime(dryEndTimeMs);
            setMaillardTime(firstCrackEvent.t_offset_sec - dryEndEvent.t_offset_sec);
            setDevelopmentStartTime(firstCrackTimeMs);
            setDevelopmentTime(coolEvent.t_offset_sec - firstCrackEvent.t_offset_sec);
          } else if (firstCrackEvent) {
            // No dry end, so all time until first crack is drying
            setDryingTime(firstCrackEvent.t_offset_sec);
            setMaillardStartTime(null);
            setMaillardTime(0);
            setDevelopmentStartTime(roastStartTimeMs + (firstCrackEvent.t_offset_sec * 1000));
            setDevelopmentTime(coolEvent.t_offset_sec - firstCrackEvent.t_offset_sec);
          } else {
            // No first crack, so all time is drying
            setDryingTime(coolEvent.t_offset_sec);
            setMaillardStartTime(null);
            setMaillardTime(0);
            setDevelopmentStartTime(null);
            setDevelopmentTime(0);
          }
        }
      } else if (hasFirstCrack) {
        setCurrentPhase('development');
        // Calculate development time if we're resuming
        const firstCrackEvent = data.find(event => event.kind === 'FIRST_CRACK');
        if (firstCrackEvent) {
          const firstCrackTime = effectiveStartTs * 1000 + (firstCrackEvent.t_offset_sec * 1000);
          setDevelopmentStartTime(firstCrackTime);
          const currentDevTime = Math.floor((Date.now() - firstCrackTime) / 1000);
          // Cap development time at reasonable maximum (e.g., 20 minutes)
          const cappedDevTime = Math.min(Math.max(0, currentDevTime), 1200);
          setDevelopmentTime(cappedDevTime);
          
          // Set drying phase data (completed)
          const roastStartTimeMs = effectiveStartTs * 1000;
          setDryingStartTime(roastStartTimeMs);
          
          // Set maillard phase data if dry end exists
          const dryEndEvent = data.find(event => event.kind === 'DRY_END');
          if (dryEndEvent) {
            const dryEndTimeMs = roastStartTimeMs + (dryEndEvent.t_offset_sec * 1000);
            setMaillardStartTime(dryEndTimeMs);
            setMaillardTime(firstCrackEvent.t_offset_sec - dryEndEvent.t_offset_sec);
            setDryingTime(dryEndEvent.t_offset_sec);
          } else {
            // No dry end, so all time is drying
            setDryingTime(firstCrackEvent.t_offset_sec);
            setMaillardStartTime(null);
            setMaillardTime(0);
          }
          
          // Reset cooling time
          setCoolingStartTime(null);
          setCoolingTime(0);
        }
      } else if (hasDryEnd) {
        setCurrentPhase('maillard');
        // Calculate maillard time if we're resuming
        const dryEndEvent = data.find(event => event.kind === 'DRY_END');
        if (dryEndEvent) {
          // Calculate maillard time as elapsed time since dry end
          const currentTime = Date.now();
          const roastStartTimeMs = effectiveStartTs * 1000;
          const dryEndTimeMs = roastStartTimeMs + (dryEndEvent.t_offset_sec * 1000);
          const maillardTimeSeconds = Math.floor((currentTime - dryEndTimeMs) / 1000);
          
          console.log('DEBUG: Roast start:', roastStartTimeMs, 'Dry end offset:', dryEndEvent.t_offset_sec, 'Dry end time:', dryEndTimeMs, 'Current time:', currentTime, 'Maillard time:', maillardTimeSeconds);
          
          // Set drying phase data (completed)
          setDryingStartTime(roastStartTimeMs);
          setDryingTime(dryEndEvent.t_offset_sec);
          
          // Set maillard phase data
          setMaillardStartTime(dryEndTimeMs);
          // Cap maillard time at reasonable maximum (e.g., 30 minutes)
          const cappedMaillardTime = Math.min(Math.max(0, maillardTimeSeconds), 1800);
          console.log('DEBUG: Setting maillardTime to:', cappedMaillardTime);
          setMaillardTime(cappedMaillardTime);
          
          // Reset other phase times
          setDevelopmentStartTime(null);
          setDevelopmentTime(0);
          setCoolingStartTime(null);
          setCoolingTime(0);
        }
      } else {
        setCurrentPhase('drying');
        // Drying phase starts when roast starts (startTs is in seconds)
        const roastStartTimeMs = effectiveStartTs * 1000;
        setDryingStartTime(roastStartTimeMs);
        const currentDryingTime = Math.floor((Date.now() - roastStartTimeMs) / 1000);
        setDryingTime(Math.max(0, currentDryingTime));
        
        // Reset other phase times when in drying phase
        setMaillardStartTime(null);
        setMaillardTime(0);
        setDevelopmentStartTime(null);
        setDevelopmentTime(0);
        setCoolingStartTime(null);
        setCoolingTime(0);
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
        dryEnd: false,
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

  const cancelRoast = async () => {
    if (!roastId) return;

    try {
      await apiCall(`${API_BASE}/roasts/${roastId}`, {
        method: 'DELETE'
      });

      setStatus(`🗑️ Roast deleted`);
      
      // Reset roast state and redirect to dashboard
      setRoastId(null);
      setStartTs(null);
      setRoastEnded(false);
      setEvents([]);
      setEnvironmentalConditions(null);
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
        dryEnd: false,
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

  // Show admin page if user is admin and admin page is requested
  if (showAdminPage && user?.user_metadata?.role === 'admin') {
    return (
      <div className="min-h-screen bg-light-gradient-blue dark:bg-dark-gradient p-2 sm:p-4">
        <div className="max-w-7xl mx-auto bg-transparent rounded-xl shadow-2xl dark:shadow-dark-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant px-3 sm:px-6 py-2 sm:py-4 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Admin Panel</h1>
                  <p className="text-xs sm:text-sm opacity-90">Analytics, feedback, and feature management</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminPage(false)}
                className="w-full sm:w-auto bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
          <AdminDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-gradient-blue dark:bg-dark-gradient">
      {/* Header - Full width, no border radius */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant px-3 sm:px-6 py-2 sm:py-4 text-white">
        <div className="flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold truncate">
              {isMobile ? "🔥 ☕" : "🔥 Roast Buddy ☕"}
            </h1>
            <p className="opacity-90 text-xs sm:text-base hidden sm:block">Professional roast logging and analysis</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 ml-3">
            {user?.user_metadata?.role === 'admin' && (
              <button
                onClick={() => setShowAdminPage(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                title="Admin Panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            {!isMobile && <UserProfile />}
          </div>
        </div>
      </div>

      <div className="">
        <div className="max-w-7xl mx-auto bg-transparent rounded-xl shadow-2xl dark:shadow-dark-xl overflow-hidden">
          {/* Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center">
                <div className="mb-4">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text-primary mb-2">Loading</h3>
                <p className="text-gray-600 dark:text-dark-text-secondary">Please wait...</p>
              </div>
            </div>
          )}

          <div>

          {/* App Layout - Show when no active roast */}
          {!roastId && (
            <AppLayout
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
              onDataChange={loadHistoricalRoasts}
              setUserProfile={setUserProfile}
              setLoading={setLoading}
              setShowProfilePage={setShowProfilePage}
              refreshUserProfile={refreshUserProfile}
              triggerBeanProfileCreate={false}
              onTriggerReset={() => {}}
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
              maillardTime={maillardTime}
              developmentTime={developmentTime}
              coolingTime={coolingTime}
              milestonesMarked={milestonesMarked}
              roastDuration={roastDuration}
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
              cancelRoast={cancelRoast}
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
        onStart={(data, roastTime) => {
          console.log('DEBUG: onStart received data:', data);
          console.log('DEBUG: Backend bean_profile:', data.bean_profile);
          console.log('DEBUG: Backend bean_profile_id:', data.bean_profile_id);
          console.log('DEBUG: Roast time:', roastTime);
          
          setRoastId(data.roast_id);
          setStartTs(data.start_ts);
          setEnvironmentalConditions(data.env);
          
          // Set roast duration (roast time + 3 minutes for cooling)
          setRoastDuration(roastTime + 3);
          
          // Reset phase tracking for new roast
          setCurrentPhase('drying');
          setDryingStartTime(Date.now());
          setDryingTime(0);
          setMaillardStartTime(null);
          setMaillardTime(0);
          setDevelopmentStartTime(null);
          setDevelopmentTime(0);
          setCoolingStartTime(null);
          setCoolingTime(0);
          
          // Update form data with initial settings and weight, using backend data
          setFormData(prev => {
            // Construct machine object from available data
            const selectedMachineId = prev.selectedMachineId;
            const hasExtension = prev.hasExtension || prev.has_extension;
            const foundMachine = userMachines.find(m => m.id === selectedMachineId);
            
            const selectedMachine = foundMachine || {
              id: selectedMachineId,
              name: prev.model + (hasExtension ? ' + ET' : ''),
              model: prev.model,
              has_extension: hasExtension
            };
            
            const newData = {
              ...prev,
              weightBefore: data.weight_before_g || prev.weightBefore,
              fan: initialSettings.fan_level !== undefined && initialSettings.fan_level !== '' ? parseInt(initialSettings.fan_level) : 8,
              heat: initialSettings.heat_level !== undefined && initialSettings.heat_level !== '' ? parseInt(initialSettings.heat_level) : 4,
              selectedBeanProfile: data.bean_profile, // Use bean profile from backend response
              selectedMachine: selectedMachine // Construct machine object
            };
            console.log('DEBUG: Setting formData with backend data');
            console.log('DEBUG: Backend bean_profile:', data.bean_profile);
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
        refreshUserProfile={refreshUserProfile}
      />
      </div>
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