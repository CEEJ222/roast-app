import React, { useState, useEffect } from 'react';
import BeanProfileForm from '../bean_profile/BeanProfileForm';
import StandardTable from '../shared/StandardTable';
import FloatingActionButton from '../shared/FloatingActionButton';
import BottomSheetModal from '../shared/BottomSheetModal';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app';

const BeanProfiles = ({ getAuthToken, onDataChange = null, triggerCreateModal = false, onTriggerReset = null }) => {
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
      setIsMobile(window.innerWidth < 768);
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
        <div className={isMobile ? "p-4" : "p-4 sm:p-6"}>
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
            <div className="space-y-3">
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
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors border dark:border-dark-border-primary cursor-pointer"
                  >
                    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center border dark:border-dark-border-primary flex-shrink-0">
                        <span className="text-indigo-600 dark:text-dark-accent-primary font-bold">
                          {getProfileIcon()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-dark-text-primary text-sm sm:text-base break-words">
                          {profile.name}
                        </p>
                        <div className="flex flex-row items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-dark-text-tertiary mt-1">
                          {profile.origin && (
                            <span className="truncate">{profile.origin}</span>
                          )}
                          {profile.variety && (
                            <span>• {profile.variety}</span>
                          )}
                          {profile.process_method && (
                            <span>• {profile.process_method}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-3 sm:space-x-4 text-sm mt-2 sm:mt-0">
                      {isGoodForEspresso && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium border dark:border-dark-border-primary bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 flex-shrink-0">
                          Good for Espresso
                        </span>
                      )}
                      <div className="text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                        👁️
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 px-4 sm:px-6 py-3 sm:py-4 text-white flex-shrink-0">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="text-lg sm:text-2xl font-bold break-words">{selectedProfile.name}</h2>
                  <p className="opacity-90 text-sm sm:text-base">Bean Profile Details</p>
                </div>
                <button
                  onClick={handleCloseProfile}
                  className="text-white hover:text-gray-200 text-xl sm:text-2xl flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
              {/* Basic Info */}
              <div className="mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-dark-text-primary">Origin:</span>
                    <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{selectedProfile.origin || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-dark-text-primary">Variety:</span>
                    <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{selectedProfile.variety || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-dark-text-primary">Process:</span>
                    <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{selectedProfile.process_method || 'Not specified'}</span>
                  </div>
                  {(selectedProfile.espresso_suitable || 
                    selectedProfile.notes?.toLowerCase().includes('espresso') ||
                    selectedProfile.roasting_notes?.toLowerCase().includes('espresso')) && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-dark-text-primary">Espresso:</span>
                      <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                        Good for Espresso
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Data */}
              {(selectedProfile.moisture_content_pct || selectedProfile.density_g_ml || selectedProfile.altitude_m || selectedProfile.screen_size) && (
                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Enhanced Data</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {selectedProfile.moisture_content_pct && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-dark-text-primary">Moisture Content:</span>
                        <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{selectedProfile.moisture_content_pct}%</span>
                      </div>
                    )}
                    {selectedProfile.density_g_ml && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-dark-text-primary">Density:</span>
                        <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{selectedProfile.density_g_ml} g/ml</span>
                      </div>
                    )}
                    {selectedProfile.altitude_m && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-dark-text-primary">Altitude:</span>
                        <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{selectedProfile.altitude_m}m</span>
                      </div>
                    )}
                    {selectedProfile.screen_size && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-dark-text-primary">Screen Size:</span>
                        <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{selectedProfile.screen_size}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Flavor Profile */}
              {(selectedProfile.cupping_score || selectedProfile.fragrance_score || selectedProfile.flavor_notes?.length > 0) && (
                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Flavor Profile</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {selectedProfile.cupping_score && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-dark-text-primary">Cupping Score:</span>
                        <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{selectedProfile.cupping_score}/100</span>
                      </div>
                    )}
                    {selectedProfile.fragrance_score && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-dark-text-primary">Fragrance Score:</span>
                        <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{selectedProfile.fragrance_score}/10</span>
                      </div>
                    )}
                    {selectedProfile.flavor_notes?.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700 dark:text-dark-text-primary">Flavor Notes:</span>
                        <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">{selectedProfile.flavor_notes.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedProfile.notes && (
                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Notes</h3>
                  <p className="text-gray-600 dark:text-dark-text-secondary break-words">{selectedProfile.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleCloseProfile}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium order-2 sm:order-1"
                >
                  Close
                </button>
                <button
                  onClick={handleEditProfile}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium order-1 sm:order-2"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
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
            console.log('FAB clicked, setting showFABMenu to true');
            setShowFABMenu(true);
          }}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
          label="Quick Actions"
          position="bottom-right"
          className="mb-20 mr-4"
        />
      )}

      {/* Mobile FAB Menu */}
      <BottomSheetModal
        isOpen={showFABMenu}
        onClose={() => {
          console.log('BottomSheetModal onClose called');
          setShowFABMenu(false);
        }}
        title="Quick Actions"
      >
        <div className="space-y-4">
          <button
            onClick={() => {
              handleCreateProfile();
              setShowFABMenu(false);
            }}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center gap-3 text-left"
          >
            <span className="text-2xl">📝</span>
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
        </div>
      </BottomSheetModal>
    </div>
  );
};

export default BeanProfiles;
