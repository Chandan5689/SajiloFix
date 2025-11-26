import React from 'react';

const ThisMonthStats = () => {
  const stats = [
    { label: 'New Reviews', value: '8' },
    { label: 'Average Rating', value: '4.8' },
    { label: 'Response Rate', value: '85%' },
    { label: 'Helpful Votes', value: '42' }
  ];

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