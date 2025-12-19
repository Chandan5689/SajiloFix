import React, { useEffect, useState, useRef, useCallback } from 'react';
import { FaChevronDown, FaUser, FaCog, FaQuestionCircle, FaSignOutAlt } from "react-icons/fa";
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';

function Navbar() {
    const { isSignedIn, user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const { getToken } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userDetails, setUserDetails] = useState(null);
    const [registrationStatus, setRegistrationStatus] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        setIsMenuOpen(false);
        setIsDropdownOpen(false);
    }, [location]);

    // Fetch user details from Django backend
    const fetchUserDetails = useCallback(async () => {
        if (isSignedIn && user) {
            try {
                const token = await getToken();

                // Check registration status first
                const statusResp = await fetch('http://127.0.0.1:8000/api/auth/registration-status/', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (statusResp.ok) {
                    const statusData = await statusResp.json();
                    setRegistrationStatus(statusData);
                    
                    // Only fetch full user details if registration is complete
                    if (statusData.registration_completed) {
                        const meResp = await fetch('http://127.0.0.1:8000/api/auth/me/', {
                            headers: { 'Authorization': `Bearer ${token}` },
                        });
                        if (meResp.ok) {
                            const data = await meResp.json();
                            setUserDetails(data);
                        } else {
                            setUserDetails(null);
                        }
                    } else {
                        // Registration incomplete, don't call /me/ endpoint
                        setUserDetails(null);
                    }
                }
            } catch (err) {
                console.error('Error fetching user details:', err);
            }
        }
    }, [isSignedIn, user, getToken]);

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchUserDetails();
        }
    }, [isSignedIn, user, isLoaded]);

    // Listen for registration completion event to refetch user data
    useEffect(() => {
        const handleRegistrationComplete = () => {
            console.log('🔄 Registration completed - refreshing user data in Navbar');
            fetchUserDetails();
        };

        window.addEventListener('registrationComplete', handleRegistrationComplete);
        return () => {
            window.removeEventListener('registrationComplete', handleRegistrationComplete);
        };
    }, [fetchUserDetails]);

    // Close dropdown when clicking outside
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

    const navLinks = [
        { name: 'Services', path: '/services' },
        { name: 'How It Works', path: '/howitworks' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    const handleLogout = async () => {
        await signOut();
        setIsDropdownOpen(false);
        navigate('/');
    };

    const getInitials = () => {
        if (!user) return 'U';
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
    };

    const getProfileImageUrl = () => {
        return user?.imageUrl || null;
    };

    const getDashboardLink = () => {
        // If registration incomplete, route user to finish registration
        if (registrationStatus && registrationStatus.registration_completed === false) {
            return '/register';
        }
        if (userDetails?.user_type === 'offer') {
            return '/provider/dashboard';
        }
        return '/dashboard';
    };

    if (!isLoaded) {
        return null; // Or loading spinner
    }

    return (
        <div className='bg-gray-50'>
            <header className='bg-white sticky top-0 shadow-md z-50'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='flex justify-between items-center h-16'>
                        <div className='flex items-center'>
                            <Link to="/">
                                <h1 className="text-2xl font-bold text-green-600 cursor-pointer hover:text-green-700 transition-colors duration-300 font-['Pacifico,sans-serif,cursive']">
                                    SajiloFix
                                </h1>
                            </Link>
                        </div>

                        {/* Desktop navigation */}
                        <nav className='hidden md:flex space-x-8'>
                            {navLinks.map((link) => (
                                <NavLink 
                                    to={link.path} 
                                    key={link.name} 
                                    className={`text-gray-700 hover:text-green-600 font-medium cursor-pointer ${
                                        location.pathname === link.path ? 'text-green-600' : 'text-gray-700'
                                    }`}
                                >
                                    {link.name}
                                </NavLink>
                            ))}
                        </nav>

                        <div className='hidden md:flex items-center space-x-4'>
                            {isSignedIn && user ? (
                                <div className='relative' ref={dropdownRef}>
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
                                                {user.firstName} {user.lastName}
                                            </p>
                                            {registrationStatus && !registrationStatus.registration_completed ? (
                                                <p className="text-xs text-orange-600 font-semibold">
                                                    ⚠️ Complete Registration
                                                </p>
                                            ) : (
                                                <p className="text-xs text-gray-600">
                                                    {user.primaryEmailAddress?.emailAddress}
                                                </p>
                                            )}
                                        </div>
                                        <FaChevronDown 
                                            className={`text-xs transition-transform duration-200 ${
                                                isDropdownOpen ? 'rotate-180' : ''
                                            }`} 
                                        />
                                    </button>

                                    {/* Dropdown Menu */}
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
                                <div className='flex space-x-6'>
                                    <Link
                                        to="/login"
                                        className="text-gray-700 hover:text-green-600 font-medium cursor-pointer whitespace-nowrap"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-green-600 text-white px-6 py-2 font-medium hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap rounded-xl"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)} 
                            className='md:hidden text-gray-500 focus:outline-none cursor-pointer'
                        >
                            <svg
                                className="w-6 h-6 text-gray-900"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {isMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Mobile menu */}
                    {isMenuOpen && (
                        <div className='flex flex-col md:hidden py-4'>
                            <div className='flex flex-col space-y-8 mb-6'>
                                {navLinks.map((link) => (
                                    <NavLink 
                                        to={link.path} 
                                        key={link.name} 
                                        className={`text-gray-700 hover:text-green-600 font-medium ${
                                            location.pathname === link.path ? 'text-green-600' : ''
                                        }`}
                                    >
                                        {link.name}
                                    </NavLink>
                                ))}
                            </div>

                            <div className='flex flex-col space-y-4 pb-4'>
                                {isSignedIn && user ? (
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
                                                    {user.firstName} {user.lastName}
                                                </p>
                                                {registrationStatus && !registrationStatus.registration_completed ? (
                                                    <p className="text-xs text-orange-600 font-semibold">
                                                        ⚠️ Complete Registration
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-gray-600">
                                                        {user.primaryEmailAddress?.emailAddress}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <Link
                                            to={getDashboardLink()}
                                            className="flex items-center text-gray-700 hover:text-green-600 font-medium"
                                        >
                                            <FaUser className="mr-3" />
                                            Dashboard
                                        </Link>
                                        <Link
                                            to="/profile-settings"
                                            className="flex items-center text-gray-700 hover:text-green-600 font-medium"
                                        >
                                            <FaCog className="mr-3" />
                                            Profile Settings
                                        </Link>
                                        <Link
                                            to="/help-support"
                                            className="flex items-center text-gray-700 hover:text-green-600 font-medium"
                                        >
                                            <FaQuestionCircle className="mr-3" />
                                            Help & Support
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center text-red-600 hover:text-red-700 font-medium"
                                        >
                                            <FaSignOutAlt className="mr-3" />
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            className="text-gray-700 hover:text-green-600 font-medium"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="bg-green-600 text-white px-6 py-2 font-medium hover:bg-green-700 transition-colors rounded-xl text-center"
                                        >
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </header>
        </div>
    );
}

export default Navbar;