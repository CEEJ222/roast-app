import React, { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app';

const RoastChat = ({
  roastId,
  formData,
  events,
  elapsedTime,
  currentPhase,
  environmentalConditions,
  getAuthToken,
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with welcome message and first recommendation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);

  const initializeChat = async () => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: "👋 Welcome to your AI Roasting Copilot! I'm here to help guide you through this roast. Let me analyze your setup and provide some initial recommendations.",
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
    
    // Get initial AI recommendation
    await getAIRecommendation('initial_setup');
  };

  const getAIRecommendation = async (context = 'general') => {
    setIsLoading(true);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Prepare context data for AI
      const contextData = {
        roast_id: roastId,
        bean_profile: formData.selectedBeanProfile,
        roast_setup: {
          machine: formData.selectedMachine,
          region: formData.coffeeRegion,
          process: formData.coffeeProcess,
          roast_level: formData.roastLevel,
          weight: formData.weightBefore
        },
        current_phase: currentPhase,
        elapsed_time: elapsedTime,
        environmental_conditions: environmentalConditions,
        recent_events: events.slice(-5), // Last 5 events for context
        context_type: context
      };

      const response = await fetch(`${API_BASE}/api/rag/pre-roast-planning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bean_profile_id: formData.selectedBeanProfile?.id || "default",
          roast_goals: [formData.roastLevel || "City"],
          roast_challenges: [],
          environmental_conditions: environmentalConditions || null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add AI response to messages
      const aiMessage = {
        id: Date.now(),
        type: 'ai',
        content: formatAIResponse(data, context),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error getting AI recommendation:', error);
      
      const errorMessage = {
        id: Date.now(),
        type: 'ai',
        content: "I'm having trouble connecting to my AI brain right now. I'll still be here to help with manual guidance!",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAIResponse = (data, context) => {
    if (context === 'initial_setup') {
      return `🎯 **FreshRoast Pre-Roast Strategy:**

**Machine Setup:** ${formData.selectedMachine?.name || 'FreshRoast SR800'}
**Initial Settings:** 
• Heat: ${getInitialHeatSetting()}
• Fan: ${getInitialFanSetting()}
• Time: ${data.recommended_profile?.estimated_time || '12-15'} minutes

**FreshRoast-Specific Tips:**
${data.recommendations?.map(rec => `• ${rec}`).join('\n') || getFreshRoastTips()}

**AI Confidence:** ${Math.round((data.confidence_score || 0.8) * 100)}% ${data.reasoning || 'based on FreshRoast patterns'}

Ready to start? I'll guide you through heat/fan adjustments in real-time! 🚀`;
    }
    
    return data.recommendation || "I'm analyzing your FreshRoast setup to provide the best guidance...";
  };

  const getInitialHeatSetting = () => {
    const roastLevel = formData.roastLevel;
    if (roastLevel === 'Light' || roastLevel === 'Cinnamon') return '7-8';
    if (roastLevel === 'Medium' || roastLevel === 'City') return '6-7';
    if (roastLevel === 'Dark' || roastLevel === 'French') return '5-6';
    return '6-7'; // Default
  };

  const getInitialFanSetting = () => {
    const roastLevel = formData.roastLevel;
    if (roastLevel === 'Light' || roastLevel === 'Cinnamon') return '3-4';
    if (roastLevel === 'Medium' || roastLevel === 'City') return '4-5';
    if (roastLevel === 'Dark' || roastLevel === 'French') return '5-6';
    return '4-5'; // Default
  };

  const getFreshRoastTips = () => {
    return `• Start with lower heat/fan, increase gradually
• Listen for first crack around 8-10 minutes
• Use fan to control bean movement
• Watch for color changes through the glass
• Extension tube users: expect 2-3 minute longer roasts`;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Prepare roast progress context
      const roastProgress = {
        elapsed_time: elapsedTime,
        current_phase: currentPhase,
        recent_events: events.slice(-5),
        bean_type: formData.selectedBeanProfile?.name || "Unknown",
        target_roast_level: formData.roastLevel || "City"
      };

      // Call the LLM-powered during-roast advice endpoint
      const response = await fetch(`${API_BASE}/api/rag/during-roast-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roast_progress: roastProgress,
          user_question: inputMessage
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const aiResponse = {
        id: Date.now(),
        type: 'ai',
        content: data.advice,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorResponse = {
        id: Date.now(),
        type: 'ai',
        content: "I'm having trouble connecting to my AI brain right now. Please check your roast progress manually and adjust heat/fan as needed.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { label: "How's my roast going?", action: () => getAIRecommendation('progress_check') },
    { label: "Heat/Fan adjustment", action: () => getAIRecommendation('heat_fan') },
    { label: "First crack timing", action: () => getAIRecommendation('first_crack') },
    { label: "Color check", action: () => getAIRecommendation('color_development') }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        ref={chatContainerRef}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              AI Roasting Copilot
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {isMinimized ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask your AI copilot anything..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoastChat;
