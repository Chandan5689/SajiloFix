import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MdBarChart, MdTrendingUp, MdCalendarToday } from 'react-icons/md';

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    // Placeholder for analytics data
    setLoading(false);
    setAnalyticsData({
      total_views: 15234,
      new_bookings: 342,
      conversion_rate: 23.5,
      avg_rating: 4.7,
    });
  }, [dateRange]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-2">Track platform performance and user insights</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-4">Date Range</label>
        <div className="flex gap-4">
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                dateRange === range
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Coming Soon Message */}
      <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-dashed border-green-300 p-12 text-center">
        <MdBarChart className="inline-block text-5xl text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          Detailed analytics and performance reports will be available in the next update
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <div className="bg-white rounded-lg p-4 flex-1 min-w-[150px]">
            <MdTrendingUp className="text-orange-600 text-3xl mx-auto mb-2" />
            <p className="font-semibold text-gray-900">15.2K</p>
            <p className="text-sm text-gray-600">Page Views</p>
          </div>
          <div className="bg-white rounded-lg p-4 flex-1 min-w-[150px]">
            <MdCalendarToday className="text-green-600 text-3xl mx-auto mb-2" />
            <p className="font-semibold text-gray-900">342</p>
            <p className="text-sm text-gray-600">New Bookings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
