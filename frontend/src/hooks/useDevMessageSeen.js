import { useState, useEffect } from 'react';

export const useDevMessageSeen = () => {
  const [hasSeenDevMessage, setHasSeenDevMessage] = useState(false);

  useEffect(() => {
    // Check if user has seen the dev message before
    const seen = localStorage.getItem('ai-copilot-dev-message-seen');
    if (seen === 'true') {
      setHasSeenDevMessage(true);
    }
  }, []);

  const markAsSeen = () => {
    setHasSeenDevMessage(true);
    localStorage.setItem('ai-copilot-dev-message-seen', 'true');
  };

  return { hasSeenDevMessage, markAsSeen };
};
