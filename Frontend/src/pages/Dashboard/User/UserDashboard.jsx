import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { FaRegCalendarCheck } from "react-icons/fa";
import { HiOutlineWrenchScrewdriver } from "react-icons/hi2";
import { AiOutlineDollarCircle } from "react-icons/ai";
import { LiaPiggyBankSolid } from "react-icons/lia";
import { FiPlusCircle } from "react-icons/fi";
import { MdHeadsetMic } from "react-icons/md";
import bookingsService from "../../../services/bookingsService";
import { useUserProfile } from "../../../context/UserProfileContext";

export default function DashboardPage() {
  const [activeMenuKey, setActiveMenuKey] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userProfile: userData } = useUserProfile();
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalSpent: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);

  // Fetch booking stats on mount
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsResp, bookingsResp] = await Promise.all([
          bookingsService.getUserDashboardStats(),
          bookingsService.getMyBookings({ page: 1, page_size: 5 }),
        ]);

        setStats({
          totalBookings: statsResp.total_bookings ?? statsResp.totalBookings ?? 0,
          activeJobs: statsResp.active_jobs ?? statsResp.activeJobs ?? 0,
          completedJobs: statsResp.completed_jobs ?? statsResp.completedJobs ?? 0,
          totalSpent: statsResp.total_spent ?? statsResp.totalSpent ?? 0,
        });

        const list = bookingsResp?.results ?? bookingsResp ?? [];
        setRecentBookings(Array.isArray(list) ? list.slice(0, 3) : []);
      } catch (err) {
        console.error("Error fetching booking stats:", err);
        setError(err.error || "Failed to load booking stats");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get status color and text
  const getStatusStyles = (status) => {
    const statusMap = {
      pending: { text: 'text-orange-600', bg: 'bg-orange-100', label: 'Pending' },
      confirmed: { text: 'text-blue-600', bg: 'bg-blue-100', label: 'Confirmed' },
      scheduled: { text: 'text-purple-600', bg: 'bg-purple-100', label: 'Scheduled' },
      in_progress: { text: 'text-yellow-600', bg: 'bg-yellow-100', label: 'In Progress' },
      completed: { text: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
      cancelled: { text: 'text-red-600', bg: 'bg-red-100', label: 'Cancelled' },
      declined: { text: 'text-red-600', bg: 'bg-red-100', label: 'Declined' },
    };
    return statusMap[status] || { text: 'text-gray-600', bg: 'bg-gray-100', label: status };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <DashboardLayout activeMenuKey={activeMenuKey} onMenuChange={setActiveMenuKey} userData={userData}>
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenuKey={activeMenuKey} onMenuChange={setActiveMenuKey} userData={userData}>
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's what's happening with your services.
        </p>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {[
          {
            title: "Total Bookings",
            value: stats.totalBookings,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            icon: <FaRegCalendarCheck className="h-6 w-6" />
          },
          {
            title: "Active Jobs",
            value: stats.activeJobs,
            bgColor: "bg-yellow-50",
            iconColor: "text-yellow-500",
            icon: <HiOutlineWrenchScrewdriver className="h-6 w-6" />
          },
          {
            title: "Completed",
            value: stats.completedJobs,
            bgColor: "bg-green-50",
            iconColor: "text-green-600",
            icon: <AiOutlineDollarCircle className="h-6 w-6" />
          },
          {
            title: "Total Spent",
            value: formatCurrency(stats.totalSpent),
            bgColor: "bg-purple-50",
            iconColor: "text-purple-400",
            icon: <LiaPiggyBankSolid className="h-6 w-6" />
          },
        ].map(({ title, value, bgColor, iconColor, icon }) => (
          <div
            key={title}
            className={`flex items-center justify-between rounded-lg p-5 shadow-sm bg-white`}
          >
            <div>
              <p className="text-gray-500 text-sm">{title}</p>
              <p className="font-semibold text-xl">{value}</p>
            </div>
            <div className={`${bgColor} p-3 rounded-lg flex items-center justify-center`}>
              {React.cloneElement(icon, { className: `h-6 w-6 ${iconColor}` })}
            </div>
          </div>
        ))}
      </section>

      {/* Recent Bookings & Payment Overview */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
          {recentBookings.length > 0 ? (
            <ul className="space-y-4">
              {recentBookings.map((booking) => {
                const statusStyles = getStatusStyles(booking.status);
                return (
                  <li
                    key={booking.id}
                    className={`flex items-center justify-between rounded-lg p-3 bg-gray-50`}
                  >
                    <div className="flex items-center gap-3 grow">
                      <div>
                        <p className="font-semibold">{booking.service_title}</p>
                        <p className="text-gray-500 text-sm">{formatDate(booking.scheduled_date || booking.preferred_date)}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold rounded-full px-3 py-1 ${statusStyles.text} ${statusStyles.bg} bg-opacity-40 whitespace-nowrap ml-2`}
                    >
                      {statusStyles.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-6">No bookings yet</p>
          )}
        </div>

        {/* Booking Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Booking Summary</h2>
          <ul className="space-y-3">
            {[
              { label: "Total Bookings", value: stats.totalBookings, color: "text-blue-600" },
              { label: "Active Jobs", value: stats.activeJobs, color: "text-yellow-600" },
              { label: "Completed", value: stats.completedJobs, color: "text-green-600" },
              { label: "Total Spent", value: formatCurrency(stats.totalSpent), color: "text-purple-600" },
            ].map(({ label, value, color }) => (
              <li key={label} className="flex justify-between py-3 border border-gray-300 rounded-lg px-4">
                <div>
                  <p className="font-semibold text-gray-700">{label}</p>
                </div>
                <div className="flex flex-col items-end">
                  <p className={`font-semibold ${color}`}>{value}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap gap-4 max-w-3xl">
        <Link to="/services" className="grow sm:flex-auto bg-green-600 text-white rounded-md px-6 py-3 font-semibold hover:bg-green-700 transition cursor-pointer">
          <FiPlusCircle className="inline-block mr-2 h-5 w-5" />
          Book New Service
        </Link>
        <Link to="/user/my-bookings" className="grow sm:flex-auto border border-orange-400 text-orange-500 rounded-md px-6 py-3 font-semibold hover:bg-orange-50 transition cursor-pointer">
          <FaRegCalendarCheck className="inline-block mr-2 h-5 w-5" />
          View Bookings
        </Link>
        <button className="grow sm:flex-auto border border-blue-500 text-blue-600 rounded-md px-6 py-3 font-semibold hover:bg-blue-50 transition cursor-pointer">
          <MdHeadsetMic className="inline-block mr-2 h-5 w-5" />
          Contact Support
        </button>
      </section>
    </DashboardLayout>
  );
}
