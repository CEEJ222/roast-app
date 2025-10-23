import React from "react";
import CustomDropdown from "../../ux_ui/CustomDropdown";

const RoastOverviewCard = ({
  roast,
  isEditing,
  editFormData,
  onEditFormChange,
  events,
  formatDuration,
}) => {
  return (
    <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">
        Roast Overview
      </h3>
      
      {isEditing ? (
        <div className="space-y-4">
          {/* Target Roast Level - Only editable field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
              Target Roast Level
            </label>
            <CustomDropdown
              options={[
                { value: '', label: 'Select roast level' },
                { value: 'City', label: 'City' },
                { value: 'City+', label: 'City+' },
                { value: 'Full City', label: 'Full City' },
                { value: 'Full City+', label: 'Full City+' }
              ]}
              value={editFormData.desired_roast_level || ''}
              onChange={(value) => onEditFormChange({...editFormData, desired_roast_level: value})}
              placeholder="Select roast level..."
              className="w-full"
            />
          </div>

          {/* Bean Profile Information - Read Only */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                Bean Profile Information
              </h4>
              <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">
                Edit bean profile details from Beans page
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-dark-text-secondary">Origin:</span>
                <p className="text-sm text-gray-900 dark:text-dark-text-primary">
                  {roast.bean_profiles?.origin || roast.coffee_region || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-dark-text-secondary">Variety:</span>
                <p className="text-sm text-gray-900 dark:text-dark-text-primary">
                  {roast.bean_profiles?.variety || roast.variety || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-dark-text-secondary">Process:</span>
                <p className="text-sm text-gray-900 dark:text-dark-text-primary">
                  {roast.bean_profiles?.process_method || roast.coffee_process || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-dark-text-secondary">Bean Type:</span>
                <p className="text-sm text-gray-900 dark:text-dark-text-primary">
                  {roast.bean_profiles?.bean_type || roast.coffee_type || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Machine Information - Read Only */}
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Machine:</span>
            <p className="text-gray-900 dark:text-dark-text-primary">{roast.machine_label || 'Unknown'}</p>
            <p className="text-xs text-gray-500 dark:text-dark-text-tertiary mt-1">Machine cannot be changed after roast creation</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Target Roast:</span>
            <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full text-sm font-medium">
              {roast.desired_roast_level}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Duration:</span>
            <span className="text-gray-900 dark:text-dark-text-primary font-medium">
              {formatDuration ? formatDuration(roast) : 'N/A'}
            </span>
          </div>
          
          {/* Bean Profile Information */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                Bean Profile Information
              </h4>
              <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">
                Edit bean profile details from Beans page
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-dark-text-secondary">Origin:</span>
                <p className="text-sm text-gray-900 dark:text-dark-text-primary">
                  {roast.bean_profiles?.origin || roast.coffee_region || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-dark-text-secondary">Variety:</span>
                <p className="text-sm text-gray-900 dark:text-dark-text-primary">
                  {roast.bean_profiles?.variety || roast.variety || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-dark-text-secondary">Process:</span>
                <p className="text-sm text-gray-900 dark:text-dark-text-primary">
                  {roast.bean_profiles?.process_method || roast.coffee_process || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-dark-text-secondary">Bean Type:</span>
                <p className="text-sm text-gray-900 dark:text-dark-text-primary">
                  {roast.bean_profiles?.bean_type || roast.coffee_type || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Machine Information */}
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Machine:</span>
            <p className="text-gray-900 dark:text-dark-text-primary">{roast.machine_label || 'Unknown'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoastOverviewCard;