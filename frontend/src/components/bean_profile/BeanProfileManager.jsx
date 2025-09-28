import React, { useState, useEffect } from 'react';
import QRCodeScanner from './QRCodeScanner';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app';

const BeanProfileManager = ({ isOpen, onClose, onBeanProfileSelected, getAuthToken }) => {
  const [beanProfiles, setBeanProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [selectedProfiles, setSelectedProfiles] = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBeanProfiles();
    }
  }, [isOpen]);

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
        const profiles = await response.json();
        setBeanProfiles(profiles);
      }
    } catch (error) {
      console.error('Error loading bean profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScanSuccess = async (beanData) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/bean-profiles/parse-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: beanData.supplier_url })
      });

      if (response.ok) {
        const result = await response.json();
        setBeanProfiles(prev => [result.bean_data, ...prev]);
        setShowQRScanner(false);
        // Auto-select the newly created profile
        setSelectedProfile(result.bean_data);
      }
    } catch (error) {
      console.error('Error creating bean profile from QR:', error);
    }
  };

  const handleDeleteClick = (profile, e) => {
    e.stopPropagation(); // Prevent profile selection when clicking delete
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
        // Remove the profile from the list
        setBeanProfiles(prev => prev.filter(profile => profile.id !== profileToDelete.id));
        setShowDeleteConfirm(false);
        setProfileToDelete(null);
      } else {
        throw new Error('Failed to delete bean profile');
      }
    } catch (error) {
      console.error('Error deleting bean profile:', error);
      // You might want to show an error message to the user here
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
        // Remove all selected profiles from the list
        setBeanProfiles(prev => prev.filter(profile => !selectedProfiles.has(profile.id)));
        setSelectedProfiles(new Set());
        setShowBulkDeleteConfirm(false);
      } else {
        console.error('Some deletions failed');
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error('Error deleting bean profiles:', error);
    }
  };

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteConfirm(false);
  };

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    if (onBeanProfileSelected) {
      onBeanProfileSelected(profile);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Bean Profiles</h2>
              <p className="opacity-90">Manage your coffee bean profiles</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowQRScanner(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              📱 Scan QR Code
            </button>
            <button
              onClick={() => {/* TODO: Add manual bean profile creation */}}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              ➕ Add Manually
            </button>
            {beanProfiles.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedProfiles.size === beanProfiles.length && beanProfiles.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-dark-text-primary">
                    Select All
                  </label>
                </div>
                {selectedProfiles.size > 0 && (
                  <button
                    onClick={handleBulkDeleteClick}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                  >
                    🗑️ Delete Selected ({selectedProfiles.size})
                  </button>
                )}
              </>
            )}
          </div>

          {/* Bean Profiles List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-dark-text-secondary">Loading bean profiles...</p>
            </div>
          ) : beanProfiles.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                ☕
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-2">
                No Bean Profiles Yet
              </h3>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
                Scan a QR code from your coffee bag or add a profile manually
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {beanProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedProfiles.has(profile.id)
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : selectedProfile?.id === profile.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedProfiles.has(profile.id)}
                        onChange={(e) => handleProfileCheckbox(profile.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mt-1"
                      />
                      <div className="flex-1 cursor-pointer" onClick={() => handleProfileSelect(profile)}>
                        <h3 className="font-semibold text-gray-800 dark:text-dark-text-primary mb-1">
                          {profile.name}
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-dark-text-secondary space-y-1">
                          <p><strong>Origin:</strong> {profile.origin}</p>
                          <p><strong>Variety:</strong> {profile.variety}</p>
                          <p><strong>Process:</strong> {profile.process_method}</p>
                          {profile.altitude_m && (
                            <p><strong>Altitude:</strong> {profile.altitude_m}m</p>
                          )}
                          {profile.flavor_notes && profile.flavor_notes.length > 0 && (
                            <p><strong>Flavor Notes:</strong> {profile.flavor_notes.join(', ')}</p>
                          )}
                          {profile.recommended_roast_levels && profile.recommended_roast_levels.length > 0 && (
                            <p><strong>Recommended Roast Levels:</strong> {profile.recommended_roast_levels.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      {selectedProfile?.id === profile.id && (
                        <div className="text-indigo-600 dark:text-indigo-400 text-sm">
                          ✓ Selected
                        </div>
                      )}
                      <button
                        onClick={(e) => handleDeleteClick(profile, e)}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                        title="Delete bean profile"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRCodeScanner
          onScanSuccess={handleQRScanSuccess}
          onClose={() => setShowQRScanner(false)}
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

export default BeanProfileManager;
