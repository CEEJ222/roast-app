import React from 'react';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import useLazyRoastDetails from '../../hooks/useLazyRoastDetails';

/**
 * Lazy loading roast card that loads roast details when it comes into view
 */
const LazyRoastCard = ({ 
  roast, 
  getAuthToken, 
  onRoastClick, 
  children,
  className = "",
  ...props 
}) => {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px' // Start loading 100px before the card comes into view
  });

  const { loadRoastDetails, roastDetails, loading, error } = useLazyRoastDetails(getAuthToken);

  // Load roast details when the card comes into view
  React.useEffect(() => {
    if (isIntersecting && roast?.id) {
      loadRoastDetails(roast.id);
    }
  }, [isIntersecting, roast?.id, loadRoastDetails]);

  const handleClick = () => {
    if (onRoastClick) {
      onRoastClick(roast);
    }
  };

  const isDetailsLoaded = roastDetails[roast?.id];
  const isLoading = loading[roast?.id];
  const hasError = error[roast?.id];

  return (
    <div 
      ref={ref}
      className={`lazy-roast-card ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children({
        roast,
        roastDetails: isDetailsLoaded,
        loading: isLoading,
        error: hasError,
        isIntersecting
      })}
    </div>
  );
};

export default LazyRoastCard;
