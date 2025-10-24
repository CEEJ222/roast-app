import React from 'react';
import { useWalkthrough } from '../../contexts/WalkthroughContext';

const DemoRoastDetail = ({ roast, onClose }) => {
  const { isWalkthrough } = useWalkthrough();

  if (!isWalkthrough || !roast.is_demo) {
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
                Demo Roast Detail
              </h2>
              <p className="text-gray-600 dark:text-dark-text-secondary">
                This is what a roast detail page looks like
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
            {/* Roast Overview */}
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
                Roast Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Coffee</p>
                  <p className="font-medium">{roast.bean_profile_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Roast Level</p>
                  <p className="font-medium">{roast.desired_roast_level}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Weight In</p>
                  <p className="font-medium">{roast.weight_before_g}g</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Weight Out</p>
                  <p className="font-medium">{roast.weight_after_g}g</p>
                </div>
              </div>
            </div>

            {/* Roast Notes */}
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
                Roast Notes
              </h3>
              <p className="text-gray-700 dark:text-dark-text-secondary">
                {roast.notes}
              </p>
            </div>

            {/* Tasting Notes */}
            {roast.tasting_notes && (
              <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
                  Tasting Notes
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Aroma</p>
                    <p className="font-medium">{roast.tasting_notes.aroma}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Flavor</p>
                    <p className="font-medium">{roast.tasting_notes.flavor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Body</p>
                    <p className="font-medium">{roast.tasting_notes.body}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Aftertaste</p>
                    <p className="font-medium">{roast.tasting_notes.aftertaste}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Star Rating */}
            {roast.star_rating && (
              <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
                  Rating
                </h3>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-6 h-6 ${
                        star <= roast.star_rating
                          ? 'text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-lg font-medium text-gray-800 dark:text-dark-text-primary">
                    {roast.star_rating}/5
                  </span>
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
                    This is sample data to show you what roast details look like. 
                    In the real app, you'll see your actual roast data here.
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

export default DemoRoastDetail;
