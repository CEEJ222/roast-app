import React, { useState, useEffect } from 'react';

const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  maxRating = 5, 
  size = 'md',
  interactive = true,
  showLabel = true,
  allowHalfStars = true
}) => {
  const [displayRating, setDisplayRating] = useState(rating);
  const [hoverRating, setHoverRating] = useState(0);

  // Update display rating when prop changes
  useEffect(() => {
    console.log('StarRating: rating prop changed to:', rating);
    setDisplayRating(rating);
  }, [rating]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      case 'xl':
        return 'w-10 h-10';
      default:
        return 'w-6 h-6';
    }
  };

  const getLabel = (rating) => {
    if (rating <= 0 || rating === undefined) return 'Not rated';
    if (rating <= 1) return 'Poor';
    if (rating <= 2) return 'Fair';
    if (rating <= 3) return 'Good';
    if (rating <= 4) return 'Very Good';
    if (rating <= 5) return 'Excellent';
    return 'Not rated';
  };

  const handleStarClick = (starIndex, event) => {
    if (!interactive) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const starWidth = rect.width;
    const isHalfStar = allowHalfStars && clickX < starWidth / 2;
    
    const newRating = starIndex + (isHalfStar ? 0.5 : 1);
    setDisplayRating(newRating);
    onRatingChange && onRatingChange(newRating);
  };

  const handleStarHover = (starIndex, event) => {
    if (!interactive) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const hoverX = event.clientX - rect.left;
    const starWidth = rect.width;
    const isHalfStar = allowHalfStars && hoverX < starWidth / 2;
    
    const hoverValue = starIndex + (isHalfStar ? 0.5 : 1);
    setHoverRating(hoverValue);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverRating(0);
  };

  const renderStar = (index) => {
    const starNumber = index + 1;
    const currentRating = hoverRating || displayRating;
    const isFilled = starNumber <= currentRating;
    const isHalfFilled = allowHalfStars && starNumber === Math.ceil(currentRating) && currentRating % 1 !== 0;

    console.log(`Star ${starNumber}: currentRating=${currentRating}, isFilled=${isFilled}, isHalfFilled=${isHalfFilled}`);

    return (
      <div
        key={index}
        className={`${getSizeClasses()} cursor-pointer transition-colors duration-150 ${
          interactive ? 'hover:scale-110' : ''
        }`}
        onClick={(e) => handleStarClick(index, e)}
        onMouseMove={(e) => handleStarHover(index, e)}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          className={`${getSizeClasses()} ${
            isFilled || isHalfFilled
              ? 'text-yellow-400 dark:text-yellow-300'
              : 'text-gray-300 dark:text-gray-600'
          }`}
          fill={isHalfFilled ? 'url(#halfGradient)' : 'currentColor'}
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isHalfFilled && (
            <defs>
              <linearGradient id="halfGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
          )}
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex space-x-1" onMouseLeave={handleMouseLeave}>
        {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      </div>
      
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getLabel(displayRating)}
        </span>
      )}
    </div>
  );
};

export default StarRating;