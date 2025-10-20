import { useEffect, useRef, useState } from 'react';

const usePullToRefresh = (onRefresh, threshold = 80) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const elementRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      // Only start pull-to-refresh if we're at the top of the scrollable area
      if (element.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling.current) return;

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0) {
        // Prevent default scrolling behavior
        e.preventDefault();
        
        // Calculate pull distance with resistance
        const resistance = 0.5;
        const distance = Math.min(deltaY * resistance, threshold * 1.5);
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling.current) return;

      isPulling.current = false;
      
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        onRefresh().finally(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        });
      } else {
        setPullDistance(0);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, threshold, pullDistance, isRefreshing]);

  return {
    elementRef,
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1)
  };
};

export default usePullToRefresh;
