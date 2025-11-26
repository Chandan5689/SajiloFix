import React from 'react';
import StarRating from './StarRating';

const RatingOverview = () => {
  const totalReviews = 4
  const ratingStats = [
    { stars: 5, count: 3 },
    { stars: 4, count: 2 },
    { stars: 3, count: 1 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 }
  ];

  return (
    <div className="bg-white rounded-lg shadow-xl p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Overview</h2>
      
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-gray-900">4.3</div>
        <div className="flex justify-center mt-1">
          <StarRating rating={4.3} size="lg" />
        </div>
        <div className="text-sm text-gray-600 mt-1">{totalReviews} total reviews</div>
      </div>

      <div className="space-y-2">
        {ratingStats.map((stat, index) => (
          <div key={stat.stars} className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600 w-4">{stat.stars}</span>
              <span className="text-yellow-400">★</span>
            </div>
            <div className="flex-1 mx-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full" 
                  style={{ width: `${(stat.count / totalReviews) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm text-gray-600 w-8 text-right">{stat.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingOverview;