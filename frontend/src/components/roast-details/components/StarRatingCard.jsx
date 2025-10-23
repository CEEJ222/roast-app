import React from 'react';
import StarRating from '../../shared/StarRating';

const StarRatingCard = ({ 
  roast, 
  starRating, 
  onRatingChange,
  savingRating,
  ratingSaved 
}) => {
  return (
    <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">
        Roast Rating
      </h3>
      <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
        Rate this roast on a scale of 1-5 stars
      </p>
      
      <div className="flex items-center justify-center mb-4">
        <StarRating
          rating={starRating}
          onRatingChange={onRatingChange}
          maxRating={5}
          size="lg"
          interactive={true}
          showLabel={true}
        />
      </div>
      
      <div className="flex items-center justify-center gap-3">
        {savingRating && (
          <span className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center gap-1">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
            Saving...
          </span>
        )}
        {ratingSaved && (
          <span className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-1">
            ✅ Rating saved!
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRatingCard;
