import React from 'react';

const StarRating = ({ rating, size = 'md' }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const starSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="flex items-center space-x-0.5">
      {/* Full stars */}
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className={`text-yellow-400 ${starSize[size]}`}>
          ★
        </span>
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <span className={`text-yellow-400 ${starSize[size]}`}>
          ★
        </span>
      )}
      
      {/* Empty stars */}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className={`text-gray-300 ${starSize[size]}`}>
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;