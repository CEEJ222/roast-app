import { useState, useEffect, useRef } from 'react';

const LazyLoadWrapper = ({ children, threshold = 0.1, placeholder = null }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className="lazy-load-wrapper">
      {isVisible ? children : (placeholder || <div className="loading-placeholder">Loading...</div>)}
    </div>
  );
};

export default LazyLoadWrapper;
