import { useEffect, useRef, useState } from 'react';

const usePullToRefresh = (onRefresh, threshold = 120) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const elementRef = useRef(null);
  const startY = useRef(0);
  const startX = useRef(0);
  const currentY = useRef(0);
  const currentX = useRef(0);
  const isPulling = useRef(false);
  const hasMovedEnough = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      // Check if we're at the top of the page (not just the element)
      // The actual scrolling happens on document.body or window
      const pageScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const isAtTop = pageScrollTop <= 5;
      
      if (isAtTop) {
        startY.current = e.touches[0].clientY;
        startX.current = e.touches[0].clientX;
        currentY.current = e.touches[0].clientY;
        currentX.current = e.touches[0].clientX;
        isPulling.current = true;
        hasMovedEnough.current = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling.current) return;

      // Stop pull-to-refresh if user has scrolled away from the top
      const pageScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (pageScrollTop > 5) {
        isPulling.current = false;
        hasMovedEnough.current = false;
        setPullDistance(0);
        return;
      }

      currentY.current = e.touches[0].clientY;
      currentX.current = e.touches[0].clientX;
      
      const deltaY = currentY.current - startY.current;
      const deltaX = Math.abs(currentX.current - startX.current);
      
      // Check if this is primarily a vertical gesture (not horizontal swipe)
      const isVerticalGesture = deltaY > deltaX;
      
      // Only proceed if it's a vertical gesture and we've moved at least 15px down
      if (deltaY > 15 && isVerticalGesture) {
        hasMovedEnough.current = true;
        
        // Only prevent default if we've moved enough and it's clearly a pull gesture
        if (deltaY > 30) {
          e.preventDefault();
        }
        
        // Calculate pull distance with resistance
        const resistance = 0.4;
        const distance = Math.min(deltaY * resistance, threshold * 1.5);
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling.current) return;

      isPulling.current = false;
      
      // Only trigger refresh if we moved enough and reached the threshold
      if (hasMovedEnough.current && pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        onRefresh().finally(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        });
      } else {
        setPullDistance(0);
      }
      
      hasMovedEnough.current = false;
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
