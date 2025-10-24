import React from 'react';
import { useWalkthrough } from '../../contexts/WalkthroughContext';

const DemoBeanProfileDetail = ({ profile, onClose }) => {
  const { isWalkthrough } = useWalkthrough();

  if (!isWalkthrough || !profile.is_demo) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary">
                Demo Bean Profile
              </h2>
              <p className="text-gray-600 dark:text-dark-text-secondary">
                This is what a bean profile detail page looks like
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Demo Content */}
          <div className="space-y-6">
            {/* Profile Overview */}
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
                Bean Profile Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Name</p>
                  <p className="font-medium">{profile.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Origin</p>
                  <p className="font-medium">{profile.origin}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Variety</p>
                  <p className="font-medium">{profile.variety}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Process</p>
                  <p className="font-medium">{profile.process}</p>
                </div>
              </div>
            </div>

            {/* Bean Characteristics */}
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
                Bean Characteristics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Altitude</p>
                  <p className="font-medium">{profile.altitude}m</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Density</p>
                  <p className="font-medium">{profile.density}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Screen Size</p>
                  <p className="font-medium">{profile.screen_size}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Moisture</p>
                  <p className="font-medium">{profile.moisture_content}%</p>
                </div>
              </div>
            </div>

            {/* Cupping Score */}
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
                Cupping Score
              </h3>
              <div className="flex items-center space-x-4">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {profile.cupping_score}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Out of 100</p>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    {profile.cupping_score >= 90 ? 'Excellent' : 
                     profile.cupping_score >= 85 ? 'Very Good' : 
                     profile.cupping_score >= 80 ? 'Good' : 'Fair'}
                  </p>
                </div>
              </div>
            </div>

            {/* Flavor Notes */}
            {profile.flavor_notes && (
              <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
                  Flavor Notes
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                    {profile.flavor_notes}
                  </span>
                </div>
              </div>
            )}

            {/* Roasting Notes */}
            {profile.roasting_notes && (
              <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
                  Roasting Notes
                </h3>
                <p className="text-gray-700 dark:text-dark-text-secondary">
                  {profile.roasting_notes}
                </p>
              </div>
            )}

            {/* Espresso Suitability */}
            {profile.espresso_suitable && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-amber-600 dark:text-amber-400 text-2xl">☕</div>
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                      Good for Espresso
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      This bean profile is suitable for espresso brewing
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Demo Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="text-blue-600 dark:text-blue-400 text-2xl">🎯</div>
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                    Demo Mode
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This is sample data to show you what bean profiles look like. 
                    In the real app, you'll see your actual bean profile data here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoBeanProfileDetail;
