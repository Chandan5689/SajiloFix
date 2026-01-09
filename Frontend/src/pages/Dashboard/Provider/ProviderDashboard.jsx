import React, { useState, useEffect } from "react";
import ProviderDashboardLayout from "../../../layouts/ProviderDashboardLayout";
import {
  AiOutlineCalendar,
  AiOutlineDollarCircle,
  AiOutlineStar,
  AiOutlineClockCircle,
  AiOutlinePlusCircle,
  AiOutlineEdit,
  AiOutlineAreaChart,
} from "react-icons/ai";
import { BiCog } from "react-icons/bi";
import { Link } from "react-router-dom";
import bookingsService from "../../../services/bookingsService";
import { useUserProfile } from "../../../context/UserProfileContext";

export default function ProviderDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalEarnings: 0,
    activeJobs: 0,
    averageRating: 0,
    providerName: 'Service Provider',
    specialization: 'Service Provider',
  });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const { userProfile } = useUserProfile();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats, bookings, and reviews in parallel (lightweight)
      const [statsResp, bookingsResp, reviewsResp] = await Promise.all([
        bookingsService.getProviderDashboardStats(),
        bookingsService.getProviderBookings({ page: 1, page_size: 5 }),
        bookingsService.getProviderReviews({ page: 1, page_size: 5 }),
      ]);

      const totalJobs = statsResp.total_jobs ?? 0;
      const totalEarnings = statsResp.total_earnings ?? 0;
      const activeJobs = statsResp.active_jobs ?? 0;
      const averageRating = statsResp.average_rating ?? 0;

      // Get provider name and specialization from user profile context
      const providerName = userProfile?.full_name ||
        (userProfile?.first_name || userProfile?.last_name
          ? [userProfile.first_name, userProfile.middle_name, userProfile.last_name].filter(Boolean).join(' ')
          : userProfile?.email?.split('@')[0] || 'Service Provider');

      const specialization = userProfile?.user_specializations?.map(s => s.specialization?.name).join(", ")
        || 'Service Provider';

      const profilePicture = userProfile?.profile_picture || null;

      setStats({
        totalJobs,
        totalEarnings,
        activeJobs,
        averageRating: parseFloat(averageRating),
        providerName,
        specialization,
        profilePicture,
      });

      // Get upcoming bookings (next 3 confirmed/scheduled)
      const bookingsList = bookingsResp?.results ?? bookingsResp ?? [];
      const upcoming = bookingsList
        .filter(b => ['pending', 'confirmed', 'scheduled'].includes(b.status))
        .sort((a, b) => new Date(a.scheduled_date || a.preferred_date) - new Date(b.scheduled_date || b.preferred_date))
        .slice(0, 3);
      setUpcomingBookings(upcoming);

      // Get recent reviews (latest 3)
      const reviewsList = reviewsResp?.results ?? reviewsResp ?? [];
      const recent = reviewsList
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);
      setRecentReviews(recent);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.error || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-700",
      confirmed: "bg-green-100 text-green-700",
      scheduled: "bg-blue-100 text-blue-700",
      in_progress: "bg-purple-100 text-purple-700",
    };
    return colorMap[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <ProviderDashboardLayout activeMenuKey={activeMenu} onMenuChange={setActiveMenu}>
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </ProviderDashboardLayout>
    );
  }

  return (
    <ProviderDashboardLayout 
      activeMenuKey={activeMenu} 
      onMenuChange={setActiveMenu}
      profileData={{
        name: stats.providerName || 'Service Provider',
        specialization: stats.specialization || 'Service Provider',
        rating: stats.averageRating,
        reviewCount: recentReviews.length,
        profilePicture: stats.profilePicture,
      }}
    >
      {/* Dashboard Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your services and track your performance</p>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-8">
        {[
          {
            title: "Completed Jobs",
            value: stats.totalJobs,
            icon: <AiOutlineCalendar className="h-7 w-7 text-blue-600" />,
            bgColor: "bg-blue-100",
          },
          {
            title: "Total Earnings",
            value: formatCurrency(stats.totalEarnings),
            icon: <AiOutlineDollarCircle className="h-7 w-7 text-green-600" />,
            bgColor: "bg-green-100",
          },
          {
            title: "Active Jobs",
            value: stats.activeJobs,
            icon: <AiOutlineClockCircle className="h-7 w-7 text-purple-600" />,
            bgColor: "bg-purple-100",
          },
          {
            title: "Average Rating",
            value: stats.averageRating,
            icon: <AiOutlineStar className="h-7 w-7 text-yellow-600" />,
            bgColor: "bg-yellow-100",
          },
        ].map(({ title, value, icon, bgColor }) => (
          <div key={title} className="bg-white rounded-xl p-6 flex items-center space-x-4 shadow-sm">
            <div className={`p-3 ${bgColor} rounded-lg`}>{icon}</div>
            <div>
              <p className="font-semibold text-gray-600">{title}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Main columns */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-10">
        {/* Upcoming Bookings */}
        <div className="bg-white rounded-xl p-6 shadow-sm md:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
            <Link to="/provider/my-bookings" className="text-sm bg-blue-600 px-3 py-2 rounded-lg text-white font-semibold hover:bg-blue-700 cursor-pointer transition">
              View All
            </Link>
          </div>

          <div className="space-y-5">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 last:border-0">
                  <div>
                    <h3 className="font-semibold text-gray-900">{booking.service_title}</h3>
                    <p className="text-gray-600 text-sm">Customer: {booking.customer_name}</p>
                    <p className="text-gray-600 text-sm">
                      Date: {formatDate(booking.scheduled_date || booking.preferred_date)}
                    </p>
                    <p className="text-gray-600 text-sm truncate max-w-xs">{booking.service_address}</p>
                    <div className={`py-1 mt-2 px-3 w-fit rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className="font-bold text-gray-900">
                      {formatCurrency(booking.quoted_price || booking.final_price || 0)}
                    </span>
                    <Link
                      to="/provider/my-bookings"
                      className="border-2 border-green-600 text-green-600 rounded-md px-4 py-2 text-xs font-semibold hover:bg-green-600 hover:text-white transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-6">No upcoming bookings</p>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
            <Link
              to="/provider/reviews"
              className="text-sm border-blue-600 border-2 px-3 py-2 rounded-lg text-blue-600 font-semibold hover:bg-blue-600 hover:text-white cursor-pointer transition"
            >
              View All
            </Link>
          </div>

          <div className="space-y-6">
            {recentReviews.length > 0 ? (
              recentReviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <p className="font-semibold">{review.customer_name}</p>
                  <p className="text-sm mb-1">&quot;{review.comment}&quot;</p>
                  <div className="flex justify-between items-center text-yellow-400 mb-1">
                    <div>
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          className="inline h-4 w-4"
                          fill={i < review.rating ? "currentColor" : "none"}
                          stroke={i < review.rating ? "none" : "currentColor"}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.384 2.456a1 1 0 00-.364 1.118l1.287 3.974c.3.92-.755 1.688-1.54 1.118L10 13.347l-3.384 2.456c-.784.57-1.838-.197-1.539-1.118l1.287-3.974a1 1 0 00-.364-1.118L3.616 9.4c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.973z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500">{review.service_title}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-6">No reviews yet</p>
            )}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap gap-4 max-w-4xl mt-10">
        {[
          { label: "Update Availability", icon: <BiCog size={20} />, bgColor: "bg-blue-600", hover: "hover:bg-blue-700", link: "/provider/availability" },
          { label: "Add Service", icon: <AiOutlinePlusCircle size={20} />, bgColor: "bg-green-600", hover: "hover:bg-green-700", link: "/provider/my-services" },
          { label: "Edit Profile", icon: <AiOutlineEdit size={20} />, bgColor: "bg-blue-600", hover: "hover:bg-blue-700", link: "/provider/profile" },
          { label: "View Analytics", icon: <AiOutlineAreaChart size={20} />, bgColor: "bg-yellow-500", hover: "hover:bg-yellow-600", link: "/provider/my-bookings" },
        ].map(({ label, icon, bgColor, hover, link }) => (
          <Link
            key={label}
            to={link}
            className={`flex items-center gap-2 ${bgColor} text-white px-6 py-3 rounded-md font-semibold ${hover} cursor-pointer transition`}
          >
            {icon}
            {label}
          </Link>
        ))}
      </section>
    </ProviderDashboardLayout>
  );
}
