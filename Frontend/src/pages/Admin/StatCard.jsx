import React from 'react';
import { MdArrowUpward, MdArrowDownward } from 'react-icons/md';

const colorClasses = {
  blue: { 
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50', 
    icon: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md',
    border: 'border-blue-200'
  },
  green: { 
    bg: 'bg-gradient-to-br from-green-50 to-green-100/50', 
    icon: 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md',
    border: 'border-green-200'
  },
  orange: { 
    bg: 'bg-gradient-to-br from-orange-50 to-orange-100/50', 
    icon: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md',
    border: 'border-orange-200'
  },
  purple: { 
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50', 
    icon: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md',
    border: 'border-purple-200'
  },
  yellow: { 
    bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50', 
    icon: 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-md',
    border: 'border-yellow-200'
  },
  red: { 
    bg: 'bg-gradient-to-br from-red-50 to-red-100/50', 
    icon: 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md',
    border: 'border-red-200'
  },
};

export default function StatCard({ icon: Icon, title, value, growth, color = 'green', isCurrency = false }) {
  const colors = colorClasses[color] || colorClasses.green;
  const isPositiveGrowth = growth >= 0;

  return (
    <div className={`${colors.bg} rounded-xl p-5 hover:shadow-lg transition-all duration-200 border ${colors.border} hover:scale-105`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${colors.icon} p-3 rounded-lg`}>
          <Icon size={22} />
        </div>
      </div>
      <h3 className="text-gray-600 text-xs font-bold mb-2 uppercase tracking-wider">{title}</h3>
      <div className="mb-3">
        {typeof value === 'number' && !isCurrency ? (
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        ) : (
          <p className="text-2xl md:text-3xl font-bold text-gray-900 line-clamp-1">{value}</p>
        )}
      </div>
      {growth !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${isPositiveGrowth ? 'text-green-600' : 'text-red-600'}`}>
          {isPositiveGrowth ? (
            <MdArrowUpward size={14} />
          ) : (
            <MdArrowDownward size={14} />
          )}
          <span>
            {Math.abs(growth).toFixed(1)}% from last month
          </span>
        </div>
      )}
    </div>
  );
}
