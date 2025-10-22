import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CustomDropdown from '../ux_ui/CustomDropdown';
import URLInputModal from '../modals/URLInputModal';
import LLMAnalysisModal from '../modals/LLMAnalysisModal';
import MobileModal from '../shared/MobileModal';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app';

const BeanProfileForm = ({ isOpen, onClose, onSave, initialData = null, getAuthToken, beanProfileId = null, onDataUpdate = null }) => {
  const [formData, setFormData] = useState({
    // ... all your existing form data
    name: '',
    origin: '',
    variety: '',
    process_method: '',
    bean_type: '',
    recommended_roast_levels: [],
    espresso_suitable: false,
    notes: '',
    supplier_url: '',
    supplier_name: '',
    moisture_content_pct: '',
    density_g_ml: '',
    screen_size: '',
    altitude_m: '',
    body_intensity: 0,
    acidity_intensity: 0,
    flavor_notes: [],
    cupping_score: '',
    roasting_notes: '',
    qr_code_url: ''
  });

  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showURLModal, setShowURLModal] = useState(false);
  const [showLLMModal, setShowLLMModal] = useState(false);
  const [llmAnalysisResult, setLlmAnalysisResult] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

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
    // Always show confirmation to be safe
    setShowCloseConfirm(true);
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  // ... all your existing handlers (handleInputChange, handleSave, etc.)

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Bean name is required');
      return;
    }

    setLoading(true);
    try {
      // ... your existing save logic
      const processedData = {
        ...formData,
        moisture_content_pct: formData.moisture_content_pct ? parseFloat(formData.moisture_content_pct) : null,
        density_g_ml: formData.density_g_ml ? parseFloat(formData.density_g_ml) : null,
        altitude_m: formData.altitude_m && formData.altitude_m !== '' ? parseInt(formData.altitude_m) : null,
        cupping_score: formData.cupping_score ? parseFloat(formData.cupping_score) : null,
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
      
      let response;
      if (beanProfileId) {
        response = await fetch(`${API_BASE}/bean-profiles/${beanProfileId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(processedData)
        });
      } else {
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
        onSave(result);
        onClose();
      } else {
        throw new Error('Failed to save bean profile');
      }
    } catch (error) {
      console.error('Error saving bean profile:', error);
      alert('Failed to save bean profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save button component
  const SaveButton = () => (
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
  );

  return (
    <>
      <MobileModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Add Bean Profile"
        subtitle="Add detailed information about the green coffee"
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={<SaveButton />}
      >
        {/* All your existing form content goes here */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Bean Profile Name (Required)
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
            placeholder="Enter bean name (e.g., Yemen Mokha Sanani)"
          />
        </div>

        {/* ... rest of your form fields */}
      </MobileModal>

      {/* Other modals */}
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

      {/* Close Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" style={{zIndex: 100}}>
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
              Cancel Bean Profile?
            </h3>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
              Are you sure you want to close without saving your bean profile?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Continue Editing
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cancel Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BeanProfileForm;
