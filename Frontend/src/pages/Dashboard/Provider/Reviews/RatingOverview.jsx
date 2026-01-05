import React, { useMemo } from 'react';
import StarRating from './StarRating';

const RatingOverview = ({ reviews = [] }) => {
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingStats: [
          { stars: 5, count: 0 },
          { stars: 4, count: 0 },
          { stars: 3, count: 0 },
          { stars: 2, count: 0 },
          { stars: 1, count: 0 }
        ]
      };
    }
    
    const totalReviews = reviews.length;
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;
    
    reviews.forEach(review => {
      const rating = parseInt(review.rating, 10);
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating]++;
        totalRating += rating;
      }
    });
    
    const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;
    const ratingStats = [
      { stars: 5, count: ratingCounts[5] },
      { stars: 4, count: ratingCounts[4] },
      { stars: 3, count: ratingCounts[3] },
      { stars: 2, count: ratingCounts[2] },
      { stars: 1, count: ratingCounts[1] }
    ];
    
    return { totalReviews, averageRating, ratingStats };
  }, [reviews]);

  return (
    <div className="bg-white rounded-lg shadow-xl p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Overview</h2>
      
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-gray-900">{stats.averageRating}</div>
        <div className="flex justify-center mt-1">
          <StarRating rating={parseFloat(stats.averageRating)} size="lg" />
        </div>
        <div className="text-sm text-gray-600 mt-1">{stats.totalReviews} total reviews</div>
      </div>

      <div className="space-y-2">
        {stats.ratingStats.map((stat, index) => (
          <div key={stat.stars} className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600 w-4">{stat.stars}</span>
              <span className="text-yellow-400">★</span>
            </div>
            <div className="flex-1 mx-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full" 
                  style={{ width: stats.totalReviews > 0 ? `${(stat.count / stats.totalReviews) * 100}%` : '0%' }}
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