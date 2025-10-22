import React, { useState, useEffect } from 'react';
import BeanProfileForm from '../bean_profile/BeanProfileForm';
import StandardTable from '../shared/StandardTable';
import FloatingActionButton from '../shared/FloatingActionButton';
import BottomSheetModal from '../shared/BottomSheetModal';
import MobileModal from '../shared/MobileModal';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app';

const BeanProfiles = ({ getAuthToken, onDataChange = null, triggerCreateModal = false, onTriggerReset = null, onProfileStateChange = null }) => {
  const [beanProfiles, setBeanProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [selectedProfiles, setSelectedProfiles] = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showFABMenu, setShowFABMenu] = useState(false);

  const loadBeanProfiles = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/bean-profiles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBeanProfiles(data);
      } else {
        console.error('Failed to load bean profiles');
      }
    } catch (error) {
      console.error('Error loading bean profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeanProfiles();
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      console.log('BeanProfiles mobile detection:', { width: window.innerWidth, isMobile: isMobileWidth });
      setIsMobile(isMobileWidth);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle external trigger to open create modal
  useEffect(() => {
    if (triggerCreateModal) {
      setShowCreateForm(true);
      // Reset the trigger after using it
      if (onTriggerReset) {
        onTriggerReset();
      }
    }
  }, [triggerCreateModal, onTriggerReset]);

  // Notify parent of profile state changes
  useEffect(() => {
    if (onProfileStateChange) {
      onProfileStateChange({
        selectedProfile,
        showProfileModal,
        showEditForm,
        showCreateForm,
        handleEditProfile,
        handleCreateProfile
      });
    }
  }, [selectedProfile, showProfileModal, showEditForm, showCreateForm]);

  const handleViewProfile = (profile) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  const handleCloseProfile = () => {
    setSelectedProfile(null);
    setShowProfileModal(false);
  };

  const handleEditProfile = () => {
    setShowProfileModal(false);
    setShowEditForm(true);
  };

  const handleEditSave = (updatedProfile) => {
    // Update the profile in the list
    setBeanProfiles(prev => prev.map(p => 
      p.id === updatedProfile.id ? updatedProfile : p
    ));
    setShowEditForm(false);
    setSelectedProfile(null);
  };

  const handleEditClose = () => {
    setShowEditForm(false);
    setSelectedProfile(null);
  };

  const handleDeleteClick = (profile, e) => {
    e.stopPropagation();
    setProfileToDelete(profile);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return;

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/bean-profiles/${profileToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setBeanProfiles(prev => prev.filter(profile => profile.id !== profileToDelete.id));
        setShowDeleteConfirm(false);
        setProfileToDelete(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || 'Failed to delete bean profile';
        
        if (response.status === 409) {
          showError(`${errorMessage}\n\nThis usually happens when the bean profile is being used by existing roast records. Please delete the associated roast entries first.`);
        } else {
          showError(`Failed to delete bean profile: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error deleting bean profile:', error);
      showError('An unexpected error occurred while deleting the bean profile. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setProfileToDelete(null);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProfiles(new Set(beanProfiles.map(profile => profile.id)));
    } else {
      setSelectedProfiles(new Set());
    }
  };

  const handleProfileCheckbox = (profileId, checked) => {
    const newSelected = new Set(selectedProfiles);
    if (checked) {
      newSelected.add(profileId);
    } else {
      newSelected.delete(profileId);
    }
    setSelectedProfiles(newSelected);
  };

  const handleBulkDeleteClick = () => {
    if (selectedProfiles.size > 0) {
      setShowBulkDeleteConfirm(true);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      const token = await getAuthToken();
      const deletePromises = Array.from(selectedProfiles).map(async (profileId) => {
        const response = await fetch(`${API_BASE}/bean-profiles/${profileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return {
            profileId,
            success: false,
            error: errorData.detail || `HTTP ${response.status}`,
            status: response.status
          };
        }
        
        return {
          profileId,
          success: true
        };
      });

      const results = await Promise.all(deletePromises);
      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);
      
      if (successful.length === selectedProfiles.size) {
        // All deletions successful
        setBeanProfiles(prev => prev.filter(profile => !selectedProfiles.has(profile.id)));
        setSelectedProfiles(new Set());
        setShowBulkDeleteConfirm(false);
      } else if (successful.length > 0) {
        // Some deletions successful, some failed
        setBeanProfiles(prev => prev.filter(profile => 
          !selectedProfiles.has(profile.id) || 
          failed.some(f => f.profileId === profile.id)
        ));
        
        const failedProfiles = failed.map(f => {
          const profile = beanProfiles.find(p => p.id === f.profileId);
          return profile ? profile.name : f.profileId;
        }).join(', ');
        
        showError(`Some deletions failed: ${failedProfiles}\n\nThis usually happens when the bean profile is being used by existing roast records. Please delete the associated roast entries first.`);
        
        setSelectedProfiles(new Set());
        setShowBulkDeleteConfirm(false);
      } else {
        // All deletions failed
        const errorMessages = failed.map(f => f.error).join('; ');
        showError(`Failed to delete bean profiles: ${errorMessages}\n\nThis usually happens when the bean profiles are being used by existing roast records. Please delete the associated roast entries first.`);
      }
    } catch (error) {
      console.error('Error deleting bean profiles:', error);
      showError('An unexpected error occurred while deleting bean profiles. Please try again.');
    }
  };

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteConfirm(false);
  };

  const handleCreateProfile = () => {
    setShowCreateForm(true);
  };

  const handleCreateSave = (newProfile) => {
    // Add the new profile to the list
    setBeanProfiles(prev => [newProfile, ...prev]);
    setShowCreateForm(false);
    
    // Notify parent to refresh data if needed
    if (onDataChange) {
      onDataChange();
    }
  };

  const handleCreateClose = () => {
    setShowCreateForm(false);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  const getProfileIcon = () => {
    return '☕';
  };

  const processMethodMappings = {
    'Dry Process (Natural)': 'Natural',
    'Wet Process (Washed)': 'Washed',
    'Wet Process': 'Washed', // Handle cases where it's just "Wet Process"
    'Honey Process': 'Honey',
    'Semi-Washed': 'Semi-Washed',
    'Anaerobic': 'Anaerobic',
    'Carbonic Maceration': 'Carbonic',
    'Pulp Natural': 'Pulp Natural',
    'Yellow Honey': 'Yellow Honey',
    'Red Honey': 'Red Honey',
    'Black Honey': 'Black Honey',
    'White Honey': 'White Honey',
    'Monsooned': 'Monsooned',
    'Giling Basah': 'Giling Basah',
    'Wet Hulled': 'Wet Hulled'
  };

  const getProcessMethodChip = (processMethod) => {
    if (!processMethod) return null;
    
    const chipName = processMethodMappings[processMethod] || processMethod;
    
    // Determine chip color based on process type
    let chipColor = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    
    if (chipName.toLowerCase().includes('natural')) {
      chipColor = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    } else if (chipName.toLowerCase().includes('washed')) {
      chipColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    } else if (chipName.toLowerCase().includes('honey')) {
      chipColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    } else if (chipName.toLowerCase().includes('anaerobic') || chipName.toLowerCase().includes('carbonic')) {
      chipColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border dark:border-dark-border-primary ${chipColor} flex-shrink-0`}>
        {chipName}
      </span>
    );
  };

  const columns = [
    {
      header: 'Profile',
      key: 'profile',
      render: (profile) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center border dark:border-dark-border-primary">
            <span className="text-indigo-600 dark:text-dark-accent-primary font-bold">
              {getProfileIcon()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-dark-text-primary">
              {profile.name}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-dark-text-tertiary">
              {profile.origin && <span>{profile.origin}</span>}
              {profile.variety && <span>• {profile.variety}</span>}
              {profile.process_method && <span>• {profile.process_method}</span>}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Espresso',
      key: 'espresso',
      render: (profile) => {
        const isGoodForEspresso = profile.espresso_suitable === true || 
                                  profile.notes?.toLowerCase().includes('espresso') ||
                                  profile.roasting_notes?.toLowerCase().includes('espresso');
        return isGoodForEspresso ? (
          <span className="px-2 py-1 rounded-full text-xs font-medium border dark:border-dark-border-primary bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            Good for Espresso
          </span>
        ) : null;
      }
    }
  ];

  if (loading) {
    return (
      <div className="bg-transparent">
        <div className="px-4 sm:px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">Bean Profiles</h3>
        </div>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-dark-accent-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-text-secondary">Loading bean profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      {/* Header - only show on desktop */}
      {!isMobile && (
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">Bean Profiles</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button
                onClick={handleCreateProfile}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-dark-accent-primary dark:to-dark-accent-secondary text-white px-3 sm:px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-dark-accent-primary dark:hover:to-dark-accent-tertiary font-medium shadow-lg dark:shadow-vibrant-glow transform transition hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                📝 Create New
              </button>
              {beanProfiles.length > 0 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm sm:text-base whitespace-nowrap"
                >
                  {showAll ? 'Show Recent Only →' : 'View All Profiles →'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showAll ? (
        // Full table view with selection and delete functionality
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary ml-4">Delete Bean Profiles</h3>
            <button
              onClick={() => setShowAll(false)}
              className="mr-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
          <StandardTable
          data={beanProfiles}
          columns={columns}
          onDelete={(profile) => handleDeleteClick(profile, { stopPropagation: () => {} })}
          onBulkDelete={(profileIds) => {
            setSelectedProfiles(new Set(profileIds));
            setShowBulkDeleteConfirm(true);
          }}
          selectedItems={selectedProfiles}
          onSelectionChange={(newSelection) => setSelectedProfiles(newSelection)}
          onSelectAll={(allIds) => setSelectedProfiles(new Set(allIds))}
          showSelection={true}
          showBulkDelete={true}
          loading={loading}
          emptyMessage="No Bean Profiles Yet. Create your first bean profile to track detailed coffee information for better AI coaching!"
          className=""
          onView={(profile) => handleViewProfile(profile)}
          showHeader={true}
          hideActionButtons={isMobile}
        />
        </div>
      ) : (
        // Dashboard card view
        <div className={isMobile ? "p-4 pb-24" : "p-4 sm:p-6"}>
          {beanProfiles.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-dark-text-tertiary px-4">
              <div className="text-4xl sm:text-6xl mb-4">☕</div>
              <p className="text-base sm:text-lg font-semibold mb-2 dark:text-dark-text-primary">No Bean Profiles Yet</p>
              <p className="text-xs sm:text-sm mb-6 dark:text-dark-text-secondary max-w-sm mx-auto">
                Create your first bean profile to track detailed coffee information for better AI coaching!
              </p>
              <button
                onClick={handleCreateProfile}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-dark-accent-primary dark:to-dark-accent-secondary text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-dark-accent-primary dark:hover:to-dark-accent-tertiary font-bold shadow-lg dark:shadow-vibrant-glow transform transition hover:scale-105 text-sm sm:text-base"
              >
                📝 Create Bean Profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {beanProfiles.map((profile) => {
                // Check if profile is good for espresso (check both database field and notes for backwards compatibility)
                const isGoodForEspresso = profile.espresso_suitable === true || 
                                          profile.notes?.toLowerCase().includes('espresso') ||
                                          profile.notes?.toLowerCase().includes('good for espresso') ||
                                          profile.roasting_notes?.toLowerCase().includes('espresso');
                
                return (
                  <div 
                    key={profile.id}
                    onClick={() => handleViewProfile(profile)}
                    className="flex flex-col p-4 sm:p-4 bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors border dark:border-dark-border-primary cursor-pointer"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center border dark:border-dark-border-primary flex-shrink-0">
                        <span className="text-indigo-600 dark:text-dark-accent-primary font-bold">
                          {getProfileIcon()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-dark-text-primary text-sm sm:text-base break-words">
                          {profile.name}
                        </p>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-dark-text-tertiary mt-1">
                          {profile.origin && (
                            <div className="break-words flex items-center">
                              <svg className="w-3 h-3 text-red-500 dark:text-red-400 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <span>{profile.origin}</span>
                            </div>
                          )}
                          {profile.variety && (
                            <div className="break-words mt-1 flex items-center">
                              <span className="text-green-500 dark:text-green-400 mr-1">🌱</span>
                              <span>{profile.variety}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 items-center text-sm mt-3">
                          {getProcessMethodChip(profile.process_method)}
                          {isGoodForEspresso && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium border dark:border-dark-border-primary bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 flex-shrink-0">
                              Good for Espresso
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Profile Details Modal */}
      {showProfileModal && selectedProfile && (
        <MobileModal
          isOpen={showProfileModal}
          onClose={handleCloseProfile}
          title={selectedProfile.name}
          subtitle="Bean Profile Details"
          headerClassName="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 text-white"
        >
              {/* Basic Info */}
              <div className="mb-8">
                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border-primary p-6 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide mb-1">Origin</span>
                      <span className="text-gray-900 dark:text-dark-text-primary font-medium">{selectedProfile.origin || 'Not specified'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide mb-1">Variety</span>
                      <span className="text-gray-900 dark:text-dark-text-primary font-medium">{selectedProfile.variety || 'Not specified'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide mb-1">Process</span>
                      <span className="text-gray-900 dark:text-dark-text-primary font-medium">{selectedProfile.process_method || 'Not specified'}</span>
                    </div>
                    {(selectedProfile.espresso_suitable || 
                      selectedProfile.notes?.toLowerCase().includes('espresso') ||
                      selectedProfile.roasting_notes?.toLowerCase().includes('espresso')) && (
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide mb-1">Espresso</span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 w-fit">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Good for Espresso
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Data */}
              {(selectedProfile.moisture_content_pct || selectedProfile.density_g_ml || selectedProfile.altitude_m || selectedProfile.screen_size) && (
                <div className="mb-8">
                  <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border-primary p-6 shadow-sm">
                    <div className="flex items-center mb-6">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">Enhanced Data</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedProfile.moisture_content_pct && (
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide mb-1">Moisture Content</span>
                          <span className="text-gray-900 dark:text-dark-text-primary font-medium">{selectedProfile.moisture_content_pct}%</span>
                        </div>
                      )}
                      {selectedProfile.density_g_ml && (
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide mb-1">Density</span>
                          <span className="text-gray-900 dark:text-dark-text-primary font-medium">{selectedProfile.density_g_ml} g/ml</span>
                        </div>
                      )}
                      {selectedProfile.altitude_m && (
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide mb-1">Altitude</span>
                          <span className="text-gray-900 dark:text-dark-text-primary font-medium">{selectedProfile.altitude_m}m</span>
                        </div>
                      )}
                      {selectedProfile.screen_size && (
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide mb-1">Screen Size</span>
                          <span className="text-gray-900 dark:text-dark-text-primary font-medium">{selectedProfile.screen_size}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Flavor Profile */}
              {(selectedProfile.cupping_score || selectedProfile.fragrance_score || selectedProfile.flavor_notes?.length > 0) && (
                <div className="mb-8">
                  <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border-primary p-6 shadow-sm">
                    <div className="flex items-center mb-6">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">Flavor Profile</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedProfile.cupping_score && (
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide mb-1">Cupping Score</span>
                          <div className="flex items-center">
                            <span className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mr-2">{selectedProfile.cupping_score}</span>
                            <span className="text-sm text-gray-500 dark:text-dark-text-secondary">/100</span>
                          </div>
                        </div>
                      )}
                      {selectedProfile.fragrance_score && (
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide mb-1">Fragrance Score</span>
                          <div className="flex items-center">
                            <span className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mr-2">{selectedProfile.fragrance_score}</span>
                            <span className="text-sm text-gray-500 dark:text-dark-text-secondary">/10</span>
                          </div>
                        </div>
                      )}
                      {selectedProfile.flavor_notes?.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-sm font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide mb-2 block">Flavor Notes</span>
                          <div className="flex flex-wrap gap-2">
                            {selectedProfile.flavor_notes.map((note, index) => (
                              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                                {note}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedProfile.notes && (
                <div className="mb-8">
                  <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border-primary p-6 shadow-sm">
                    <div className="flex items-center mb-6">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">Notes</h3>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 dark:text-dark-text-secondary leading-relaxed break-words">{selectedProfile.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-8 pt-6 pb-20 sm:pb-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleCloseProfile}
                    className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
        </MobileModal>
      )}

      {/* Bean Profile Edit Form */}
      {showEditForm && selectedProfile && (
        <BeanProfileForm
          isOpen={showEditForm}
          onClose={handleEditClose}
          onSave={handleEditSave}
          getAuthToken={getAuthToken}
          beanProfileId={selectedProfile.id}
          initialData={selectedProfile}
        />
      )}

      {/* Bean Profile Create Form */}
      {showCreateForm && (
        <BeanProfileForm
          isOpen={showCreateForm}
          onClose={handleCreateClose}
          onSave={handleCreateSave}
          getAuthToken={getAuthToken}
          onDataUpdate={(updatedData) => {
            // Handle data updates if needed
            console.log('Bean profile data updated:', updatedData);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-2">
                Delete Bean Profile
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary mb-6 break-words">
                Are you sure you want to delete "{profileToDelete?.name}"? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary font-medium rounded-lg border border-gray-300 dark:border-dark-border-primary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-2">
                Delete Selected Bean Profiles
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary mb-6">
                Are you sure you want to delete {selectedProfiles.size} selected bean profile{selectedProfiles.size > 1 ? 's' : ''}? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleBulkDeleteCancel}
                  className="px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary font-medium rounded-lg border border-gray-300 dark:border-dark-border-primary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDeleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Delete {selectedProfiles.size} Profile{selectedProfiles.size > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-lg w-full p-4 sm:p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">
                Deletion Failed
              </h3>
              <div className="text-left">
                <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary whitespace-pre-line leading-relaxed break-words">
                  {errorMessage}
                </p>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleErrorModalClose}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button - only show on mobile */}
      {isMobile && (
        <FloatingActionButton
          onClick={() => {
            setShowFABMenu(true);
          }}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
          label="Bean Profile Actions"
          position="bottom-right"
          className="mb-24 mr-4"
        />
      )}

      {/* Mobile FAB Menu */}
      <BottomSheetModal
        isOpen={showFABMenu}
        onClose={() => {
          setShowFABMenu(false);
        }}
        title={selectedProfile ? "Bean Profile Actions" : "Quick Actions"}
      >
        <div className="space-y-4">
          {selectedProfile ? (
            // When viewing a bean profile, only show edit option
            <button
              onClick={() => {
                handleEditProfile();
                setShowFABMenu(false);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors flex items-center gap-3 text-left"
            >
              <span className="text-2xl">✏️</span>
              <div>
                <div className="font-semibold text-lg">Edit Bean Profile</div>
                <div className="text-sm opacity-90">Edit "{selectedProfile.name}"</div>
              </div>
            </button>
          ) : (
            // When not viewing a profile, show all options
            <>
              <button
                onClick={() => {
                  handleCreateProfile();
                  setShowFABMenu(false);
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center gap-3 text-left"
              >
                <span className="text-2xl">☕</span>
                <div>
                  <div className="font-semibold text-lg">Create Bean Profile</div>
                  <div className="text-sm opacity-90">Add a new coffee bean profile</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowAll(true);
                  setShowFABMenu(false);
                }}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-4 rounded-lg hover:from-red-700 hover:to-pink-700 transition-colors flex items-center gap-3 text-left"
              >
                <span className="text-2xl">🗑️</span>
                <div>
                  <div className="font-semibold text-lg">Delete Bean Profiles</div>
                  <div className="text-sm opacity-90">Manage and delete existing profiles</div>
                </div>
              </button>
            </>
          )}
        </div>
      </BottomSheetModal>
    </div>
  );
};

export default BeanProfiles;
