import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MdOutlineDashboard } from "react-icons/md";
import { FiPlusCircle } from "react-icons/fi";
import { IoCalendarClearOutline, IoWalletOutline } from "react-icons/io5";
import { FiUserPlus } from "react-icons/fi";
import { BiLogOut } from "react-icons/bi";

const sidebarItems = [
  { label: "Dashboard", icon: <MdOutlineDashboard  />, key: "dashboard", link:"/dashboard" },
  { label: "Book New Service", icon: <FiPlusCircle  />, key: "book", link:"/services" },
  { label: "My Bookings", icon: <IoCalendarClearOutline  />, key: "my-bookings", link:"/user/my-bookings" },
  { label: "My Profile", icon: <FiUserPlus  />, key: "my-profile", link:"/user/my-profile" },
  { label: "Payments", icon: <IoWalletOutline  />, key: "my-payments", link:"/user/my-payments" }, 
  { label: "Logout", icon: <BiLogOut  />, key: "logout", isLogout: true },
];

export default function DashboardLayout({
  activeMenuKey,
  onMenuChange,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile slide-in
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse

  // Prevent scrolling when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-50 bg-opacity-30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-12 left-0 bottom-0 bg-white border-r border-gray-200 z-40
          transform transition-transform duration-300 ease-in-out
          md:static md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:flex md:flex-col
          ${sidebarCollapsed ? "w-20" : "w-64"}`}
      >
        {/* Sidebar Header (User Info + Collapse toggle on desktop) */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              JD
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col"> 
                <span className="font-semibold">John Doe</span>
                <span className="text-gray-500 text-sm">Customer</span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          {/* <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:inline-block p-1 hover:bg-gray-100 rounded"
            aria-label="Toggle sidebar width"
          >
            {sidebarCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7 7-7M19 19l-7-7 7-7" />
              </svg>
            )}
          </button> */}
        </div>

        {/* Menu */}
        <nav className="flex flex-col grow px-2 py-4 space-y-1 overflow-y-auto">
          {sidebarItems.map(({ label, icon, key, isLogout }) => {
            const active = activeMenuKey === key;
            return (
              <Link
                key={key}
                to={isLogout ? "/" : sidebarItems.find(item => item.key === key).link}
                onClick={() => {
                  onMenuChange(key);
                  
                  setSidebarOpen(false); // close on mobile after click
                }}
                title={sidebarCollapsed ? label : undefined}
                className={`flex items-center cursor-pointer gap-4 rounded-md px-4 py-3 select-none truncate transition-colors
                  ${
                    isLogout
                      ? "text-red-600 hover:bg-red-100"
                      : active
                      ? "bg-green-100 text-green-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                  ${sidebarCollapsed ? "justify-center px-0" : "justify-start"}
                `}
              >
                {React.cloneElement(icon, { className: `h-6 w-6 ` })}
                {!sidebarCollapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Mobile top bar */}
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
          {/* <h1 className="ml-4 text-lg font-semibold">Dashboard</h1> */}
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}


