// Accessibility utilities for mobile app

export const announceToScreenReader = (message) => {
  // Create a live region for screen reader announcements
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const formatTimeForScreenReader = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds} seconds`;
  } else if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }
};

export const formatTemperatureForScreenReader = (temperature, units) => {
  const unit = units === 'celsius' ? 'Celsius' : 'Fahrenheit';
  return `${temperature} degrees ${unit}`;
};

export const getRoastPhaseDescription = (phase) => {
  const descriptions = {
    'drying': 'Drying phase - removing moisture from the beans',
    'maillard': 'Maillard phase - developing flavor compounds',
    'development': 'Development phase - final flavor development',
    'cooling': 'Cooling phase - stopping the roast process'
  };
  
  return descriptions[phase] || `Roast phase: ${phase}`;
};

export const getMilestoneDescription = (milestone) => {
  const descriptions = {
    'DRY_END': 'Dry end milestone marked',
    'FIRST_CRACK': 'First crack milestone marked',
    'SECOND_CRACK': 'Second crack milestone marked',
    'COOL': 'Cooling milestone marked'
  };
  
  return descriptions[milestone] || `Milestone ${milestone} marked`;
};

export const createAccessibleButton = (props) => {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': props.ariaLabel,
    'aria-describedby': props.ariaDescribedBy,
    'aria-pressed': props.ariaPressed,
    'aria-expanded': props.ariaExpanded,
    'aria-controls': props.ariaControls,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        props.onClick?.();
      }
    },
    ...props
  };
};

export const createAccessibleInput = (props) => {
  return {
    'aria-label': props.ariaLabel,
    'aria-describedby': props.ariaDescribedBy,
    'aria-required': props.required,
    'aria-invalid': props.invalid,
    'aria-valuemin': props.min,
    'aria-valuemax': props.max,
    'aria-valuenow': props.value,
    ...props
  };
};

export const createAccessibleChart = (props) => {
  return {
    role: 'img',
    'aria-label': props.ariaLabel,
    'aria-describedby': props.ariaDescribedBy,
    ...props
  };
};

export const focusManagement = {
  trap: (container) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },
  
  restore: (previousElement) => {
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  }
};

export const screenReaderOnly = {
  className: 'sr-only',
  style: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0
  }
};
