import React, { useMemo } from 'react';

const ThisMonthStats = ({ reviews = [] }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const thisMonthReviews = reviews.filter(r => {
      if (!r.created_at) return false;
      const date = new Date(r.created_at);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const newReviews = thisMonthReviews.length;
    
    let avgRating = 0;
    if (thisMonthReviews.length > 0) {
      const totalRating = thisMonthReviews.reduce((sum, r) => sum + (parseInt(r.rating, 10) || 0), 0);
      avgRating = (totalRating / thisMonthReviews.length).toFixed(1);
    }
    
    const responsesCount = thisMonthReviews.filter(r => r.provider_response).length;
    const responseRate = thisMonthReviews.length > 0 
      ? Math.round((responsesCount / thisMonthReviews.length) * 100) 
      : 0;
    
    return [
      { label: 'New Reviews', value: newReviews.toString() },
      { label: 'Average Rating', value: avgRating || 'N/A' },
      { label: 'Response Rate', value: `${responseRate}%` },
      { label: 'Recommended %', value: thisMonthReviews.length > 0 ? `${Math.round((thisMonthReviews.filter(r => r.would_recommend).length / thisMonthReviews.length) * 100)}%` : 'N/A' }
    ];
  }, [reviews]);

  return (
    <div className="bg-white rounded-lg shadow-xl p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month</h2>
      
      <div className="grid gap-4">
        {stats.map((stat, index) => (
          <div key={stat.label} className="text-center flex justify-between">
            <div className="text-base text-gray-700 mt-1">{stat.label}</div>
            <div className={`text-base font-bold ${stat.label === 'Response Rate' ? "text-green-600": "text-black"}`}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThisMonthStats;