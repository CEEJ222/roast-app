import React from 'react';

const LLMAnalysisModal = ({ isOpen, onClose, analysisResult }) => {
  if (!isOpen) return null;

  const { characteristics, guidance } = analysisResult || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧠</span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
              LLM Analysis Complete!
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Extracted Characteristics */}
          {characteristics && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-green-500">✅</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                  Extracted Characteristics
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {characteristics.origin && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">Origin:</span>
                    <div className="text-base text-gray-900 dark:text-white mt-1">{characteristics.origin}</div>
                  </div>
                )}
                {characteristics.variety && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">Variety:</span>
                    <div className="text-base text-gray-900 dark:text-white mt-1">{characteristics.variety}</div>
                  </div>
                )}
                {characteristics.process && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">Process:</span>
                    <div className="text-base text-gray-900 dark:text-white mt-1">{characteristics.process}</div>
                  </div>
                )}
                {characteristics.bean_type && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">Bean Type:</span>
                    <div className="text-base text-gray-900 dark:text-white mt-1">{characteristics.bean_type}</div>
                  </div>
                )}
                {characteristics.altitude && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">Altitude:</span>
                    <div className="text-base text-gray-900 dark:text-white mt-1">{characteristics.altitude}m</div>
                  </div>
                )}
                {characteristics.cupping_score && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">Cupping Score:</span>
                    <div className="text-base text-gray-900 dark:text-white mt-1">{characteristics.cupping_score}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Roast Guidance */}
          {guidance && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🎯</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                  Roast Guidance
                </h3>
              </div>
              <div className="space-y-3">
                {guidance.heat_settings && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-white mb-3 text-lg">🔥 FreshRoast Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-sm">
                        <span className="font-medium text-blue-800 dark:text-white">Heat Setting:</span>
                        <div className="text-lg font-bold text-blue-900 dark:text-white mt-1">{guidance.heat_settings.initial_heat || '7'}</div>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-800 dark:text-white">Fan Setting:</span>
                        <div className="text-lg font-bold text-blue-900 dark:text-white mt-1">{guidance.heat_settings.fan_speed || '6'}</div>
                      </div>
                    </div>
                    {guidance.heat_settings.notes && (
                      <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-800/40 rounded">
                        <p className="text-sm text-blue-900 dark:text-white">{guidance.heat_settings.notes}</p>
                      </div>
                    )}
                  </div>
                )}
                {guidance.roast_profile && (
                  <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-white mb-3 text-lg">⏱️ Roast Profile</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-sm">
                        <span className="font-medium text-green-800 dark:text-white">Total Time:</span>
                        <div className="text-lg font-bold text-green-900 dark:text-white mt-1">{guidance.roast_profile.total_time || '10-12 minutes'}</div>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-green-800 dark:text-white">Development Ratio:</span>
                        <div className="text-lg font-bold text-green-900 dark:text-white mt-1">{guidance.roast_profile.development_ratio || '0.20-0.25'}</div>
                      </div>
                    </div>
                  </div>
                )}
                {guidance.key_watch_points && guidance.key_watch_points.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 dark:text-white mb-3 text-lg">👀 Key Watch Points</h4>
                    <ul className="space-y-2">
                      {guidance.key_watch_points.slice(0, 3).map((point, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <span className="text-yellow-600 dark:text-yellow-300 text-lg font-bold">•</span>
                          <span className="text-gray-800 dark:text-white">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span className="text-green-900 dark:text-green-100 font-medium">
                Form updated with extracted characteristics!
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default LLMAnalysisModal;
