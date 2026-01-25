import React, { useEffect, useState, useRef } from 'react';
import { FaChevronDown, FaUser, FaCog, FaQuestionCircle, FaSignOutAlt } from "react-icons/fa";
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from "../context/SupabaseAuthContext";
import { useUserProfile } from '../context/UserProfileContext';
import logosajilofix from "../assets/logosajilofix.png";

function Navbar() {
    const { isAuthenticated, user, loading: authLoading, signOut } = useSupabaseAuth();
    const { userProfile, isRegistrationComplete, userType, loading: profileLoading } = useUserProfile();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const navLinks = [
        { name: 'Services', path: '/services' },
        { name: 'How It Works', path: '/how-it-works' },
        { name: 'About Us', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    useEffect(() => {
        setIsMenuOpen(false);
        setIsDropdownOpen(false);
    }, [location]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        await signOut();
        setIsDropdownOpen(false);
        navigate('/');
    };

    const getInitials = () => {
        if (!user) return 'U';
        const name = user.name || user.email || '';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
        }
        return (name[0] || 'U').toUpperCase();
    };

    const getProfileImageUrl = () => {
        return userProfile?.profile_picture_url || null;
    };

    const getDashboardLink = () => {
        if (!isRegistrationComplete) {
            return '/register';
        }
        if (userType === 'offer') {
            return '/provider/dashboard';
        }
        return '/dashboard';
    };

    // Don't render navbar while auth is loading
    if (authLoading) {
        return null;
    }

    return (
        <header className="bg-white sticky top-0 shadow-lg z-50 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link to="/">
                            <img
                                src={logosajilofix}
                                alt="SajiloFix Logo"
                                style={{ height: '40px', cursor: 'pointer' }}
                            />
                        </Link>
                    </div>

                    <nav className="hidden md:flex space-x-8">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.name}
                                to={link.path}
                                className={`text-gray-700 hover:text-green-600 font-medium ${
                                    location.pathname === link.path ? 'text-green-600' : ''
                                }`}
                            >
                                {link.name}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center space-x-4">
                        {isAuthenticated && user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center space-x-3 text-gray-700 hover:text-green-600 cursor-pointer transition-colors"
                                >
                                    {getProfileImageUrl() ? (
                                        <img
                                            src={getProfileImageUrl()}
                                            alt="Profile"
                                            className="w-10 h-10 rounded-full object-cover border-2 border-green-600"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            {getInitials()}
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-gray-900">
                                            {userProfile?.full_name || user.name || user.email}
                                        </p>
                                        {!isRegistrationComplete ? (
                                            <p className="text-xs text-orange-600 font-semibold">
                                                ⚠️ Complete Registration
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-600">{user.email}</p>
                                        )}
                                    </div>
                                    <FaChevronDown
                                        className={`text-xs transition-transform duration-200 ${
                                            isDropdownOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50">
                                        <Link
                                            to={getDashboardLink()}
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                                        >
                                            <FaUser className="mr-3" />
                                            Dashboard
                                        </Link>
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                                        >
                                            <FaCog className="mr-3" />
                                            Profile Settings
                                        </Link>
                                        <Link
                                            to="/help-support"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                                        >
                                            <FaQuestionCircle className="mr-3" />
                                            Help & Support
                                        </Link>
                                        <hr className="my-2 border-gray-200" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <FaSignOutAlt className="mr-3" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex space-x-6">
                                <Link
                                    to="/login"
                                    className="text-gray-700 py-2 hover:text-green-600 font-medium cursor-pointer whitespace-nowrap"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-green-600 text-white px-6 py-2 font-medium hover:bg-green-700 transition-colors rounded-xl"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-100 focus:outline-none"
                        >
                            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden bg-white shadow-lg border-t border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col space-y-4 py-4">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`text-gray-700 hover:text-green-600 font-medium ${
                                        location.pathname === link.path ? 'text-green-600' : ''
                                    }`}
                                >
                                    {link.name}
                                </NavLink>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 mt-4 pt-4 pb-6">
                            {isAuthenticated && user ? (
                                <>
                                    <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                                        {getProfileImageUrl() ? (
                                            <img
                                                src={getProfileImageUrl()}
                                                alt="Profile"
                                                className="w-12 h-12 rounded-full object-cover border-2 border-green-600"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {getInitials()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {userProfile?.full_name || user.name || user.email}
                                            </p>
                                            {!isRegistrationComplete ? (
                                                <p className="text-xs text-orange-600 font-semibold">
                                                    ⚠️ Complete Registration
                                                </p>
                                            ) : (
                                                <p className="text-xs text-gray-600">{user.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    <Link
                                        to={getDashboardLink()}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center text-gray-700 hover:text-green-600 font-medium mt-4"
                                    >
                                        <FaUser className="mr-3" />
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/profile"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center text-gray-700 hover:text-green-600 font-medium mt-3"
                                    >
                                        <FaCog className="mr-3" />
                                        Profile Settings
                                    </Link>
                                    <Link
                                        to="/help-support"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center text-gray-700 hover:text-green-600 font-medium mt-3"
                                    >
                                        <FaQuestionCircle className="mr-3" />
                                        Help & Support
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center text-red-600 hover:text-red-700 font-medium mt-3"
                                    >
                                        <FaSignOutAlt className="mr-3" />
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col space-y-3">
                                    <Link
                                        to="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-gray-700 hover:text-green-600 font-medium"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="bg-green-600 text-white px-6 py-2 font-medium hover:bg-green-700 transition-colors rounded-xl text-center"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Navbar;
