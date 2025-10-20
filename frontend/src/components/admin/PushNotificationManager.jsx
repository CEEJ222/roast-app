import React, { useState, useEffect } from 'react';

const PushNotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([
    {
      id: 'roast-milestone',
      name: 'Roast Milestone',
      title: 'Roast Milestone Reached',
      body: 'Your roast has reached the {milestone} phase',
      icon: '🔥',
      category: 'roast'
    },
    {
      id: 'roast-complete',
      name: 'Roast Complete',
      title: 'Roast Finished!',
      body: 'Your {roastLevel} roast is complete and ready for cooling',
      icon: '✅',
      category: 'roast'
    },
    {
      id: 'bean-profile-tip',
      name: 'Bean Profile Tip',
      title: 'Pro Tip',
      body: 'Did you know {beanOrigin} beans typically perform best at {temperature}°F?',
      icon: '💡',
      category: 'education'
    },
    {
      id: 'app-update',
      name: 'App Update',
      title: 'New Features Available',
      body: 'Check out the latest improvements to your roasting experience',
      icon: '🚀',
      category: 'app'
    }
  ]);
  
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // User segmentation options
  const audienceOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'active-roasters', label: 'Active Roasters (Last 30 days)' },
    { value: 'beginner-roasters', label: 'Beginner Roasters' },
    { value: 'advanced-roasters', label: 'Advanced Roasters' },
    { value: 'ios-users', label: 'iOS Users' },
    { value: 'android-users', label: 'Android Users' },
    { value: 'web-users', label: 'Web Users' }
  ];

  // Notification history (mock data)
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        title: 'Roast Milestone Reached',
        body: 'Your roast has reached the first crack phase',
        sentAt: '2024-01-15T10:30:00Z',
        audience: 'Active Roasters',
        status: 'delivered',
        deliveryRate: 94.2,
        openRate: 67.8
      },
      {
        id: 2,
        title: 'New Bean Profile Feature',
        body: 'Track your favorite beans with our new profile system',
        sentAt: '2024-01-14T15:45:00Z',
        audience: 'All Users',
        status: 'delivered',
        deliveryRate: 98.1,
        openRate: 45.3
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setCustomTitle(template.title);
      setCustomBody(template.body);
    }
  };

  const handleSendNotification = async () => {
    const notificationData = {
      title: customTitle,
      body: customBody,
      audience: targetAudience,
      scheduledTime: isScheduled ? scheduledTime : null,
      template: selectedTemplate
    };

    try {
      // TODO: Implement API call to backend
      console.log('Sending notification:', notificationData);
      
      // Mock success
      const newNotification = {
        id: Date.now(),
        title: customTitle,
        body: customBody,
        sentAt: new Date().toISOString(),
        audience: audienceOptions.find(a => a.value === targetAudience)?.label || 'All Users',
        status: 'sent',
        deliveryRate: 0,
        openRate: 0
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      // Reset form
      setCustomTitle('');
      setCustomBody('');
      setSelectedTemplate('');
      setTargetAudience('all');
      setIsScheduled(false);
      setScheduledTime('');
      
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Push Notifications
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Send targeted notifications to iOS, Android, and Web users
          </p>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Notification Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Send New Notification
          </h3>

          {/* Template Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Choose Template (Optional)
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a template...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.icon} {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notification Title
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Enter notification title..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Custom Body */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notification Message
            </label>
            <textarea
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              placeholder="Enter notification message..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Target Audience */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Audience
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
            >
              {audienceOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Scheduling */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Schedule for later
                </span>
              </label>
            </div>
            
            {isScheduled && (
              <div className="mt-3">
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendNotification}
            disabled={!customTitle || !customBody}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {isScheduled ? 'Schedule Notification' : 'Send Now'}
          </button>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Preview
            </h3>
            
            {customTitle && customBody ? (
              <div className="space-y-4">
                {/* Mobile Preview */}
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Mobile Preview</h4>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        R
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {customTitle}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                          {customBody}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Roast Buddy • now
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Web Preview */}
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Web Preview</h4>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">
                        R
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {customTitle}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300 text-sm">
                          {customBody}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                Enter title and message to see preview
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notification History
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Notification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Audience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Sent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Delivery Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Open Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {notification.body}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {notification.audience}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(notification.sentAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.status)}`}>
                      {notification.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {notification.deliveryRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {notification.openRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationManager;
