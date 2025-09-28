import React, { useState, useEffect } from 'react';
import BeanProfileForm from '../bean_profile/BeanProfileForm';
import StandardTable from '../shared/StandardTable';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app';

const BeanProfiles = ({ getAuthToken }) => {
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
        throw new Error('Failed to delete bean profile');
      }
    } catch (error) {
      console.error('Error deleting bean profile:', error);
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
      const deletePromises = Array.from(selectedProfiles).map(profileId => 
        fetch(`${API_BASE}/bean-profiles/${profileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      const results = await Promise.all(deletePromises);
      const successful = results.filter(response => response.ok);
      
      if (successful.length === selectedProfiles.size) {
        setBeanProfiles(prev => prev.filter(profile => !selectedProfiles.has(profile.id)));
        setSelectedProfiles(new Set());
        setShowBulkDeleteConfirm(false);
      } else {
        console.error('Some deletions failed');
      }
    } catch (error) {
      console.error('Error deleting bean profiles:', error);
    }
  };

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteConfirm(false);
  };

  const getCompletenessBadge = (completeness) => {
    const badges = {
      'basic': { text: 'Basic', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      'enhanced': { text: 'Enhanced', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
      'complete': { text: 'Complete', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' }
    };
    return badges[completeness] || badges['basic'];
  };

  const getProfileIcon = (completeness) => {
    const icons = {
      'basic': '📝',
      'enhanced': '⭐',
      'complete': '🏆'
    };
    return icons[completeness] || '📝';
  };

  const columns = [
    {
      header: 'Profile',
      key: 'profile',
      render: (profile) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center border dark:border-dark-border-primary">
            <span className="text-indigo-600 dark:text-dark-accent-primary font-bold">
              {getProfileIcon(profile.profile_completeness)}
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
      header: 'Status',
      key: 'status',
      render: (profile) => {
        const badge = getCompletenessBadge(profile.profile_completeness);
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium border dark:border-dark-border-primary ${badge.color}`}>
            {badge.text}
          </span>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow dark:shadow-dark-lg border dark:border-dark-border-primary">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary">
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
    <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow dark:shadow-dark-lg border dark:border-dark-border-primary">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">Bean Profiles</h3>
          {beanProfiles.length > 0 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              {showAll ? 'Show Recent Only →' : 'View All Profiles →'}
            </button>
          )}
        </div>
      </div>
      
      {showAll ? (
        // Full table view with selection and delete functionality
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
        />
      ) : (
        // Dashboard card view
        <div className="p-6">
          {beanProfiles.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-dark-text-tertiary">
              <div className="text-6xl mb-4">☕</div>
              <p className="text-lg font-semibold mb-2 dark:text-dark-text-primary">No Bean Profiles Yet</p>
              <p className="text-sm mb-6 dark:text-dark-text-secondary">
                Create your first bean profile to track detailed coffee information for better AI coaching!
              </p>
              <button
                onClick={() => {/* This will be handled by parent component */}}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-dark-accent-primary dark:to-dark-accent-secondary text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-dark-accent-primary dark:hover:to-dark-accent-tertiary font-bold shadow-lg dark:shadow-vibrant-glow transform transition hover:scale-105"
              >
                📝 Create Bean Profile
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {beanProfiles.slice(0, 5).map((profile) => {
                const badge = getCompletenessBadge(profile.profile_completeness);
                return (
                  <div 
                    key={profile.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors border dark:border-dark-border-primary"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center border dark:border-dark-border-primary">
                        <span className="text-indigo-600 dark:text-dark-accent-primary font-bold">
                          {getProfileIcon(profile.profile_completeness)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                          {profile.name}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-dark-text-tertiary">
                          {profile.origin && <span>{profile.origin}</span>}
                          {profile.variety && <span>• {profile.variety}</span>}
                          {profile.process_method && <span>• {profile.process_method}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border dark:border-dark-border-primary ${badge.color}`}>
                        {badge.text}
                      </span>
                      <button
                        onClick={() => handleViewProfile(profile)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                        title="View profile details"
                      >
                        👁️
                      </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{selectedProfile.name}</h2>
                  <p className="opacity-90">Bean Profile Details</p>
                </div>
                <button
                  onClick={handleCloseProfile}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Basic Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <span className="font-medium text-gray-700 dark:text-dark-text-primary">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getCompletenessBadge(selectedProfile.profile_completeness).color}`}>
                      {getCompletenessBadge(selectedProfile.profile_completeness).text}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Data */}
              {(selectedProfile.moisture_content_pct || selectedProfile.density_g_ml || selectedProfile.altitude_m || selectedProfile.screen_size) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Enhanced Data</h3>
                  <div className="grid grid-cols-2 gap-4">
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Flavor Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Notes</h3>
                  <p className="text-gray-600 dark:text-dark-text-secondary">{selectedProfile.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseProfile}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleEditProfile}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium"
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-2">
                Delete Bean Profile
              </h3>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                Are you sure you want to delete "{profileToDelete?.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
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
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-2">
                Delete Selected Bean Profiles
              </h3>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                Are you sure you want to delete {selectedProfiles.size} selected bean profile{selectedProfiles.size > 1 ? 's' : ''}? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
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
    </div>
  );
};

export default BeanProfiles;
