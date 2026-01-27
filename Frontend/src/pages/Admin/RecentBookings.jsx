import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { MdCheckCircle, MdSchedule, MdArrowForward, MdCalendarToday } from 'react-icons/md';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-300'
};

export default function RecentBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentBookings();
  }, []);

  const fetchRecentBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/recent-bookings/?limit=5');
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching recent bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-linear-to-br from-green-50 to-emerald-50">
        <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
        <Link to="/admin/bookings" className="flex items-center gap-1.5 text-green-600 hover:text-green-700 font-semibold text-sm transition-colors">
          View All <MdArrowForward size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-8 text-center">
          <MdCalendarToday className="text-gray-300 text-5xl mx-auto mb-3" />
          <p className="text-gray-500">No bookings yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {bookings.map((booking) => (
            <div key={booking.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm mb-1.5">Booking #{booking.id}</p>
                  <p className="text-xs text-gray-600 flex items-center gap-1.5">
                    <span className="font-medium text-gray-800">{booking.customer_name}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-gray-800">{booking.provider_name}</span>
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm ${statusStyles[booking.status] || statusStyles.pending}`}>
                  {booking.status === 'completed' ? <MdCheckCircle size={12} /> : <MdSchedule size={12} />}
                  {booking.status_display}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-green-600">
                  Rs. {Number(booking.total_price).toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
