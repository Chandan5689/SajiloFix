import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useUserProfile } from '../context/UserProfileContext';
import { MdDashboard, MdPeople, MdCalendarToday, MdAnalytics, MdSettings, MdLogout, MdMenu, MdClose, MdVerifiedUser } from 'react-icons/md';

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useSupabaseAuth();
  const { userProfile } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();

  // Get admin display name and initials
  const adminName = userProfile?.full_name || 
    (userProfile?.first_name || userProfile?.last_name 
      ? [userProfile.first_name, userProfile.middle_name, userProfile.last_name].filter(Boolean).join(' ')
      : userProfile?.email?.split('@')[0] || 'Admin');

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const adminInitials = getInitials(adminName);

  // Handle logout
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', icon: MdDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/customers', icon: MdPeople, label: 'Customers' },
    { path: '/admin/providers', icon: MdPeople, label: 'Providers' },
    { path: '/admin/bookings', icon: MdCalendarToday, label: 'Bookings' },
    { path: '/admin/analytics', icon: MdAnalytics, label: 'Analytics' },
    { path: '/admin/settings', icon: MdSettings, label: 'Settings' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-6 left-6 z-50 bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 shadow-lg"
      >
        {isOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-30 md:hidden z-40"
        />
      )}

      {/* Sidebar */}
      <div className={`fixed md:static left-0 top-0 h-full w-60 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Admin Profile Section */}
        <div className="p-6 border-b border-gray-200 bg-linear-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            {userProfile?.profile_picture ? (
              <img
                src={userProfile.profile_picture}
                alt={adminName}
                className="w-12 h-12 rounded-full object-cover border-2 border-green-600"
              />
            ) : (
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                {adminInitials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="font-semibold text-gray-900 truncate">{adminName}</h3>
                <MdVerifiedUser className="text-green-600 shrink-0" size={16} />
              </div>
              <p className="text-sm text-gray-600">Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? 'bg-green-600 text-white font-semibold shadow-sm'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-semibold"
          >
            <MdLogout size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
