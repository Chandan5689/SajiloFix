import React, { useState } from 'react'
import { FaLock, FaPhone, FaPhoneAlt, FaTimes } from 'react-icons/fa';
import { FaEnvelope } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link } from 'react-router';
function Register() {
    // const [userType, setUserType] = useState < 'find' | 'offer' > ('find');
    const [userType, setUserType] = useState('find');
    const [user, setUser] = useState({
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'JD'
    });
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-white flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
                <button

                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                    <FaTimes className='text-xl' />
                </button>
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2

                            className="text-3xl font-bold text-blue-600 mb-2 cursor-pointer hover:text-blue-700 transition-colors duration-300"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                            SajiloFix
                        </h2>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Create account
                        </h3>
                        <p className="text-gray-600">
                            Sign up to get started with our services
                        </p>
                    </div>
                    <form className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                I want to
                            </label>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setUserType('find')}
                                    className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg font-medium transition-colors  ${userType === 'find'
                                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <i className="fas fa-search mr-2"></i>
                                    Find Services
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserType('offer')}
                                    className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg font-medium transition-colors  ${userType === 'offer'
                                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <i className="fas fa-briefcase mr-2"></i>
                                    Offer Services
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="John"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none
                                    "
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email address
                            </label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <FaPhoneAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="+1 (555) 123-4567"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a strong password"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex items-start">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer mt-1"
                                required
                            />
                            <label htmlFor="terms" className="ml-2 text-sm text-gray-700 cursor-pointer">
                                I agree to the <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
                            </label>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap rounded-lg"
                        >
                            Create Account
                        </button>
                    </form>
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>
                        <div className="mt-6 grid ">
                            <button className="w-full inline-flex justify-center py-2 px-4 border-2 border-gray-500 shadow-sm text-sm font-medium text-gray-500 hover:text-white hover:bg-gray-400 cursor-pointer rounded-lg transition-all duration-200">
                                <FcGoogle className="mr-2 text-xl" />
                                Google
                            </button>
                            {/* <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer ">
                                <i className="fab fa-facebook-f mr-2 text-blue-600"></i>
                                Facebook
                            </button> */}
                        </div>
                    </div>
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?
                            <button
                                
                                className="ml-1 text-blue-600 hover:text-blue-500 font-medium cursor-pointer"
                            >
                                <Link to="/login">
                                    Sign in here
                                </Link>
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register