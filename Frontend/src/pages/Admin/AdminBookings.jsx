import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MdCheckCircle, MdCancel, MdSchedule, MdSearch, MdRefresh } from 'react-icons/md';

const statusStyles = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', badge: 'bg-yellow-50 border-yellow-200' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', badge: 'bg-blue-50 border-blue-200' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', badge: 'bg-green-50 border-green-200' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', badge: 'bg-red-50 border-red-200' },
  in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', badge: 'bg-purple-50 border-purple-200' }
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [page, search, filterStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      params.append('page', page);

      console.log('Fetching bookings from:', `/admin/bookings/?${params}`);
      const response = await api.get(`/admin/bookings/?${params}`);
      console.log('Bookings response:', response.data);
      
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setBookings(response.data.data);
        setError(null);
      } else {
        console.log('Response format issue:', response.data);
        setBookings([]);
        setError('No booking data available');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err.response?.data || err.message);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (bookingId, action) => {
    try {
      setActionLoading(`${bookingId}-${action}`);
      await api.post(`/admin/bookings/${bookingId}/${action}/`);
      fetchBookings();
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      alert(`Failed to ${action} booking`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Booking Management</h1>
        <p className="text-gray-600 mt-2">Manage and monitor all bookings on the platform</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <MdSearch className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by customer or service..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
          </div>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Placeholder */}
          <div></div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchBookings()}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <MdRefresh size={20} /> Refresh
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 text-center">
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={fetchBookings}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-600">No bookings found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Service</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">#{booking.id}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{booking.customer_name}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{booking.provider_name}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{booking.service_title || 'N/A'}</td>
                  <td className="px-6 py-4 font-bold text-green-600">Rs. {Number(booking.total_price).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{new Date(booking.booking_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold border ${statusStyles[booking.status]?.bg || statusStyles.pending.bg} ${statusStyles[booking.status]?.text || statusStyles.pending.text}`}>
                      {booking.status === 'completed' ? (
                        <MdCheckCircle size={14} />
                      ) : booking.status === 'cancelled' ? (
                        <MdCancel size={14} />
                      ) : (
                        <MdSchedule size={14} />
                      )}
                      {booking.status_display}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(booking.id, 'approve')}
                            disabled={actionLoading === `${booking.id}-approve`}
                            className="px-3 py-1 rounded text-xs font-semibold bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                          >
                            {actionLoading === `${booking.id}-approve` ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleAction(booking.id, 'cancel')}
                            disabled={actionLoading === `${booking.id}-cancel`}
                            className="px-3 py-1 rounded text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                          >
                            {actionLoading === `${booking.id}-cancel` ? '...' : 'Cancel'}
                          </button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleAction(booking.id, 'cancel')}
                          disabled={actionLoading === `${booking.id}-cancel`}
                          className="px-3 py-1 rounded text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                        >
                          {actionLoading === `${booking.id}-cancel` ? '...' : 'Cancel'}
                        </button>
                      )}
                      {(booking.status === 'completed' || booking.status === 'cancelled') && (
                        <span className="text-xs text-gray-500">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
