import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CustomDropdown from '../ux_ui/CustomDropdown';
import URLInputModal from '../modals/URLInputModal';
import LLMAnalysisModal from '../modals/LLMAnalysisModal';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app';

const BeanProfileForm = ({ isOpen, onClose, onSave, initialData = null, getAuthToken, beanProfileId = null, onDataUpdate = null }) => {
  const [formData, setFormData] = useState({
    // Basic Info (from roast form)
    name: '',
    origin: '', // This will be pre-populated from roast form
    variety: '', // This will be pre-populated from roast form  
    process_method: '', // This will be pre-populated from roast form
    bean_type: '', // NEW: Bean type (Regular, Peaberry, Maragogype, etc.)
    recommended_roast_levels: [], // This will be pre-populated from roast form
    espresso_suitable: false, // Good for espresso checkbox
    notes: '',
    supplier_url: '',
    supplier_name: '',
    
    // Tier 1: Must Have (Critical for AI Coaching)
    moisture_content_pct: '',
    density_g_ml: '',
    
    // Tier 2: Very Important
    screen_size: '',
    altitude_m: '',
    body_intensity: 0,
    
    // Tier 3: Helpful
    acidity_intensity: 0,
    
    // Flavor Profile (Additional) - Removed for simplicity
    flavor_notes: [],
    cupping_score: '',
    
    // Additional fields expected by backend
    roasting_notes: '',
    qr_code_url: ''
  });

  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showURLModal, setShowURLModal] = useState(false);
  const [showLLMModal, setShowLLMModal] = useState(false);
  const [llmAnalysisResult, setLlmAnalysisResult] = useState(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Reset dataLoaded when beanProfileId or initialData changes
  useEffect(() => {
    setDataLoaded(false);
  }, [beanProfileId, initialData]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Check if form has unsaved changes
  const hasUnsavedChanges = () => {
    return formData.name.trim() !== '' || 
           formData.notes.trim() !== '' || 
           formData.origin !== '' || 
           formData.variety !== '' ||
           formData.process_method !== '';
  };

  // Handle close with confirmation
  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  // Initialize form with existing data if editing
  useEffect(() => {
    if (dataLoaded) return; // Prevent re-loading data
    
    if (initialData) {
      console.log('DEBUG: Loading initialData:', initialData);
      setFormData({
        ...initialData,
        flavor_notes: initialData.flavor_notes || []
      });
      setDataLoaded(true);
    } else if (beanProfileId) {
      console.log('DEBUG: Loading beanProfileId:', beanProfileId);
      // Load profile data from backend
      const loadProfileData = async () => {
        try {
          const token = await getAuthToken();
          const response = await fetch(`${API_BASE}/bean-profiles/${beanProfileId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const profileData = await response.json();
            console.log('DEBUG: Loaded profile data:', profileData);
            setFormData({
              ...profileData,
              flavor_notes: profileData.flavor_notes || []
            });
            setDataLoaded(true);
          } else {
            console.error('Failed to load bean profile data');
          }
        } catch (error) {
          console.error('Error loading bean profile data:', error);
        }
      };
      
      loadProfileData();
    }
  }, [initialData, beanProfileId, getAuthToken]); // Removed dataLoaded from dependencies

  const handleInputChange = (field, value) => {
    console.log('DEBUG: Input change:', field, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Touch handlers for mobile modal
  const handleTouchStart = (e) => {
    // Touch start handler for mobile modal
  };

  const handleTouchMove = (e) => {
    // Touch move handler for mobile modal
  };

  const handleTouchEnd = (e) => {
    // Touch end handler for mobile modal
  };

  const handleManualURLInput = () => {
    setShowURLModal(true);
  };

  const scanQRCode = async () => {
    try {
      // Add haptic feedback
      await Haptics.impact({ style: ImpactStyle.Medium });
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      
      // For now, we'll use the existing URL parsing logic
      // In a real implementation, you'd process the QR code from the image
      alert('QR code scanning is ready! The image has been captured. In a full implementation, this would decode the QR code and extract bean information.');
      
    } catch (error) {
      console.error('QR scan failed:', error);
      alert('Failed to scan QR code: ' + error.message);
    }
  };

  const handleAIAnalysis = async () => {
    console.log('DEBUG: handleAIAnalysis called');
    console.log('DEBUG: formData.notes:', formData.notes);
    
    if (!formData.notes || formData.notes.trim().length < 10) {
      alert('Please provide a detailed description of the coffee (at least 10 characters) for AI analysis');
      return;
    }
    
    // TEMPORARY: Use mock data directly in frontend to test the flow
    console.log('DEBUG: Using mock LLM data for testing');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock characteristics based on input text
    const mockCharacteristics = {
      origin: "Indonesia",
      process: "Wet Process", 
      variety: "Ateng, Jember, Tim Tim, Typica",
      bean_type: "Regular",
      altitude: null, // Not mentioned in text
      density: null, // Will extract from text
      cupping_score: null, // Not mentioned in text
      screen_size: "16-19", // From "16-19 Screen" in text
      moisture_content: null, // Not mentioned in text
      harvest_year: null // Not mentioned in text
    };
    
    // Try to extract origin from text
    const inputLower = formData.notes.toLowerCase();
    if (inputLower.includes('ethiopia') || inputLower.includes('yirgacheffe')) {
      mockCharacteristics.origin = "Ethiopia";
      mockCharacteristics.process = "Natural";
      mockCharacteristics.variety = "Heirloom";
    } else if (inputLower.includes('colombia')) {
      mockCharacteristics.origin = "Colombia";
      mockCharacteristics.process = "Washed";
      mockCharacteristics.variety = "Caturra";
    } else if (inputLower.includes('kenya')) {
      mockCharacteristics.origin = "Kenya";
      mockCharacteristics.process = "Washed";
      mockCharacteristics.variety = "SL28, SL34";
    } else if (inputLower.includes('sumatra') || inputLower.includes('indonesia') || inputLower.includes('kerinci')) {
      mockCharacteristics.origin = "Indonesia";
      mockCharacteristics.process = "Wet Process";
      mockCharacteristics.variety = "Ateng, Jember, Tim Tim, Typica";
      // Extract altitude from text: "situated between 1400 - 1500 meters above sea level"
      if (inputLower.includes('1400') && inputLower.includes('1500')) {
        mockCharacteristics.altitude = 1450; // Midpoint of range
      }
    }
    
    // Extract density from text (e.g., ".6 d/300gr")
    const densityMatch = formData.notes.match(/(\d*\.?\d+)\s*d\/300gr/i);
    if (densityMatch) {
      mockCharacteristics.density = parseFloat(densityMatch[1]);
    }

    // Extract screen size from text (e.g., "16-19 Screen")
    const screenMatch = formData.notes.match(/(\d+)-(\d+)\s*screen/i);
    if (screenMatch) {
      const minSize = parseInt(screenMatch[1]);
      const maxSize = parseInt(screenMatch[2]);
      const avgSize = (minSize + maxSize) / 2;
      
      // Map to closest dropdown option
      if (avgSize <= 15) {
        mockCharacteristics.screen_size = "14-15";
      } else if (avgSize <= 16) {
        mockCharacteristics.screen_size = "15-16";
      } else if (avgSize <= 17) {
        mockCharacteristics.screen_size = "16-17";
      } else {
        mockCharacteristics.screen_size = "17-18";
      }
    }

    // Extract acidity intensity from text
    if (inputLower.includes('bracing') || inputLower.includes('pronounced acidity') || inputLower.includes('bright acidity')) {
      mockCharacteristics.acidity_intensity = 4; // High
    } else if (inputLower.includes('pleasant level of acidity') || inputLower.includes('moderate acidity')) {
      mockCharacteristics.acidity_intensity = 3; // Medium-High
    } else if (inputLower.includes('low acidity') || inputLower.includes('mild acidity')) {
      mockCharacteristics.acidity_intensity = 1; // Low
    } else if (inputLower.includes('acidity')) {
      mockCharacteristics.acidity_intensity = 2; // Medium
    }

    // Extract body intensity from text
    if (inputLower.includes('full body') || inputLower.includes('heavy body') || inputLower.includes('intense') || inputLower.includes('foundational')) {
      mockCharacteristics.body_intensity = 4; // High
    } else if (inputLower.includes('medium body') || inputLower.includes('moderate body')) {
      mockCharacteristics.body_intensity = 3; // Medium-High
    } else if (inputLower.includes('light body') || inputLower.includes('clean flavor profile')) {
      mockCharacteristics.body_intensity = 2; // Medium
    } else if (inputLower.includes('thin body') || inputLower.includes('delicate')) {
      mockCharacteristics.body_intensity = 1; // Low
    }

    // Extract roast recommendations from text
    let recommendedRoastLevels = ["City", "City+", "Full City"]; // Default
    if (inputLower.includes('city to full city+')) {
      // "City to Full City+" means ALL levels: City, City+, Full City, AND Full City+
      recommendedRoastLevels = ["City", "City+", "Full City", "Full City+"];
    } else if (inputLower.includes('city to full city')) {
      recommendedRoastLevels = ["City", "City+", "Full City"];
    } else if (inputLower.includes('city+ to full city')) {
      recommendedRoastLevels = ["City+", "Full City"];
    } else if (inputLower.includes('city to city+')) {
      recommendedRoastLevels = ["City", "City+"];
    }
    
    // Mock guidance
    const mockGuidance = {
      roast_profile: {
        recommended_levels: recommendedRoastLevels,
        total_time: "10-12 minutes",
        development_ratio: "0.20-0.25"
      },
      heat_settings: {
        initial_heat: "4", // 0-9 scale for FreshRoast (more realistic starting point)
        fan_speed: "4",    // 0-9 scale for FreshRoast (conservative fan setting)
        notes: `FreshRoast settings: Start with heat 4, fan 4 for ${mockCharacteristics.origin} ${mockCharacteristics.process} coffee. Increase heat gradually if needed, watch for even bean movement.`
      },
      roasting_timeline: {
        drying_phase: "0-4 minutes: Watch for yellowing",
        maillard_phase: "4-8 minutes: Expect browning",
        first_crack: "8-10 minutes: Listen carefully",
        development: "10-12 minutes: Control development"
      },
      key_watch_points: [
        "Monitor bean movement during drying",
        "Listen for first crack around 8-12 minutes",
        "Watch for even color development",
        "Control heat during development phase"
      ],
      expected_flavors: [
        "Bright acidity",
        "Floral notes",
        "Clean finish"
      ],
      troubleshooting: {
        stalling_roast: "Increase heat slightly",
        too_fast: "Decrease heat/increase fan",
        scorching: "Reduce heat, increase fan",
        uneven_roast: "Check bean agitation"
      }
    };
    
      // Update form with ALL recognized characteristics
      setFormData(prev => ({
        ...prev,
        origin: mockCharacteristics.origin || prev.origin,
        variety: mockCharacteristics.variety || prev.variety,
        process_method: mockCharacteristics.process || prev.process_method,
        bean_type: mockCharacteristics.bean_type || prev.bean_type,
        altitude_m: mockCharacteristics.altitude || prev.altitude_m,
        cupping_score: mockCharacteristics.cupping_score || prev.cupping_score,
        screen_size: mockCharacteristics.screen_size || prev.screen_size,
        moisture_content_pct: mockCharacteristics.moisture_content || prev.moisture_content_pct,
        density_g_ml: mockCharacteristics.density || prev.density_g_ml,
        harvest_year: mockCharacteristics.harvest_year || prev.harvest_year,
        acidity_intensity: mockCharacteristics.acidity_intensity || prev.acidity_intensity,
        body_intensity: mockCharacteristics.body_intensity || prev.body_intensity,
        recommended_roast_levels: recommendedRoastLevels,
      }));
    
    // Show custom modal with results
    setLlmAnalysisResult({
      characteristics: mockCharacteristics,
      guidance: mockGuidance
    });
    setShowLLMModal(true);
    
    console.log('DEBUG: Mock analysis complete, modal should show');
  };

  const handleParseSupplierURL = async () => {
    if (!formData.supplier_url) {
      alert('Please enter a supplier URL first');
      return;
    }
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/bean-profiles/parse-supplier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: formData.supplier_url })
      });
      
      if (!response.ok) {
        throw new Error('Failed to parse supplier URL');
      }
      
      const result = await response.json();
      if (result.success) {
        // Update form with parsed data
        setFormData(prev => ({
          ...prev,
          ...result.data
        }));
        alert('Successfully parsed supplier data!');
      } else {
        alert('Failed to parse supplier data');
      }
    } catch (error) {
      console.error('Error parsing supplier URL:', error);
      alert('Error parsing supplier URL: ' + error.message);
    }
  };

  const handleHTMLParseComplete = (parsedData) => {
    console.log('HTML parsed data:', parsedData);
    
    // Update form data with parsed information
    setFormData(prev => ({
      ...prev,
      name: parsedData.name || prev.name,
      origin: parsedData.origin || prev.origin,
      variety: parsedData.variety || prev.variety,
      process_method: parsedData.process_method || prev.process_method,
      bean_type: parsedData.bean_type || prev.bean_type,  // NEW: Include bean_type
      screen_size: parsedData.screen_size || prev.screen_size,
      density_g_ml: parsedData.density_g_ml || prev.density_g_ml,
      altitude_m: parsedData.altitude_m || prev.altitude_m,
      cupping_score: parsedData.cupping_score || prev.cupping_score,
      body_intensity: parsedData.body_intensity || prev.body_intensity,
      acidity_intensity: parsedData.acidity_intensity || prev.acidity_intensity,
      notes: parsedData.notes || prev.notes,
      roasting_notes: parsedData.roasting_notes || prev.roasting_notes,
      supplier_name: parsedData.supplier_name || prev.supplier_name,
      recommended_roast_levels: parsedData.recommended_roast_levels || prev.recommended_roast_levels
    }));
    
    // Notify parent component about the parsed data
    if (onDataUpdate) {
      onDataUpdate(parsedData);
    }
    
  };

  const handleURLSubmit = (url) => {
    if (url && url.includes('sweetmarias.com')) {
      // Process the URL manually
      processSupplierURL(url);
    } else if (url) {
      alert('Please enter a valid coffee supplier URL');
    }
  };

  const processSupplierURL = async (url) => {
    try {
      console.log('Processing URL:', url);
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/bean-profiles/parse-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url })
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        const beanData = result.bean_data;
        console.log('Parsed bean data:', beanData);
        
        // Check if we got basic data due to website blocking
        const isBasicData = beanData.raw_data?.error === 'Website blocked request, using URL-based extraction';
        
        setFormData(prev => ({
          ...prev,
          supplier_url: beanData.supplier_url || '',
          supplier_name: beanData.supplier_name || 'Sweet Maria\'s',
          name: beanData.name || prev.name,
          origin: beanData.origin || prev.origin,
          variety: beanData.variety || prev.variety,
          process_method: beanData.process_method || prev.process_method
        }));
        
        if (isBasicData) {
          alert('Note: Website blocked automated parsing. Basic information extracted from URL. You may need to fill in additional details manually.');
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Backend error:', errorData);
        alert(`Failed to parse URL data: ${errorData.detail || 'Server error'}`);
      }
    } catch (error) {
      console.error('Error processing URL:', error);
      alert(`Error processing URL: ${error.message}`);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Bean name is required');
      return;
    }

    setLoading(true);
    try {
      // Convert form data to proper types for backend
      const processedData = {
        ...formData,
        // Convert string numbers to actual numbers
        moisture_content_pct: formData.moisture_content_pct ? parseFloat(formData.moisture_content_pct) : null,
        density_g_ml: formData.density_g_ml ? parseFloat(formData.density_g_ml) : null,
        altitude_m: formData.altitude_m && formData.altitude_m !== '' ? parseInt(formData.altitude_m) : null,
        cupping_score: formData.cupping_score ? parseFloat(formData.cupping_score) : null,
        fragrance_score: formData.fragrance_score ? parseFloat(formData.fragrance_score) : null,
        // Convert empty strings to null for optional fields
        origin: formData.origin || null,
        variety: formData.variety || null,
        process_method: formData.process_method || null,
        screen_size: formData.screen_size || null,
        notes: formData.notes || null,
        supplier_url: formData.supplier_url || null,
        supplier_name: formData.supplier_name || null,
        roasting_notes: formData.roasting_notes || null,
        qr_code_url: formData.qr_code_url || null
      };

      const token = await getAuthToken();
      
      console.log('DEBUG: Saving bean profile');
      console.log('DEBUG: beanProfileId:', beanProfileId);
      console.log('DEBUG: processedData:', processedData);
      
      let response;
      if (beanProfileId) {
        // Enhance existing profile (PATCH)
        console.log('DEBUG: Using PATCH to enhance existing profile');
        response = await fetch(`${API_BASE}/bean-profiles/${beanProfileId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(processedData)
        });
      } else {
        // Create new profile (POST)
        response = await fetch(`${API_BASE}/bean-profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(processedData)
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log('DEBUG: Save successful, result:', result);
        onSave(result);
        onClose();
      } else {
        const errorText = await response.text();
        console.error('DEBUG: Save failed, response:', response.status, errorText);
        throw new Error('Failed to save bean profile');
      }
    } catch (error) {
      console.error('Error saving bean profile:', error);
      alert('Failed to save bean profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const getCardIcon = (field) => {
    const icons = {
      origin: '🌍',
      variety: '☕',
      process_method: '🔄',
      altitude: '🏔️',
      moisture_content: '💧',
      density: '⚖️'
    };
    return icons[field] || '📝';
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-4 sm:items-center sm:p-4"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        overscrollBehavior: 'none',
        touchAction: 'none'
      }}
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-dark-card rounded-t-xl sm:rounded-xl shadow-2xl w-full h-[calc(100vh-1rem)] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col"
        style={{ overscrollBehavior: 'none', touchAction: 'pan-y' }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-8 h-1 bg-gray-800 dark:bg-gray-200 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-dark-card px-4 sm:px-6 py-3 sm:py-4 text-gray-900 dark:text-dark-text-primary flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold">
                {beanProfileId ? 'Edit Bean Profile' : 'Add Bean Profile'}
              </h2>
              <p className="opacity-90 text-sm sm:text-base">
                {beanProfileId ? 'Update detailed information about the green coffee' : 'Add detailed information about the green coffee'}
              </p>
            </div>
            {/* Desktop only close button */}
            <button
              onClick={handleClose}
              className="text-gray-900 dark:text-dark-text-primary hover:text-gray-600 dark:hover:text-gray-300 text-xl sm:text-2xl hidden sm:block"
            >
              ✕
            </button>
          </div>
        </div>

        <div 
          className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0"
          style={{ overscrollBehavior: 'none', touchAction: 'pan-y' }}
        >

          {/* Bean Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
              Bean Profile Name (Required)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
              placeholder="Enter bean name (e.g., Yemen Mokha Sanani)"
            />
          </div>


          {/* AI Bean Analysis Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤖</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">AI Bean Analysis</h3>
            </div>
            
            {/* Bean Description Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                Bean Description *
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Describe your coffee: origin, variety, process method, flavor notes, roast recommendations, etc. The more detail you provide, the better the AI analysis will be."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-dark-text-primary"
                rows={4}
              />
            </div>
            
            <div className="flex justify-center gap-4">
              {/* AI Analysis Button */}
              <button
                onClick={handleAIAnalysis}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                🧠 Analyze with LLM
              </button>
              
              {/* QR Code Scanner Button */}
              <button
                onClick={scanQRCode}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                📷 Scan QR Code
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-2 text-center">
              AI will extract characteristics like origin, variety, process method, and flavor profile from your description
            </p>
          </div>

          {/* Core Bean Characteristics */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">☕</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Core Bean Characteristics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
                    {/* Origin */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                            Origin (Country/Region) *
                        </label>
                        <CustomDropdown
                            options={[
                                { value: '', label: 'Select origin' },
                                { value: 'Ethiopia', label: 'Ethiopia' },
                                { value: 'Colombia', label: 'Colombia' },
                                { value: 'Guatemala', label: 'Guatemala' },
                                { value: 'Costa Rica', label: 'Costa Rica' },
                                { value: 'Kenya', label: 'Kenya' },
                                { value: 'Brazil', label: 'Brazil' },
                                { value: 'Peru', label: 'Peru' },
                                { value: 'Honduras', label: 'Honduras' },
                                { value: 'Nicaragua', label: 'Nicaragua' },
                                { value: 'El Salvador', label: 'El Salvador' },
                                { value: 'Panama', label: 'Panama' },
                                { value: 'Mexico', label: 'Mexico' },
                                { value: 'Rwanda', label: 'Rwanda' },
                                { value: 'Burundi', label: 'Burundi' },
                                { value: 'Tanzania', label: 'Tanzania' },
                                { value: 'Uganda', label: 'Uganda' },
                                { value: 'Yemen', label: 'Yemen' },
                                { value: 'Indonesia', label: 'Indonesia' },
                                { value: 'Papua New Guinea', label: 'Papua New Guinea' },
                                { value: 'Other', label: 'Other' }
                            ]}
                            value={formData.origin}
                            onChange={(value) => handleInputChange('origin', value)}
                            placeholder="Select origin..."
                            className="w-full"
                        />
                    </div>

              {/* Variety */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                  Variety/Cultivar *
                </label>
                <input
                  type="text"
                  value={formData.variety}
                  onChange={(e) => handleInputChange('variety', e.target.value)}
                  placeholder="e.g., Ateng, Jember, Tim Tim, Typica, Bourbon"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-dark-text-primary"
                />
              </div>

              {/* Process Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                  Process Method *
                </label>
                <input
                  type="text"
                  value={formData.process_method}
                  onChange={(e) => handleInputChange('process_method', e.target.value)}
                  placeholder="e.g., Wet Process, Natural, Washed, Honey"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-dark-text-primary"
                />
              </div>

              {/* Bean Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                  Bean Type
                </label>
                <CustomDropdown
                  options={[
                    { value: '', label: 'Select bean type' },
                    { value: 'Regular', label: 'Regular' },
                    { value: 'Peaberry', label: 'Peaberry' },
                    { value: 'Maragogype', label: 'Maragogype (Large)' },
                    { value: 'Mixed', label: 'Mixed' }
                  ]}
                  value={formData.bean_type || ''}
                  onChange={(value) => handleInputChange('bean_type', value)}
                  placeholder="Select bean type..."
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Recommended Roast Levels */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
              Recommended Roast Levels
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['City', 'City+', 'Full City', 'Full City+'].map(level => (
                <label key={level} className="flex items-center space-x-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.recommended_roast_levels?.includes(level) || false}
                    onChange={(e) => {
                      const currentLevels = formData.recommended_roast_levels || [];
                      if (e.target.checked) {
                        handleInputChange('recommended_roast_levels', [...currentLevels, level]);
                      } else {
                        handleInputChange('recommended_roast_levels', currentLevels.filter(l => l !== level));
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-dark-text-primary">{level}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">Select the roast levels recommended for this bean</p>
          </div>

          {/* Good for Espresso */}
          <div className="mb-6">
            <label className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.espresso_suitable || false}
                onChange={(e) => handleInputChange('espresso_suitable', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-dark-text-primary">Good for Espresso</span>
                <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">Check if this bean is suitable for espresso brewing</p>
              </div>
            </label>
          </div>


          {/* Tier 1: Must Have - Critical for AI Coaching */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎯</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Tier 1: Critical for AI Coaching</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Moisture Content */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💧</span>
                  <span className="font-medium text-gray-800 dark:text-dark-text-primary">Moisture Content (%)</span>
                </div>
                <input
                  type="number"
                  value={formData.moisture_content_pct || ''}
                  onChange={(e) => handleInputChange('moisture_content_pct', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
                  placeholder="Moisture %"
                  min="8"
                  max="15"
                  step="0.1"
                />
                <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">Determines drying phase timing</p>
              </div>

              {/* Density */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚖️</span>
                  <span className="font-medium text-gray-800 dark:text-dark-text-primary">Density (g/ml)</span>
                </div>
                <input
                  type="number"
                  value={formData.density_g_ml || ''}
                  onChange={(e) => handleInputChange('density_g_ml', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
                  placeholder="0.72"
                  min="0.60"
                  max="0.85"
                  step="0.01"
                />
                <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">Affects heat transfer rate</p>
              </div>

            </div>
          </div>

          {/* Tier 2: Very Important */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⭐</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Tier 2: Very Important</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Screen Size */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📏</span>
                  <span className="font-medium text-gray-800 dark:text-dark-text-primary">Screen Size</span>
                </div>
                <CustomDropdown
                  options={[
                    { value: '', label: 'Select size' },
                    { value: '14-15', label: '14-15 (Small)' },
                    { value: '15-16', label: '15-16 (Medium)' },
                    { value: '16-17', label: '16-17 (Large)' },
                    { value: '17-18', label: '17-18 (Very Large)' }
                  ]}
                  value={formData.screen_size}
                  onChange={(value) => handleInputChange('screen_size', value)}
                  placeholder="Select size..."
                  className="w-full"
                />
                <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">
                  {formData.screen_size === '14-15' && 'Small beans: Lower heat to avoid scorching'}
                  {formData.screen_size === '15-16' && 'Medium beans: Standard heat settings work well'}
                  {formData.screen_size === '16-17' && 'Large beans: Higher heat for even roasting'}
                  {formData.screen_size === '17-18' && 'Very large beans: High heat and longer roast time'}
                  {!formData.screen_size && 'Bean size affects heat transfer and roast timing'}
                </p>
              </div>


              {/* Altitude */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏔️</span>
                  <span className="font-medium text-gray-800 dark:text-dark-text-primary">Altitude (meters)</span>
                </div>
                <input
                  type="number"
                  value={formData.altitude_m || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('altitude_m', value === '' ? '' : parseInt(value));
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
                  placeholder="1400"
                  min="0"
                  max="3000"
                  step="50"
                />
                <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">Higher altitude = denser beans</p>
              </div>

            </div>
          </div>

          {/* Tier 3: Helpful */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💡</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Tier 3: Helpful</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Body Intensity */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💪</span>
                  <span className="font-medium text-gray-800 dark:text-dark-text-primary">Body Intensity (0-5)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={formData.body_intensity || 0}
                  onChange={(e) => handleInputChange('body_intensity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Light</span>
                  <span className="font-medium">{formData.body_intensity || 0}</span>
                  <span>Full</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">High body needs longer development</p>
              </div>

              {/* Acidity Intensity */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🍋</span>
                  <span className="font-medium text-gray-800 dark:text-dark-text-primary">Acidity Intensity (0-5)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={formData.acidity_intensity || 0}
                  onChange={(e) => handleInputChange('acidity_intensity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low</span>
                  <span className="font-medium">{formData.acidity_intensity || 0}</span>
                  <span>High</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">High acidity needs careful heat management</p>
              </div>
            </div>
          </div>



        </div>

        {/* Save Button */}
        <div className="bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 pb-20 sm:pb-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={loading || !formData.name.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              beanProfileId ? 'Update Bean Profile' : 'Save Bean Profile'
            )}
          </button>
        </div>
      </div>

      {/* URL Input Modal */}
      <URLInputModal
        isOpen={showURLModal}
        onClose={() => setShowURLModal(false)}
        onSubmit={handleURLSubmit}
      />

      <LLMAnalysisModal
        isOpen={showLLMModal}
        onClose={() => setShowLLMModal(false)}
        analysisResult={llmAnalysisResult}
      />

      {/* Confirmation Modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
              Discard Changes?
            </h3>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
              You have unsaved changes. Are you sure you want to close without saving?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmClose(false);
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BeanProfileForm;
