import React, { useState, useEffect, useRef } from 'react';
import RoastChatFeedback from '../RoastChatFeedback';

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
  userProfile,
  getAuthToken,
  isOpen,
  onClose
}) => {
  // Debug logging completely disabled to prevent re-renders
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Format time in minutes:seconds
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Format temperature based on user's unit preference
  const formatTemperature = (tempFahrenheit) => {
    if (!tempFahrenheit || isNaN(tempFahrenheit)) return 'Not recorded';
    
    const units = userProfile?.units || {};
    if (units.temperature === 'celsius') {
      const celsius = ((tempFahrenheit - 32) * 5/9);
      return `${Math.round(celsius)}°C`;
    } else {
      return `${Math.round(tempFahrenheit)}°F`;
    }
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    
    // Track unread messages when chat is minimized
    if (isMinimized && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'ai') {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [messages, isMinimized]);

  // Initialize chat with welcome message and first recommendation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);

  // Clear unread count when chat is opened or maximized
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  // Trigger AI call once data becomes available
  useEffect(() => {
        // Debug logs completely disabled
    
    if (isOpen && formData.selectedBeanProfile && formData.selectedMachine) {
      // Check if we already have AI recommendations (avoid duplicate calls)
      const hasAIRecommendation = messages.some(msg => 
        msg.content.includes('**FreshRoast Pre-Roast Strategy:**')
      );
      
      if (!hasAIRecommendation) {
        // console.log('🚀 Triggering initial AI recommendation');
        getAIRecommendation('initial_setup');
      }
    } else {
      // console.log('❌ Missing data for AI call:', {
      //   isOpen,
      //   messagesLength: messages.length,
      //   hasBeanProfile: !!formData.selectedBeanProfile,
      //   hasSelectedMachine: !!formData.selectedMachine
      // });
    }
  }, [isOpen, formData.selectedBeanProfile?.id, formData.selectedMachine?.id]);

  // Auto-trigger AI responses when events change (new events logged)
  useEffect(() => {
    // Trigger even if chat is closed/minimized so we can show unread badges
    if (events.length > 0 && messages.length > 0) {
      // Only trigger if we have a new event (events array changed)
      const lastEvent = events[events.length - 1];
      if (lastEvent && (lastEvent.kind === 'SET' || ['FIRST_CRACK', 'SECOND_CRACK', 'COOL'].includes(lastEvent.kind) || lastEvent.temp_f)) {
        console.log('🔔 New event detected, triggering AI analysis:', {
          kind: lastEvent.kind,
          temp: lastEvent.temp_f,
          heat: lastEvent.heat_level,
          fan: lastEvent.fan_level,
          time: lastEvent.t_offset_sec
        });
        // Auto-respond to all relevant events
        getAutomaticEventResponse(lastEvent);
      }
    }
  }, [events.length]); // Trigger when events array length changes

  const initializeChat = async () => {
      const getStructuredWelcome = () => {
        // Handle machine data - it might be in different formats
        let machineName = 'FreshRoast SR800';
        let hasExtension = false;
        
        if (formData.selectedMachine) {
          machineName = formData.selectedMachine.name || 
                       formData.selectedMachine.model || 
                       'FreshRoast SR800';
          hasExtension = formData.selectedMachine.has_extension || 
                        formData.selectedMachine.hasExtension || 
                        false;
        } else if (formData.model) {
          // Fallback to formData.model if selectedMachine is not available
          machineName = formData.model;
          hasExtension = formData.hasExtension || formData.has_extension || false;
        }
      
      // Machine setup - interpretive guidance
      const machineLine = hasExtension 
        ? `🖥️ **Machine:** ${machineName} with extension tube - expect better bean movement and lower heat/fan settings needed`
        : `🖥️ **Machine:** ${machineName} - standard chamber requires careful heat/fan management for even roasting`;
      
      // Environmental conditions - interpretive guidance
      const getEnvironmentalGuidance = () => {
        if (!environmentalConditions) return `🌡️ **Environment:** Weather data unavailable`;
        
        const temp = environmentalConditions.temperature_f || environmentalConditions.temperature_c;
        const humidity = environmentalConditions.humidity_pct;
        const elevation = environmentalConditions.elevation_ft || environmentalConditions.elevation_m;
        const pressure = environmentalConditions.pressure_hpa;
        
        let guidance = [];
        
        // Temperature guidance
        if (temp > 85) {
          guidance.push("high temperature may speed up roasting");
        } else if (temp < 65) {
          guidance.push("cool temperature may slow roasting");
        } else {
          guidance.push("ideal temperature for roasting");
        }
        
        // Humidity guidance  
        if (humidity > 70) {
          guidance.push("high humidity may require higher fan settings");
        } else if (humidity < 30) {
          guidance.push("low humidity may dry beans faster");
        } else {
          guidance.push("moderate humidity ideal");
        }
        
        // Elevation guidance
        if (elevation > 3000) {
          guidance.push("high altitude requires lower heat settings");
        } else if (elevation < 1000) {
          guidance.push("low altitude allows standard heat settings");
        } else {
          guidance.push("moderate altitude ideal");
        }
        
        return `🌡️ **Environment:** ${guidance.join(", ")}`;
      };
      
      const envLine = getEnvironmentalGuidance();
      
      // Bean information - interpretive guidance
      const bean = formData.selectedBeanProfile;
      
      // Debug: Log the bean profile data to see what fields are available
      if (bean) {
        console.log('Bean profile data for AI chat:', bean);
        console.log('Bean altitude fields:', {
          altitude: bean.altitude,
          altitude_m: bean.altitude_m,
          altitude_ft: bean.altitude_ft
        });
        console.log('Bean density/screen fields:', {
          density: bean.density,
          bulk_density: bean.bulk_density,
          screen_size: bean.screen_size,
          screen_size_mm: bean.screen_size_mm
        });
      }
      
      // Debug: Log machine data
      console.log('Machine data for AI chat:', formData.selectedMachine);
      console.log('Form data for AI chat:', formData);
      
      // Ensure we have machine data - provide fallback if missing
      if (!formData.selectedMachine) {
        console.warn('⚠️ No machine data found, using fallback');
        formData.selectedMachine = {
          model: 'SR800',
          has_extension: false,
          name: 'FreshRoast SR800'
        };
      }
      
      const getBeanOriginGuidance = () => {
        if (!bean) return `🌍 **Bean Origin:** No bean profile selected`;
        
        const origin = bean.origin || 'Unknown';
        const altitude = bean.altitude_m || bean.altitude_ft || bean.altitude;
        const altitudeUnit = bean.altitude_m ? 'm' : 'ft';
        
        let guidance = `${origin}`;
        
        if (altitude) {
          if (altitude > 1500) {
            guidance += ` - high altitude beans require slower, gentler roasting`;
          } else if (altitude > 1000) {
            guidance += ` - moderate altitude allows standard roasting approach`;
          } else {
            guidance += ` - low altitude beans can handle higher heat settings`;
          }
        } else {
          guidance += ` - altitude unknown, monitor closely for roasting characteristics`;
        }
        
        return `🌍 **Bean Origin:** ${guidance}`;
      };
      
          const getBeanProcessGuidance = () => {
            if (!bean) return `🔄 **Bean Process:** No bean profile selected`;
            
            const process = bean.process_method || 'Unknown';
            
            switch (process.toLowerCase()) {
              case 'natural':
              case 'dry':
                return `🔄 **Bean Process:** Natural/Dry - use lower heat, expect faster development`;
              case 'washed':
              case 'wet':
              case 'wet process (washed)':
                return `🔄 **Bean Process:** Washed - higher heat OK, expect cleaner development`;
              case 'honey':
              case 'pulped natural':
                return `🔄 **Bean Process:** Honey - medium heat, balanced development`;
              default:
                // Only show if we have a process name, otherwise skip this line entirely
                return process && process !== 'Unknown' ? `🔄 **Bean Process:** ${process}` : null;
            }
          };
      
        const getScreenSizeGuidance = (screenSize) => {
          // Extract numeric value for comparison
          const size = screenSize.replace(/[^0-9.-]/g, '');
          const numSize = parseFloat(size.split('-')[0]); // Use first number for comparison
          
          if (numSize <= 14) {
            return 'small beans, lower heat to avoid scorching';
          } else if (numSize <= 15) {
            return 'medium-small beans, moderate heat settings';
          } else if (numSize <= 16) {
            return 'medium beans, standard heat settings';
          } else if (numSize <= 17) {
            return 'large beans, higher heat for even roasting';
          } else {
            return 'very large beans, high heat and longer roast time';
          }
        };
        
          const getBeanTypeGuidance = () => {
            if (!bean) return `☕ **Bean Type:** No bean profile selected`;
            
            const name = bean.name;
            const variety = bean.variety;
            const beanType = bean.bean_type;
            const screenSize = bean.screen_size || bean.screen_size_mm;
            
            // Determine primary identifier - prioritize bean_type, then name, then variety
            let primaryIdentifier;
            if (beanType && beanType !== '') {
              primaryIdentifier = beanType;
            } else if (name && name !== '' && name !== 'Unknown') {
              primaryIdentifier = name;
            } else if (variety && variety !== '' && variety !== 'Unknown variety') {
              primaryIdentifier = variety;
            } else {
              primaryIdentifier = 'Unknown';
            }
            
            let guidance = primaryIdentifier;
            
            // Add variety information only if it's different from primary identifier
            if (variety && variety !== primaryIdentifier && variety !== 'Unknown variety' && variety !== '') {
              guidance += ` (${variety})`;
            }
            
            // Add screen size information with roasting implications (ACTIONABLE)
            if (screenSize) {
              const screenGuidance = getScreenSizeGuidance(screenSize);
              guidance += ` - ${screenSize} screen: ${screenGuidance}`;
            }
            
            return `☕ **Bean Type:** ${guidance}`;
          };
      
      const beanOriginLine = bean ? getBeanOriginGuidance() : null;
      const beanProcessLine = bean ? getBeanProcessGuidance() : null;
      const beanTypeLine = bean ? getBeanTypeGuidance() : null;
      
      // Final summary - interpretive guidance
          const getSummaryGuidance = () => {
            if (!bean) {
              return `🎯 **Summary:** ${hasExtension ? 'Extension tube: use lower heat/fan settings' : 'Standard chamber: use higher heat/fan settings'}`;
            }
            
            // Combine machine + bean characteristics for actionable summary
            const altitude = bean.altitude_m || bean.altitude_ft || bean.altitude;
            const process = bean.process_method?.toLowerCase();
            
            let heatAdvice = [];
            
            // Machine contribution
            if (hasExtension) {
              heatAdvice.push('lower heat/fan (extension tube)');
            }
            
            // Altitude contribution
            if (altitude) {
              if (altitude > 1500) {
                heatAdvice.push('slower roast (high altitude)');
              }
            }
            
            // Process contribution
            if (process === 'natural' || process === 'dry') {
              heatAdvice.push('lower heat (natural process)');
            } else if (process === 'washed' || process === 'wet' || process === 'wet process (washed)') {
              heatAdvice.push('higher heat OK (washed)');
            }
            
            // Build summary from advice pieces
            if (heatAdvice.length > 0) {
              return `🎯 **Summary:** Use ${heatAdvice.join(', ')}`;
            }
            
            return `🎯 **Summary:** Standard heat/fan settings recommended`;
          };
      
      const summaryLine = getSummaryGuidance();
      
      const lines = [
        machineLine,
        envLine,
        beanOriginLine,
        beanProcessLine,
        beanTypeLine,
        summaryLine
      ].filter(line => line !== null);

      return `👋 **AI Roasting Copilot Setup Analysis:**

${lines.join('\n')}

Ready to start? I'll provide specific guidance based on your actual roast progression! 🚀`;
    };

    const welcomeMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ai',
      content: getStructuredWelcome(),
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
    
    // Get initial AI recommendation only if we have the required data
    // Initial chat setup complete
    
    if (formData.selectedBeanProfile && formData.selectedMachine) {
      console.log('🚀 Getting initial AI recommendation');
      try {
        await getAIRecommendation('initial_setup');
      } catch (error) {
        console.error('AI recommendation failed:', error);
        const errorMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'ai',
          content: "I'm having trouble connecting right now. Please start your roast and I'll help guide you through it!",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } else {
      console.log('❌ Missing data for initial AI call:', {
        hasBeanProfile: !!formData.selectedBeanProfile,
        hasSelectedMachine: !!formData.selectedMachine
      });
    }
  };

  const getAIRecommendation = async (context = 'general') => {
    console.log('🚨 getAIRecommendation called with context:', context);
    setIsLoading(true);
    
    // Add a timeout to prevent hanging (increased to 30 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI response timeout')), 30000)
    );
    
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
        elapsed_time: elapsedTime / 60, // Convert seconds to minutes
        environmental_conditions: environmentalConditions,
        recent_events: events.slice(-5), // Last 5 events for context
        context_type: context
      };

      const requestBody = {
        bean_profile_id: formData.selectedBeanProfile?.id || "default",
        bean_profile: formData.selectedBeanProfile || null,
        roast_goals: [formData.roastLevel || "City"],
        roast_challenges: [],
        environmental_conditions: environmentalConditions || null,
        machine_info: formData.selectedMachine || null,
        user_units: userProfile?.units || null
      };
      
      console.log('Sending bean profile to AI:', formData.selectedBeanProfile);
      console.log('Request body:', requestBody);

      const response = await Promise.race([
        fetch(`${API_BASE}/api/rag/pre-roast-planning`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        }),
        timeoutPromise
      ]);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add AI response to messages with roast context
      const aiMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: formatAIResponse(data, context),
        timestamp: new Date(),
        roastContext: {
          phase: currentPhase,
          elapsed_seconds: elapsedTime,
          current_temp: events.length > 0 ? events[events.length - 1]?.temp_f : null,
          current_heat: events.length > 0 ? events[events.length - 1]?.heat_level : formData.heat || 0,
          current_fan: events.length > 0 ? events[events.length - 1]?.fan_level : formData.fan || 0,
          current_dtr: null, // DTR not available in current system
          machine_model: formData.selectedMachine?.model || formData.model || "SR800",
          has_extension: formData.selectedMachine?.has_extension || formData.hasExtension || false,
          temp_sensor_type: 'builtin', // Default to builtin sensor
          user_question: context === 'initial_setup' ? null : inputMessage
        }
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error getting AI recommendation:', error);
      
      // Provide a quick fallback response instead of error message
      const fallbackMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: formatFallbackResponse(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAutomaticEventResponse = async (eventData) => {
    setIsLoading(true);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Prepare roast progress context with recent events including timing
      const recentEventsWithData = events.slice(-10).map(e => ({
        kind: e.kind,
        temp_f: e.temp_f,
        heat_level: e.heat_level,
        fan_level: e.fan_level,
        t_offset_sec: e.t_offset_sec,
        note: e.note
      }));
      
      // Get current heat and fan from the latest event or form data
      const latestEvent = events.length > 0 ? events[events.length - 1] : null;
      
      // Find the most recent event with heat/fan data
      let currentHeat = 0;
      let currentFan = 0;
      let currentTemp = null;
      
      // Look through recent events for the latest heat/fan values
      for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (event.heat_level !== null && event.heat_level !== undefined) {
          currentHeat = event.heat_level;
          break;
        }
      }
      
      for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (event.fan_level !== null && event.fan_level !== undefined) {
          currentFan = event.fan_level;
          break;
        }
      }
      
      // Fallback to formData if no event data found
      if (currentHeat === 0) currentHeat = formData.heat || 0;
      if (currentFan === 0) currentFan = formData.fan || 0;
      
      // Get temperature from latest event
      currentTemp = latestEvent?.temp_f || null;

      const roastProgress = {
        roast_id: roastId,
        elapsed_time: elapsedTime / 60, // Convert seconds to minutes
        current_phase: currentPhase,
        recent_events: recentEventsWithData,
        bean_type: formData.selectedBeanProfile?.name || "Unknown",
        target_roast_level: formData.roastLevel || "City",
        environmental_conditions: environmentalConditions || {},
        user_units: userProfile?.units || {},
        current_heat: currentHeat,
        current_fan: currentFan,
        current_temp: currentTemp,
        machine_info: {
          model: (formData.selectedMachine?.model || formData.model || "SR800"),
          has_extension: (formData.selectedMachine?.has_extension || formData.hasExtension || false)
        },
        machine_model: (formData.selectedMachine?.model || formData.model || "SR800"),
        has_extension: (formData.selectedMachine?.has_extension || formData.hasExtension || false)
      };
      
      // Ensure eventData has timing information
      const enrichedEventData = {
        ...eventData,
        t_offset_sec: Math.floor(elapsedTime) // elapsedTime is already in seconds
      };
      
      console.log('📤 Sending to AI:', {
        current_temp: enrichedEventData.temp_f,
        current_time: enrichedEventData.t_offset_sec,
        recent_events_count: recentEventsWithData.length,
        recent_temps: recentEventsWithData.filter(e => e.temp_f).map(e => ({
          temp: e.temp_f,
          time: e.t_offset_sec
        }))
      });

      const response = await fetch(`${API_BASE}/api/rag/automatic-event-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_data: enrichedEventData,
          roast_progress: roastProgress
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('🤖 AI Response received:', {
        has_advice: !!data.advice,
        advice_preview: data.advice?.substring(0, 50),
        has_meaningful_advice: data.has_meaningful_advice,
        recommendations_count: data.recommendations?.length
      });
      
        // TEMPORARILY DISABLE FILTERING TO DEBUG
        // console.log('🔍 DEBUG: Full AI response data:', data);
      
      // Only show a message if there's meaningful advice
      if (data.advice && data.advice.trim()) {
        const aiResponse = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'ai',
          content: formatAutomaticResponse(data, eventData),
          timestamp: new Date(),
          roastContext: {
            phase: currentPhase,
            elapsed_seconds: elapsedTime,
            current_temp: eventData.temp_f,
            current_heat: eventData.heat_level || formData.heat || 0,
            current_fan: eventData.fan_level || formData.fan || 0,
            current_dtr: null,
            machine_model: formData.selectedMachine?.model || formData.model || "SR800",
            has_extension: formData.selectedMachine?.has_extension || formData.hasExtension || false,
            temp_sensor_type: 'builtin',
            user_question: null
          }
        };

        setMessages(prev => [...prev, aiResponse]);
        // console.log('✅ AI message added to chat');
      } else {
        console.log('🔇 AI had no meaningful advice, staying silent');
        // Debug info removed to prevent re-renders
      }

    } catch (error) {
      console.error('Error getting automatic event response:', error);
      
      // Don't add a message - just fail silently
      // The AI should only respond when it has meaningful advice
    } finally {
      setIsLoading(false);
    }
  };

  const formatAutomaticResponse = (data, eventData) => {
    const eventType = eventData.kind;
    
    // Clean up AI response - remove LaTeX formatting and extra whitespace
    const cleanAdvice = (text) => {
      if (!text) return text;
      return text
        .replace(/\$\$\\text\{([^}]+)\}\$\$/g, '$1')  // Remove $$\text{...}$$
        .replace(/\$\$([^$]+)\$\$/g, '$1')            // Remove $$...$$
        .replace(/\\text\{([^}]+)\}/g, '$1')          // Remove \text{...}
        .trim();
    };
    
    // elapsedTime is already in seconds for formatTime
    const timeStr = formatTime(elapsedTime);
    
    if (eventType === 'SET') {
      return `📊 **Heat/Fan Adjustment Detected:**

**Current Settings:** Heat ${eventData.heat_level || 'N/A'}, Fan ${eventData.fan_level || 'N/A'} at ${timeStr}

${cleanAdvice(data.advice) || 'Good adjustment! Continue monitoring your roast progression.'}

**Next Watch Points:**
${data.recommendations?.map(rec => `• ${rec}`).join('\n') || '• Continue monitoring bean movement and color changes'}`;
    } else if (['FIRST_CRACK', 'SECOND_CRACK', 'COOL'].includes(eventType)) {
      const milestoneName = eventType.replace('_', ' ').toLowerCase();
      return `🎉 **${milestoneName.charAt(0).toUpperCase() + milestoneName.slice(1)} Detected!**

**Time:** ${timeStr}
**Temperature:** ${formatTemperature(eventData.temp_f)}

${cleanAdvice(data.advice) || 'Great timing! Your roast is progressing well.'}

**Next Steps:**
${data.recommendations?.map(rec => `• ${rec}`).join('\n') || '• Continue monitoring the development phase'}`;
    }
    
    return cleanAdvice(data.advice) || "Event logged successfully! I'll continue monitoring your roast.";
  };

  const formatAIResponse = (data, context) => {
    if (context === 'initial_setup') {
      // Handle machine data for AI response
      let machineName = 'FreshRoast SR800';
      let hasExtension = false;
      
      if (formData.selectedMachine) {
        machineName = formData.selectedMachine.name || 
                     formData.selectedMachine.model || 
                     'FreshRoast SR800';
        hasExtension = formData.selectedMachine.has_extension || 
                      formData.selectedMachine.hasExtension || 
                      false;
      } else if (formData.model) {
        machineName = formData.model;
        hasExtension = formData.hasExtension || formData.has_extension || false;
      } else {
        // Fallback if no machine data is available
        machineName = 'FreshRoast SR800';
        hasExtension = false;
      }

      return `🎯 **FreshRoast Pre-Roast Strategy:**

**Machine Setup:** ${machineName}${hasExtension ? ' + Extension Tube' : ''}
**Expected Time:** ${data.recommended_profile?.estimated_time || '8-10'} minutes

**Bean-Specific Guidance:**
${data.recommendations?.map(rec => `• ${rec}`).join('\n') || 'Loading personalized guidance...'}

**AI Confidence:** ${Math.round((data.confidence_score || 0.8) * 100)}% ${data.reasoning || 'based on FreshRoast patterns'}

**Note:** I'll provide specific heat/fan recommendations after you log some initial settings and temperature data. This helps me give you more accurate guidance based on your actual roast progression.

Ready to start? I'll guide you through heat/fan adjustments in real-time! 🚀`;
    } else if (context === 'heat_fan_change') {
      const lastEvent = events[events.length - 1];
      return `📊 **Heat/Fan Analysis:**

**Current Settings:** Heat ${lastEvent?.heat_level || 'N/A'}, Fan ${lastEvent?.fan_level || 'N/A'} at ${formatTime(elapsedTime)}

${data.advice || data.recommendation || 'Monitoring your roast progression...'}

**Next Watch Points:**
${data.recommendations?.map(rec => `• ${rec}`).join('\n') || '• Continue monitoring bean movement and color changes'}`;
    } else if (context === 'milestone_reached') {
      const lastEvent = events[events.length - 1];
      const milestoneName = lastEvent?.kind?.replace('_', ' ').toLowerCase() || 'milestone';
      return `🎉 **${milestoneName.charAt(0).toUpperCase() + milestoneName.slice(1)} Detected!**

**Time:** ${formatTime(elapsedTime)}
**Temperature:** ${formatTemperature(lastEvent?.temp_f)}

${data.advice || data.recommendation || 'Great timing! Your roast is progressing well.'}

**Next Steps:**
${data.recommendations?.map(rec => `• ${rec}`).join('\n') || '• Continue monitoring the development phase'}`;
    }
    
    return data.advice || data.recommendation || "I'm analyzing your FreshRoast setup to provide the best guidance...";
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
    // Fallback tips - should rarely be used as AI should provide better guidance
    return `• AI guidance temporarily unavailable - using fallback tips
• Watch for the 'yellowing' phase at 2-3 minutes - beans should turn from green to pale yellow before browning
• First crack typically occurs 8-12 minutes (extension tube: 10-14 minutes) - listen for the distinct 'pop' sound, not a sizzle
• If beans aren't moving evenly, increase fan by 1-2 levels rather than adjusting heat
• The glass chamber shows color progression: yellow → tan → light brown → medium brown → dark brown
• Extension tube users: expect 2-3 minute longer roast times and need 1-2 higher heat settings
• If roast stalls (no color change for 1+ minute), bump heat by 1 level and wait 30 seconds`;
  };

  const formatFallbackResponse = () => {
    // Handle machine data - it might be in different formats
    let machineName = 'FreshRoast SR800';
    let hasExtension = false;
    
    if (formData.selectedMachine) {
      machineName = formData.selectedMachine.name || 
                   formData.selectedMachine.model || 
                   'FreshRoast SR800';
      hasExtension = formData.selectedMachine.has_extension || 
                    formData.selectedMachine.hasExtension || 
                    false;
    } else if (formData.model) {
      machineName = formData.model;
      hasExtension = formData.hasExtension || formData.has_extension || false;
    }
    
    const roastLevel = formData.roastLevel || 'City';
    
    // Quick fallback recommendations based on common settings
    // Adjust for extension tube users (need higher heat/fan)
    const heatAdjustment = hasExtension ? 1 : 0;
    const fanAdjustment = hasExtension ? 1 : 0;
    
    const baseHeatSettings = {
      'Light': 6,
      'City': 5, 
      'City+': 5,
      'Full City': 4,
      'Dark': 4
    };
    
    const baseFanSettings = {
      'Light': 3,
      'City': 4,
      'City+': 4, 
      'Full City': 5,
      'Dark': 6
    };
    
    const heatSettings = {};
    const fanSettings = {};
    
    // Apply extension tube adjustments
    Object.keys(baseHeatSettings).forEach(level => {
      heatSettings[level] = `${baseHeatSettings[level] + heatAdjustment}-${baseHeatSettings[level] + heatAdjustment + 1}`;
      fanSettings[level] = `${baseFanSettings[level] + fanAdjustment}-${baseFanSettings[level] + fanAdjustment + 1}`;
    });
    
    const extensionNote = hasExtension 
      ? "You have an extension tube - expect 2-3 minute longer roast times and need 1-2 higher heat settings."
      : "You're using the standard chamber.";
    
    return `🎯 **Quick Roast Setup (AI Loading...)**

**Machine Setup:** ${machineName}${hasExtension ? ' + Extension Tube' : ''}
${extensionNote}

**Initial Settings:**
• Heat: ${heatSettings[roastLevel] || '5-6'}
• Fan: ${fanSettings[roastLevel] || '4-5'}
• Time: ${hasExtension ? '14-17' : '12-15'} minutes

**Quick Tips:**
• Start with lower heat/fan, increase gradually
• Listen for first crack around 8-12 minutes (extension tube: 10-14 minutes)
• Watch for even bean movement and color changes
• Use fan to control bean movement

**AI is loading personalized recommendations...** 🤖`;
  };

  const sendMessage = async () => {
    console.log('🚨 sendMessage called with inputMessage:', inputMessage);
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

      // Get current heat and fan from the latest event or form data
      const latestEvent = events.length > 0 ? events[events.length - 1] : null;
      
      // Find the most recent event with heat/fan data
      let currentHeat = 0;
      let currentFan = 0;
      let currentTemp = null;
      
      // Look through recent events for the latest heat/fan values
      for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (event.heat_level !== null && event.heat_level !== undefined) {
          currentHeat = event.heat_level;
          break;
        }
      }
      
      for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (event.fan_level !== null && event.fan_level !== undefined) {
          currentFan = event.fan_level;
          break;
        }
      }
      
      // Fallback to formData if no event data found
      if (currentHeat === 0) currentHeat = formData.heat || 0;
      if (currentFan === 0) currentFan = formData.fan || 0;
      
      // Get temperature from latest event
      currentTemp = latestEvent?.temp_f || null;
      
      // Debug logging for heat/fan values
      console.log('🔧 DEBUG: latestEvent:', latestEvent);
      console.log('🔧 DEBUG: formData.heat:', formData.heat);
      console.log('🔧 DEBUG: formData.fan:', formData.fan);
      console.log('🔧 DEBUG: currentHeat being sent:', currentHeat);
      console.log('🔧 DEBUG: currentFan being sent:', currentFan);

      // Prepare roast progress context
      const roastProgress = {
        roast_id: roastId,
        elapsed_time: elapsedTime / 60, // Convert seconds to minutes
        current_phase: currentPhase,
        recent_events: events.slice(-5),
        bean_type: formData.selectedBeanProfile?.name || "Unknown",
        target_roast_level: formData.roastLevel || "City",
        user_units: userProfile?.units || {},
        current_heat: currentHeat,
        current_fan: currentFan,
        current_temp: currentTemp,
        machine_info: {
          model: (formData.selectedMachine?.model || formData.model || "SR800"),
          has_extension: (formData.selectedMachine?.has_extension || formData.hasExtension || false)
        },
        machine_model: (formData.selectedMachine?.model || formData.model || "SR800"),
        has_extension: (formData.selectedMachine?.has_extension || formData.hasExtension || false)
      };

      // Call the LLM-powered during-roast advice endpoint
      console.log('🚀 Sending user question to AI:', userMessage.content);
      console.log('🚀 Roast progress data:', roastProgress);
      console.log('🔧 DEBUG: current_heat being sent:', currentHeat);
      console.log('🔧 DEBUG: current_fan being sent:', currentFan);
      console.log('🔧 DEBUG: current_temp being sent:', currentTemp);
      console.log('🚀 Making request to:', `${API_BASE}/api/rag/during-roast-advice`);
      
      const response = await fetch(`${API_BASE}/api/rag/during-roast-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roast_progress: roastProgress,
          user_question: userMessage.content
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🤖 AI Response received:', data);
      
      const aiResponse = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: data.advice,
        timestamp: new Date(),
        roastContext: {
          phase: currentPhase,
          elapsed_seconds: elapsedTime,
          current_temp: currentTemp,
          current_heat: currentHeat,
          current_fan: currentFan,
          current_dtr: null,
          machine_model: formData.selectedMachine?.model || formData.model || "SR800",
          has_extension: formData.selectedMachine?.has_extension || formData.hasExtension || false,
          temp_sensor_type: 'builtin',
          user_question: userMessage.content
        }
      };

      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorResponse = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: "I'm having trouble connecting to my AI brain right now. Please check your roast progress manually and adjust heat/fan as needed.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };


  const sendQuickMessage = async (message) => {
    const userMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Get current heat and fan from the latest event or form data
      const latestEvent = events.length > 0 ? events[events.length - 1] : null;
      
      // Find the most recent event with heat/fan data
      let currentHeat = 0;
      let currentFan = 0;
      let currentTemp = null;
      
      // Look through recent events for the latest heat/fan values
      for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (event.heat_level !== null && event.heat_level !== undefined) {
          currentHeat = event.heat_level;
          break;
        }
      }
      
      for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (event.fan_level !== null && event.fan_level !== undefined) {
          currentFan = event.fan_level;
          break;
        }
      }
      
      // Fallback to formData if no event data found
      if (currentHeat === 0) currentHeat = formData.heat || 0;
      if (currentFan === 0) currentFan = formData.fan || 0;
      
      // Get temperature from latest event
      currentTemp = latestEvent?.temp_f || null;

      // Prepare roast progress context
      const roastProgress = {
        roast_id: roastId,
        elapsed_time: elapsedTime / 60, // Convert seconds to minutes
        current_phase: currentPhase,
        recent_events: events.slice(-5),
        bean_type: formData.selectedBeanProfile?.name || "Unknown",
        target_roast_level: formData.roastLevel || "City",
        user_units: userProfile?.units || {},
        current_heat: currentHeat,
        current_fan: currentFan,
        current_temp: currentTemp,
        machine_info: {
          model: (formData.selectedMachine?.model || formData.model || "SR800"),
          has_extension: (formData.selectedMachine?.has_extension || formData.hasExtension || false)
        },
        machine_model: (formData.selectedMachine?.model || formData.model || "SR800"),
        has_extension: (formData.selectedMachine?.has_extension || formData.hasExtension || false)
      };

      const response = await fetch(`${API_BASE}/api/rag/during-roast-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roast_progress: roastProgress,
          user_question: message
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const aiResponse = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: data.advice,
        timestamp: new Date(),
        roastContext: {
          phase: currentPhase,
          elapsed_seconds: elapsedTime,
          current_temp: currentTemp,
          current_heat: currentHeat,
          current_fan: currentFan,
          current_dtr: null,
          machine_model: formData.selectedMachine?.model || formData.model || "SR800",
          has_extension: formData.selectedMachine?.has_extension || formData.hasExtension || false,
          temp_sensor_type: 'builtin',
          user_question: message
        }
      };

      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('Error sending quick message:', error);
      
      const errorResponse = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: "I'm having trouble connecting to my AI brain right now. Please check your roast progress manually and adjust heat/fan as needed.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "How's my roast going?", action: () => sendQuickMessage("How's my roast going?") },
    { label: "Heat/Fan adjustment", action: () => sendQuickMessage("What heat and fan adjustments should I make?") },
    { label: "First crack timing", action: () => sendQuickMessage("When should I expect first crack?") },
    { label: "Temperature check", action: () => sendQuickMessage("Is my temperature on track for this phase?") }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-none">
      <div 
        ref={chatContainerRef}
        onClick={isMinimized ? () => setIsMinimized(false) : undefined}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${
          isMinimized ? 'w-80 h-16 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750' : 'w-96 h-[500px] max-w-[calc(100vw-2rem)] sm:max-w-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              AI Roasting Copilot
            </h3>
            {unreadCount > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
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
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
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
                    <div className="whitespace-pre-wrap text-sm break-words overflow-wrap-anywhere">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                    
                    {/* Add feedback component for AI messages */}
                    {message.type === 'ai' && message.roastContext && (
                      <RoastChatFeedback
                        messageId={message.id}
                        messageText={message.content}
                        roastId={roastId}
                        roastContext={message.roastContext}
                        existingFeedback={message.feedback || null}
                        onFeedbackSubmit={(feedbackType, feedbackId) => {
                          // Update message with feedback
                          setMessages(prev => prev.map(msg => 
                            msg.id === message.id 
                              ? { ...msg, feedback: feedbackType, feedbackId }
                              : msg
                          ));
                        }}
                      />
                    )}
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
                    className="px-3 py-1 text-xs text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
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
                  onChange={(e) => {
                    console.log('📝 Input changed:', e.target.value);
                    setInputMessage(e.target.value);
                  }}
                  onKeyPress={(e) => {
                    console.log('🔑 Key pressed:', e.key, 'inputMessage:', inputMessage);
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      console.log('🚀 Enter key pressed, calling sendMessage');
                      sendMessage();
                    }
                  }}
                  placeholder="Ask your AI copilot anything..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                />
                <button
                  onClick={() => {
                    console.log('🖱️ Send button clicked, inputMessage:', inputMessage);
                    sendMessage();
                  }}
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
