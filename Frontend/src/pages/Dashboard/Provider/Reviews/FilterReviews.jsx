import React from 'react';

const FilterReviews = ({activeFilter,onFilterChange,filterCounts}) => {
  const filters = [
    { label: 'All Reviews', value: 'all', count: filterCounts.all },
    { label: '★★★★★', value: '5', count: filterCounts[5] },
    { label: '★★★★', value: '4', count: filterCounts[4] },
    { label: '★★★', value: '3', count: filterCounts[3] },
    { label: '★★', value: '2', count: filterCounts[2] },
    { label: '★', value: '1', count: filterCounts[1] }
  ];

  return (
    <div className="bg-white rounded-lg shadow-xl p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Reviews</h2>
      
      <div className="">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={()=>onFilterChange(filter.value)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
              activeFilter === filter.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className={`${filter.label === 'All Reviews'? "text-black" : "text-yellow-500"} text-lg `}>{filter.label}</span>
              <span className={`${
              activeFilter === filter.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-50'
            } text-lg `}>({filter.count})</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterReviews;