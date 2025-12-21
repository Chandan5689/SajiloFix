import React from 'react';
import { FaTimes, FaEnvelope, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function LoginFormLayout({
    activeTab,
    setActiveTab,
    children,
    email,
    password,
    setEmail,
    setPassword,
    rememberMe,
    setRememberMe,
    handleSubmit,
    loading,
    error,
    fieldErrors
}) {
    const navigate = useNavigate();
    const tabs = ["Customer", "Service Provider", "Admin"];

    // Handle form submission
    const onFormSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission
        handleSubmit(); // Call parent's submit handler
    };

    return (
        <div className='min-h-screen bg-linear-to-br from-blue-50 to-white flex items-center justify-center p-4'>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                    <FaTimes className='text-xl' />
                </button>
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2
                            onClick={() => navigate('/')}
                            className="text-3xl font-bold text-blue-600 mb-2 cursor-pointer hover:text-blue-700 transition-colors duration-300"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                            SajiloFix
                        </h2>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Welcome back
                        </h3>
                        <p className="text-gray-600">
                            Sign in to your account to continue
                        </p>
                        <div className="mt-8 flex sm:max-w-96 space-x-4 mb-2 bg-gray-200 rounded-lg">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 m-1 py-2 flex justify text-sm font-medium rounded transition cursor-pointer ${activeTab === tab
                                        ? "bg-white text-green-600"
                                        : "text-gray-700 hover:text-gray-900"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}
                    
                    {/* form  */}
                    <div className="space-y-6">
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
                                    placeholder="Enter your email"
                                    className={`w-full pl-10 pr-4 py-3 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none`}
                                    disabled={loading}
                                    autoComplete="email"
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                            )}
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
                                    placeholder="Enter your password"
                                    className={`w-full pl-10 pr-4 py-3 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none`}
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                            </div>
                            {fieldErrors.password && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                    disabled={loading}
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-gray-700 cursor-pointer">
                                    Remember me
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={() => alert('Password reset feature coming soon!')}
                                className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={handleSubmit}
                            className={`w-full py-3 font-semibold rounded-lg transition-colors ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                } text-white`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Logging in...
                                </span>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </div>
                    <div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginFormLayout;