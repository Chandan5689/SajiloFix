import React, { useEffect, useState } from 'react'
import { FaChevronDown } from "react-icons/fa";
import { Link, NavLink, useLocation } from 'react-router-dom';
function Navbar() {
    const [isAuthenticated, setIsAuthenticated] = useState
        (false);
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location])

    const navLinks = [
        { name: 'Services', path: '/services' },
        { name: 'How It Works', path: '/howitworks' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ]
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
                        <nav className='hidden md:flex    space-x-8'>
                            {navLinks.map((link) => (
                                <NavLink to={link.path} key={link.name} className={`text-gray-700 hover:text-green-600 font-medium cursor-pointer ${location.pathname === link.path ? 'text-green-600' : 'text-gray-700'}`} >
                                    {link.name}
                                </NavLink>
                            ))}
                        </nav>
                        <div className=' hidden md:flex items-center space-x-4'>
                            {isAuthenticated ? (
                                <div className='relative'>
                                    <button

                                        className="flex items-center space-x-3 text-gray-700 hover:text-green-600 cursor-pointer"
                                    >
                                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            <span>Avatar</span>
                                        </div>
                                        <div className="hidden md:block text-left">
                                            <p className="text-sm font-medium text-gray-900">user.name</p>
                                            <p className="text-xs text-gray-600">user.email</p>
                                        </div>
                                        <FaChevronDown className='text-xs' />
                                    </button>
                                </div>) : (

                                <div className='flex space-x-6'>
                                    <button

                                        className="text-gray-700 hover:text-green-600 font-medium cursor-pointer whitespace-nowrap"
                                    >
                                        <Link to="/login">
                                            Login
                                        </Link>
                                    </button>
                                    <button

                                        className="bg-green-600 text-white px-6 py-2 font-medium hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap rounded-xl"
                                    >
                                        <Link to="/register">
                                            Sign Up
                                        </Link>
                                    </button>
                                </div>
                            )}


                        </div>

                        {/* Mobile menu button toggle */}
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className='md:hidden text-gray-500 focus:outline-none cursor-pointer'>
                            <svg
                                className={`w-6 h-6 text-gray-900`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
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
                    {/* Mobile navigation menu */}
                    {isMenuOpen && (
                        <div className='flex flex-col md:hidden transition-all duration-500 ease-in py-4'>
                            <div className='flex flex-col space-y-8'>
                                {navLinks.map((link) => (
                                    <NavLink to={link.path} key={link.name} className={`text-gray-700 hover:text-green-600 font-medium cursor-pointer ${location.pathname === link.path ? 'text-green-600' : 'text-gray-700'}`}>
                                        {link.name}
                                    </NavLink>
                                ))}
                            </div>
                            <div className=' flex flex-col space-y-4 pb-4'>
                                {isAuthenticated ? (
                                    <div className='relative'>
                                        <button

                                            className="flex items-center space-x-3 text-gray-700 hover:text-green-600 cursor-pointer"
                                        >
                                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                <span>Avatar</span>
                                            </div>
                                            <div className="hidden md:block text-left">
                                                <p className="text-sm font-medium text-gray-900">user.name</p>
                                                <p className="text-xs text-gray-600">user.email</p>
                                            </div>
                                            <FaChevronDown className='text-xs' />
                                        </button>
                                    </div>) : (

                                    <div className='flex flex-col space-y-6'>
                                        <button

                                            className="text-gray-700 hover:text-green-600 font-medium cursor-pointer whitespace-nowrap"
                                        >
                                            <Link to="/login">
                                                Login
                                            </Link>
                                        </button>
                                        <button

                                            className="bg-green-600 text-white px-6 py-2 font-medium hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap rounded-xl"
                                        >
                                            <Link to="/register">
                                                Sign Up
                                            </Link>
                                        </button>
                                    </div>
                                )}

                            </div>
                        </div>

                    )}
                </div>
            </header>
        </div>

    )
}

export default Navbar