import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MdCheckCircle, MdCancel, MdSchedule, MdSearch, MdRefresh, MdVisibility, MdCalendarToday, MdLocationOn, MdPhone, MdChevronLeft, MdChevronRight } from 'react-icons/md';

const statusStyles = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  scheduled: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
  declined: { bg: 'bg-red-100', text: 'text-red-800' },
  in_progress: { bg: 'bg-purple-100', text: 'text-purple-800' },
  provider_completed: { bg: 'bg-teal-100', text: 'text-teal-800' },
  disputed: { bg: 'bg-orange-100', text: 'text-orange-800' },
  expired: { bg: 'bg-gray-200', text: 'text-gray-700' },
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      const response = await api.get(`/admin/bookings/?${params}`);
      
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setBookings(response.data.data);
        setTotalPages(response.data.total_pages || 1);
        setTotalCount(response.data.count || response.data.data.length);
        setError(null);
      } else {
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
      // Also refresh modal data if open
      if (selectedBooking?.id === bookingId) {
        setIsModalOpen(false);
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      alert(`Failed to ${action} booking`);
    } finally {
      setActionLoading(null);
    }
  };

  const openDetailModal = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Booking Management</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Manage and monitor all bookings on the platform</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-1">
            <MdSearch className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by customer, provider, service..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="provider_completed">Provider Completed</option>
            <option value="completed">Completed</option>
            <option value="disputed">Disputed</option>
            <option value="cancelled">Cancelled</option>
            <option value="declined">Declined</option>
            <option value="expired">Expired</option>
          </select>

          {/* Count display */}
          <div className="flex items-center justify-center text-sm text-gray-600">
            {!loading && <span>{totalCount} booking{totalCount !== 1 ? 's' : ''} found</span>}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchBookings()}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors shadow-sm"
          >
            <MdRefresh size={20} /> Refresh
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 text-center">
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
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <MdCalendarToday className="text-gray-300 text-6xl mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No bookings found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
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
                      <td className="px-6 py-4 text-gray-600 text-sm">{booking.customer_name || '—'}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{booking.provider_name || '—'}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{booking.service_title || 'N/A'}</td>
                      <td className="px-6 py-4 font-bold text-green-600">Rs. {Number(booking.total_price || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(booking.booking_date)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[booking.status]?.bg || 'bg-gray-100'} ${statusStyles[booking.status]?.text || 'text-gray-700'}`}>
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
                          {/* View Detail */}
                          <button
                            onClick={() => openDetailModal(booking)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all shadow-sm"
                          >
                            <MdVisibility size={14} className="inline mr-1" />View
                          </button>
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(booking.id, 'approve')}
                                disabled={actionLoading === `${booking.id}-approve`}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 hover:bg-green-200 text-green-700 transition-all shadow-sm"
                              >
                                {actionLoading === `${booking.id}-approve` ? '...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleAction(booking.id, 'cancel')}
                                disabled={actionLoading === `${booking.id}-cancel`}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 transition-all shadow-sm"
                              >
                                {actionLoading === `${booking.id}-cancel` ? '...' : 'Cancel'}
                              </button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleAction(booking.id, 'cancel')}
                              disabled={actionLoading === `${booking.id}-cancel`}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 transition-all shadow-sm"
                            >
                              {actionLoading === `${booking.id}-cancel` ? '...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <MdChevronLeft size={18} /> Previous
                </button>
                {/* Page number buttons */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        page === pageNum
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next <MdChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Booking Detail Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-1">Booking #{selectedBooking.id}</h3>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold mb-5 ${statusStyles[selectedBooking.status]?.bg || 'bg-gray-100'} ${statusStyles[selectedBooking.status]?.text || 'text-gray-700'}`}>
              {selectedBooking.status_display}
            </span>

            <div className="space-y-4">
              {/* Service */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Service</label>
                <p className="text-gray-900 font-semibold">{selectedBooking.service_title || 'N/A'}</p>
              </div>

              {/* Customer & Provider */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Customer</label>
                  <p className="text-gray-900 font-medium">{selectedBooking.customer_name || '—'}</p>
                  <p className="text-xs text-gray-500">{selectedBooking.customer_email}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Provider</label>
                  <p className="text-gray-900 font-medium">{selectedBooking.provider_name || '—'}</p>
                  <p className="text-xs text-gray-500">{selectedBooking.provider_email}</p>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Price</label>
                <p className="text-xl font-bold text-green-600">Rs. {Number(selectedBooking.total_price || 0).toLocaleString()}</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <MdCalendarToday className="text-gray-400 mt-0.5" size={16} />
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Preferred Date</label>
                    <p className="text-gray-800 text-sm">{formatDate(selectedBooking.preferred_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MdCalendarToday className="text-gray-400 mt-0.5" size={16} />
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Scheduled Date</label>
                    <p className="text-gray-800 text-sm">{formatDate(selectedBooking.scheduled_date)}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              {selectedBooking.service_address && (
                <div className="flex items-start gap-2">
                  <MdLocationOn className="text-gray-400 mt-0.5" size={16} />
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Service Location</label>
                    <p className="text-gray-800 text-sm">{selectedBooking.service_address}{selectedBooking.service_city ? `, ${selectedBooking.service_city}` : ''}</p>
                  </div>
                </div>
              )}

              {/* Phone */}
              {selectedBooking.customer_phone && (
                <div className="flex items-start gap-2">
                  <MdPhone className="text-gray-400 mt-0.5" size={16} />
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Customer Phone</label>
                    <p className="text-gray-800 text-sm">{selectedBooking.customer_phone}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedBooking.description && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                  <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3">{selectedBooking.description}</p>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Created: {formatDate(selectedBooking.created_at)}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
                Close
              </button>
              {selectedBooking.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleAction(selectedBooking.id, 'approve')}
                    disabled={actionLoading === `${selectedBooking.id}-approve`}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                  >
                    {actionLoading === `${selectedBooking.id}-approve` ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleAction(selectedBooking.id, 'cancel')}
                    disabled={actionLoading === `${selectedBooking.id}-cancel`}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    {actionLoading === `${selectedBooking.id}-cancel` ? 'Cancelling...' : 'Cancel'}
                  </button>
                </>
              )}
              {selectedBooking.status === 'confirmed' && (
                <button
                  onClick={() => handleAction(selectedBooking.id, 'cancel')}
                  disabled={actionLoading === `${selectedBooking.id}-cancel`}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  {actionLoading === `${selectedBooking.id}-cancel` ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
