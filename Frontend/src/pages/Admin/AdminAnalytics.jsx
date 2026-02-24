import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MdBarChart, MdTrendingUp, MdTrendingDown, MdCalendarToday, MdPeople, MdAttachMoney, MdStar, MdRefresh } from 'react-icons/md';

const statusColors = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-blue-400',
  scheduled: 'bg-indigo-400',
  in_progress: 'bg-purple-400',
  provider_completed: 'bg-teal-400',
  completed: 'bg-green-400',
  disputed: 'bg-orange-400',
  cancelled: 'bg-red-400',
  declined: 'bg-red-300',
  expired: 'bg-gray-400',
};

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, bookingsRes] = await Promise.all([
        api.get('/admin/dashboard/stats/'),
        api.get('/admin/bookings/?page_size=100'),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (bookingsRes.data?.success) setBookings(bookingsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Compute booking status distribution
  const statusDistribution = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  const totalBookingsCount = bookings.length;

  // Compute revenue by status
  const revenueByStatus = bookings.reduce((acc, b) => {
    const price = Number(b.total_price || 0);
    acc[b.status] = (acc[b.status] || 0) + price;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-semibold mb-4">{error}</p>
        <button onClick={fetchAnalytics} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Platform performance and user insights</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors shadow-sm"
        >
          <MdRefresh size={20} /> Refresh
        </button>
      </div>

      {stats && (
        <>
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MetricCard
              icon={MdPeople}
              label="Total Users"
              value={stats.total_users}
              growth={stats.users_growth}
              color="blue"
            />
            <MetricCard
              icon={MdCalendarToday}
              label="Total Bookings"
              value={stats.total_bookings}
              growth={stats.bookings_growth}
              color="orange"
            />
            <MetricCard
              icon={MdAttachMoney}
              label="Revenue"
              value={`Rs. ${Number(stats.total_revenue).toLocaleString()}`}
              growth={stats.revenue_growth}
              color="green"
            />
            <MetricCard
              icon={MdStar}
              label="Avg Rating"
              value={stats.average_rating}
              color="yellow"
            />
          </div>

          {/* User Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">User Breakdown</h2>
              <div className="space-y-4">
                <BarRow label="Customers" value={stats.active_customers} total={stats.total_users} color="bg-blue-500" />
                <BarRow label="Providers" value={stats.active_providers} total={stats.total_users} color="bg-green-500" />
                <BarRow label="Pending Verification" value={stats.pending_verification} total={stats.total_users} color="bg-yellow-500" />
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.active_customers}</p>
                  <p className="text-xs text-gray-500">Customers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.active_providers}</p>
                  <p className="text-xs text-gray-500">Providers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_verification}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
            </div>

            {/* Booking Status Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Booking Status Distribution</h2>
              {totalBookingsCount === 0 ? (
                <p className="text-gray-500 text-center py-8">No booking data available</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(statusDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([statusKey, count]) => (
                      <div key={statusKey} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${statusColors[statusKey] || 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-700 capitalize flex-1">{statusKey.replace('_', ' ')}</span>
                        <span className="text-sm font-bold text-gray-900">{count}</span>
                        <span className="text-xs text-gray-500 w-12 text-right">
                          {((count / totalBookingsCount) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              )}
              {/* Visual bar */}
              {totalBookingsCount > 0 && (
                <div className="flex rounded-full overflow-hidden h-4 mt-5">
                  {Object.entries(statusDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([statusKey, count]) => (
                      <div
                        key={statusKey}
                        className={`${statusColors[statusKey] || 'bg-gray-300'}`}
                        style={{ width: `${(count / totalBookingsCount) * 100}%` }}
                        title={`${statusKey}: ${count}`}
                      ></div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Revenue Breakdown + Completion Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue by Status</h2>
              <div className="space-y-3">
                {Object.entries(revenueByStatus)
                  .filter(([, amount]) => amount > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([statusKey, amount]) => (
                    <div key={statusKey} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusColors[statusKey] || 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-700 capitalize">{statusKey.replace('_', ' ')}</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">Rs. {Number(amount).toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Platform Health</h2>
              <div className="grid grid-cols-2 gap-4">
                <HealthCard
                  label="Completion Rate"
                  value={stats.total_bookings > 0 ? `${((stats.completed_bookings / stats.total_bookings) * 100).toFixed(1)}%` : '—'}
                  description={`${stats.completed_bookings} / ${stats.total_bookings} bookings`}
                  color="green"
                />
                <HealthCard
                  label="Provider Growth"
                  value={`${stats.providers_growth >= 0 ? '+' : ''}${stats.providers_growth.toFixed(1)}%`}
                  description="vs last month"
                  color={stats.providers_growth >= 0 ? 'green' : 'red'}
                />
                <HealthCard
                  label="Booking Growth"
                  value={`${stats.bookings_growth >= 0 ? '+' : ''}${stats.bookings_growth.toFixed(1)}%`}
                  description="vs last month"
                  color={stats.bookings_growth >= 0 ? 'green' : 'red'}
                />
                <HealthCard
                  label="Revenue Growth"
                  value={`${stats.revenue_growth >= 0 ? '+' : ''}${stats.revenue_growth.toFixed(1)}%`}
                  description="vs last month"
                  color={stats.revenue_growth >= 0 ? 'green' : 'red'}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, growth, color }) {
  const colorMap = {
    blue: 'from-blue-50 to-blue-100/50 border-blue-200',
    green: 'from-green-50 to-green-100/50 border-green-200',
    orange: 'from-orange-50 to-orange-100/50 border-orange-200',
    yellow: 'from-yellow-50 to-yellow-100/50 border-yellow-200',
  };
  const iconColorMap = {
    blue: 'bg-blue-500', green: 'bg-green-500', orange: 'bg-orange-500', yellow: 'bg-yellow-500',
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color] || colorMap.green} rounded-xl p-5 border`}>
      <div className={`${iconColorMap[color]} text-white p-2.5 rounded-lg w-fit mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {growth !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {growth >= 0 ? <MdTrendingUp size={14} /> : <MdTrendingDown size={14} />}
          {Math.abs(growth).toFixed(1)}% from last month
        </div>
      )}
    </div>
  );
}

function BarRow({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div className={`${color} rounded-full h-2.5 transition-all`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

function HealthCard({ label, value, description, color }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <p className={`text-2xl font-bold ${color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}
