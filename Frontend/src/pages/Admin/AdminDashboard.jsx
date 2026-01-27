import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MdPeople, MdCalendarToday, MdAttachMoney, MdStar, MdTrendingUp, MdRefresh, MdVerified } from 'react-icons/md';
import StatCard from './StatCard';
import RecentCustomers from './RecentCustomers';
import RecentProviders from './RecentProviders';
import RecentBookings from './RecentBookings';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/stats/');
      if (response.data?.success && response.data?.data) {
        setStats(response.data.data);
        setError(null);
      } else {
        setError('No dashboard data available');
        setStats(null);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-semibold mb-4">{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor and manage your SajiloFix platform</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon={MdPeople}
            title="Total Users"
            value={stats.total_users}
            growth={stats.users_growth}
            color="blue"
          />
          <StatCard
            icon={MdPeople}
            title="Active Providers"
            value={stats.active_providers}
            growth={stats.providers_growth}
            color="green"
          />
          <StatCard
            icon={MdCalendarToday}
            title="Total Bookings"
            value={stats.total_bookings}
            growth={stats.bookings_growth}
            color="orange"
          />
          <StatCard
            icon={MdAttachMoney}
            title="Revenue"
            value={`Rs. ${stats.total_revenue.toLocaleString()}`}
            growth={stats.revenue_growth}
            color="purple"
            isCurrency
          />
          <StatCard
            icon={MdStar}
            title="Avg Rating"
            value={stats.average_rating}
            color="yellow"
          />
          <StatCard
            icon={MdVerified}
            title="Pending Verification"
            value={stats.pending_verification}
            color="red"
          />
        </div>
      )}

      {!stats && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-600 shadow-sm">
          No dashboard metrics available. Try refreshing or check your admin permissions.
        </div>
      )}

      {/* Recent Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentCustomers />
        <RecentProviders />
      </div>
      
      <div className="mb-8">
        <RecentBookings />
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchDashboardStats}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition-colors shadow-md"
        >
          <MdRefresh size={20} /> Refresh Dashboard
        </button>
      </div>
    </div>
  );
}
