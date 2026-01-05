import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useUserProfile } from "../context/UserProfileContext";
import {
  AiOutlineDashboard,
  AiOutlineDollarCircle,
  AiOutlineCalendar,
  AiOutlineStar,
  AiOutlineClockCircle,
  AiOutlinePhone,
} from "react-icons/ai";
import { BiBookOpen, BiMessageDetail, BiCog, BiLogOut } from "react-icons/bi";
import { FaUserCircle, FaRegCalendarCheck } from "react-icons/fa";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: <AiOutlineDashboard size={20} />, link: "/provider/dashboard" },
  { key: "my-bookings", label: "My Bookings", icon: <BiBookOpen size={20} />, link: "/provider/my-bookings" },
  { key: "my-services", label: "My Services", icon: <AiOutlineCalendar size={20} />, link: "/provider/my-services" },
  { key: "earnings", label: "Earnings", icon: <AiOutlineDollarCircle size={20} />, link: "/provider/earnings" },
  { key: "reviews", label: "Reviews", icon: <AiOutlineStar size={20} />, link: "/provider/reviews" },
  { key: "availability", label: "Availability", icon: <FaRegCalendarCheck size={20} />, link: "/provider/availability" },
  { key: "messages", label: "Messages", icon: <BiMessageDetail size={20} />, link: "#" },
  { key: "profile", label: "Profile", icon: <FaUserCircle size={20} />, link: "/provider/profile" },
  { key: "logout", label: "Logout", icon: <BiLogOut size={20} />, isLogout: true },
];

export default function ProviderDashboardLayout({ activeMenuKey, onMenuChange, children, profileData = null }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { userProfile } = useUserProfile();
  const [defaultProfileData, setDefaultProfileData] = useState({
    name: "Service Provider",
    specialization: "Service Provider",
    rating: 0,
    reviewCount: 0,
  });

  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  }, [sidebarOpen]);

  // Generate initials from name
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Build profile data from context (cached) or fallback to prop or default
  const contextProfile = userProfile
    ? {
        name:
          userProfile.first_name && userProfile.last_name
            ? `${userProfile.first_name} ${userProfile.last_name}`
            : userProfile.email?.split("@")[0] || "Service Provider",
        specialization:
          userProfile.user_specializations?.map((s) => s.specialization?.name).join(", ") || "Service Provider",
        rating: profileData?.rating || 0,
        reviewCount: profileData?.reviewCount || 0,
        profilePicture: userProfile.profile_picture || null,
      }
    : null;

  const displayProfile = contextProfile || profileData || defaultProfileData;

  // Handle logout for providers
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-100 bg-opacity-30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 bg-white border-r border-gray-200 z-50
            transform transition-transform duration-300 ease-in-out
            md:static md:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:flex md:flex-col
            ${sidebarCollapsed ? "w-20" : "w-64"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 truncate">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg select-none overflow-hidden">
              {displayProfile.profilePicture ? (
                <img
                  src={displayProfile.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(displayProfile.name)
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <p className="font-semibold truncate">{displayProfile.name}</p>
                <p className="text-sm text-gray-500 truncate">{displayProfile.specialization}</p>
                <div className="flex items-center text-yellow-400 space-x-1 mt-1">
                  <AiOutlineStar size={16} />
                  <span className="font-semibold text-gray-700">{displayProfile.rating || "N/A"}</span>
                  <span className="text-gray-500">({displayProfile.reviewCount})</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {sidebarItems.map(({ key, label, icon, isLogout }) => {
            const active = activeMenuKey === key;

            if (isLogout) {
              return (
                <button
                  key={key}
                  onClick={handleLogout}
                  title={sidebarCollapsed ? label : undefined}
                  className={`flex items-center gap-4 rounded-md px-4 py-3 select-none truncate transition-colors text-red-600 hover:bg-red-100 ${
                    sidebarCollapsed ? "justify-center px-0" : "justify-start"
                  }`}
                >
                  {React.cloneElement(icon, { className: `h-6 w-6 ` })}
                  {!sidebarCollapsed && <span>{label}</span>}
                </button>
              );
            }

            return (
              <Link
                key={key}
                to={sidebarItems.find(item => item.key === key).link}
                onClick={() => {
                  onMenuChange(key);
                  setSidebarOpen(false);
                }}
                title={sidebarCollapsed ? label : undefined}
                className={`flex items-center gap-4 rounded-md px-4 py-3 select-none truncate transition-colors
                  ${
                    active
                      ? "bg-green-600 text-white font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                  ${sidebarCollapsed ? "justify-center px-0" : "justify-start"}`}
              >
                {React.cloneElement(icon, { className: `h-6 w-6 ` })}
                {!sidebarCollapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content container */}
      <div className="flex flex-col flex-1 min-h-screen ">
        {/* Mobile header bar with hamburger */}
        <header className="md:hidden flex items-center px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="p-2 text-gray-700 hover:text-gray-900 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

        </header>

        {/* Place dashboard page content here */}
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
