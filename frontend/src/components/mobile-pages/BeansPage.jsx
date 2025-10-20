import React, { useState, useEffect } from 'react';
import BeanProfiles from '../dashboard/BeanProfiles';

const BeansPage = ({
  getAuthToken,
  onDataChange = null,
  triggerBeanProfileCreate = false,
  onTriggerReset = null
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className={`bg-transparent px-4 py-6 ${isMobile ? '' : 'border-b border-gray-200 dark:border-dark-border-primary'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">Bean Profiles</h1>
              <p className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">Manage your coffee bean profiles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bean Profiles Content */}
      <div className={`${isMobile ? 'py-6 pb-24' : 'py-6'}`}>
        <div className="max-w-7xl mx-auto">
          <BeanProfiles 
            getAuthToken={getAuthToken} 
            onDataChange={onDataChange} 
            triggerCreateModal={triggerBeanProfileCreate}
            onTriggerReset={onTriggerReset}
          />
        </div>
      </div>
    </div>
  );
};

export default BeansPage;
