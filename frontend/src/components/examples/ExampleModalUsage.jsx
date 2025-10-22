import React from 'react';
import MobileModal from '../shared/MobileModal';

// Example 1: Simple modal with just content
const SimpleModal = ({ isOpen, onClose }) => {
  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Simple Modal"
      subtitle="This is a simple modal example"
    >
      <div className="space-y-4">
        <p>This is the modal content.</p>
        <p>It can contain any React components.</p>
      </div>
    </MobileModal>
  );
};

// Example 2: Modal with save functionality
const FormModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const hasUnsavedChanges = () => {
    return formData.name.trim() !== '' || formData.email.trim() !== '';
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const SaveButton = () => (
    <button
      onClick={handleSave}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
    >
      Save Changes
    </button>
  );

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      subtitle="Update your profile information"
      hasUnsavedChanges={hasUnsavedChanges}
      onSave={<SaveButton />}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
          />
        </div>
      </div>
    </MobileModal>
  );
};

// Example 3: Modal with custom header styling
const CustomHeaderModal = ({ isOpen, onClose }) => {
  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Custom Header"
      subtitle="This modal has a custom header style"
      headerClassName="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
      showCloseButton={false}
    >
      <div className="space-y-4">
        <p>This modal has a custom gradient header and no close button.</p>
        <p>Users can only close by tapping outside or swiping down.</p>
      </div>
    </MobileModal>
  );
};

export { SimpleModal, FormModal, CustomHeaderModal };
