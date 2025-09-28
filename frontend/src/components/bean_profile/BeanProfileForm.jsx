import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CustomDropdown from '../ux_ui/CustomDropdown';
import URLInputModal from '../modals/URLInputModal';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app';

const BeanProfileForm = ({ isOpen, onClose, onSave, initialData = null, getAuthToken, beanProfileId = null }) => {
  const [formData, setFormData] = useState({
    // Basic Info (from roast form)
    name: '',
    origin: '', // This will be pre-populated from roast form
    variety: '', // This will be pre-populated from roast form  
    process_method: '', // This will be pre-populated from roast form
    recommended_roast_levels: [], // This will be pre-populated from roast form
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
    harvest_year: '',
    acidity_intensity: 0,
    
    // Flavor Profile (Additional)
    flavor_notes: [],
    cupping_score: '',
    fragrance_score: '',
    floral_intensity: 0,
    honey_intensity: 0,
    sugars_intensity: 0,
    caramel_intensity: 0,
    fruits_intensity: 0,
    citrus_intensity: 0,
    berry_intensity: 0,
    cocoa_intensity: 0,
    nuts_intensity: 0,
    rustic_intensity: 0,
    spice_intensity: 0,
    
    // Additional fields expected by backend
    roasting_notes: '',
    qr_code_url: ''
  });

  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showURLModal, setShowURLModal] = useState(false);

  // Reset dataLoaded when beanProfileId or initialData changes
  useEffect(() => {
    setDataLoaded(false);
  }, [beanProfileId, initialData]);

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

  const handleManualURLInput = () => {
    setShowURLModal(true);
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
        altitude_m: formData.altitude_m ? parseInt(formData.altitude_m) : null,
        harvest_year: formData.harvest_year ? parseInt(formData.harvest_year) : null,
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
      harvest_year: '📅',
      altitude: '🏔️',
      moisture_content: '💧',
      density: '⚖️'
    };
    return icons[field] || '📝';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 px-6 py-4 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Enhance Bean Profile</h2>
              <p className="opacity-90">Add detailed AI-optimized data for better roast coaching</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Basic Info from Roast Form */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📋</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Basic Info (from Roast Form)</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-dark-text-primary">Origin:</span>
                <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{formData.origin || 'Not specified'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-dark-text-primary">Variety:</span>
                <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{formData.variety || 'Not specified'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-dark-text-primary">Process:</span>
                <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{formData.process_method || 'Not specified'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-dark-text-primary">Roast Level:</span>
                <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{formData.recommended_roast_levels[0] || 'Not specified'}</span>
              </div>
            </div>
          </div>

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

          {/* Manual URL Input Button */}
          <div className="mb-6">
            <button
              onClick={handleManualURLInput}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              🔗 Enter Supplier URL
            </button>
            {formData.supplier_url && (
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-2">
                Supplier URL: {formData.supplier_url}
              </p>
            )}
          </div>

          {/* Tier 1: Must Have - Critical for AI Coaching */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎯</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Tier 1: Critical for AI Coaching</h3>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Must Have</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Moisture Content */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💧</span>
                  <span className="font-medium text-gray-800 dark:text-dark-text-primary">Moisture Content (%)</span>
                </div>
                <input
                  type="number"
                  value={formData.moisture_content_pct || ''}
                  onChange={(e) => handleInputChange('moisture_content_pct', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
                  placeholder="11.2"
                  min="8"
                  max="15"
                  step="0.1"
                />
                <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">Determines drying phase timing</p>
              </div>

              {/* Density */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
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
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">High Impact</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Screen Size */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📏</span>
                  <span className="font-medium text-gray-800 dark:text-dark-text-primary">Screen Size</span>
                </div>
                <CustomDropdown
                  options={[
                    { value: '', label: 'Select screen size' },
                    { value: '14-15', label: '14-15 (Small)' },
                    { value: '15-16', label: '15-16 (Medium)' },
                    { value: '16-17', label: '16-17 (Large)' },
                    { value: '17-18', label: '17-18 (Very Large)' }
                  ]}
                  value={formData.screen_size}
                  onChange={(value) => handleInputChange('screen_size', value)}
                  placeholder="Select screen size..."
                  className="w-full"
                />
                <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">Bean size affects heat transfer</p>
              </div>


              {/* Altitude */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏔️</span>
                  <span className="font-medium text-gray-800 dark:text-dark-text-primary">Altitude (meters)</span>
                </div>
                <input
                  type="number"
                  value={formData.altitude_m || ''}
                  onChange={(e) => handleInputChange('altitude_m', parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
                  placeholder="1400"
                  min="0"
                  max="3000"
                  step="50"
                />
                <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">Higher altitude = denser beans</p>
              </div>

              {/* Body Intensity */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
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
            </div>
          </div>

          {/* Tier 3: Helpful */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💡</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Tier 3: Helpful</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Additional</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Harvest Year */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📅</span>
                  <span className="font-medium text-gray-800 dark:text-dark-text-primary">Harvest Year</span>
                </div>
                <input
                  type="number"
                  value={formData.harvest_year || ''}
                  onChange={(e) => handleInputChange('harvest_year', parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
                  placeholder="2024"
                  min="2020"
                  max="2025"
                />
                <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">Freshness impacts moisture</p>
              </div>

              {/* Acidity Intensity */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
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


          {/* Flavor Profile Section */}
          <div className="mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">👃</span>
                <span className="font-medium text-gray-800 dark:text-dark-text-primary">Flavor Profile</span>
              </div>
              
              {/* Cupping Scores */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                    Overall Score (0-100)
                  </label>
                  <input
                    type="number"
                    value={formData.cupping_score || ''}
                    onChange={(e) => handleInputChange('cupping_score', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
                    placeholder="88.5"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                    Fragrance (0-10)
                  </label>
                  <input
                    type="number"
                    value={formData.fragrance_score || ''}
                    onChange={(e) => handleInputChange('fragrance_score', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
                    placeholder="8.4"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Flavor Categories */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-3">
                    Flavor Categories (Rate 0-5)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'body', label: 'Body', color: 'bg-green-500' },
                      { key: 'floral', label: 'Floral', color: 'bg-pink-300' },
                      { key: 'honey', label: 'Honey', color: 'bg-yellow-400' },
                      { key: 'sugars', label: 'Sugars', color: 'bg-orange-200' },
                      { key: 'caramel', label: 'Caramel', color: 'bg-amber-300' },
                      { key: 'fruits', label: 'Fruits', color: 'bg-red-400' },
                      { key: 'citrus', label: 'Citrus', color: 'bg-orange-300' },
                      { key: 'berry', label: 'Berry', color: 'bg-purple-400' },
                      { key: 'cocoa', label: 'Cocoa', color: 'bg-red-800' },
                      { key: 'nuts', label: 'Nuts', color: 'bg-amber-800' },
                      { key: 'rustic', label: 'Rustic', color: 'bg-yellow-700' },
                      { key: 'spice', label: 'Spice', color: 'bg-green-300' }
                    ].map(category => (
                      <div key={category.key} className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                        <span className="text-sm text-gray-700 dark:text-dark-text-primary w-16">{category.label}</span>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.5"
                          value={formData[`${category.key}_intensity`] || 0}
                          onChange={(e) => handleInputChange(`${category.key}_intensity`, parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                        <span className="text-xs text-gray-500 w-8">{formData[`${category.key}_intensity`] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Traditional Flavor Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                    Additional Flavor Notes
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      'Wine', 'Tobacco', 'Vanilla', 'Malt', 'Herbal', 'Bright',
                      'Earthy', 'Clean', 'Complex', 'Uniform', 'Sweet', 'Balanced'
                    ].map(flavor => (
                      <label key={flavor} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.flavor_notes?.includes(flavor) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange('flavor_notes', [...(formData.flavor_notes || []), flavor]);
                            } else {
                              handleInputChange('flavor_notes', (formData.flavor_notes || []).filter(f => f !== flavor));
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-700 dark:text-dark-text-primary">{flavor}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Save Button */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
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
              'Save Bean Profile'
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
    </div>
  );
};

export default BeanProfileForm;
