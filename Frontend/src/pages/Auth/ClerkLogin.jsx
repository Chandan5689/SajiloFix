import React, { useState } from 'react';
import { useSignIn, useAuth } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser, FaTools, FaShieldAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import api from '../../api/axios';

function ClerkLogin() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const { getToken, signOut } = useAuth();
    const navigate = useNavigate();
    
    const [userType, setUserType] = useState('find');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const userTypes = [
        { key: 'find', label: 'Customer', icon: FaUser, color: 'blue' },
        { key: 'offer', label: 'Provider', icon: FaTools, color: 'green' },
        { key: 'admin', label: 'Admin', icon: FaShieldAlt, color: 'red' },
    ];

    const currentUserType = userTypes.find(t => t.key === userType);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;

        setLoading(true);
        setError('');

        try {
            const result = await signIn.create({
                identifier: email,
                password,
            });

            if (result.status === 'complete') {
                // Activate session to enable token retrieval
                await setActive({ session: result.createdSessionId });

                // Fetch user details to verify type matches selection
                try {
                    const token = await getToken();
                    const response = await api.get('/auth/registration-status/', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    const actualUserType = response.data.user_type;
                    const userTypeLabel = {
                        'find': 'Customer',
                        'offer': 'Provider',
                        'admin': 'Admin'
                    };

                    // Check if selected type matches actual type - STRICT CHECK
                    if (actualUserType !== userType) {
                        // const mismatchMessages = {
                        //     offer: 'You are not registered as provider',
                        //     admin: 'You are not registered as admin',
                        //     find: 'You are not registered with this type of account',
                        // };

                        // Show message immediately, then sign out after 2 seconds
                        setError('Account type mismatch, Please select the correct user type to log in.');
                        setPassword('');
                        setLoading(false);
                        setTimeout(async () => {
                            try {
                                await signOut();
                            } catch (signOutErr) {
                                console.error('Error signing out after mismatch:', signOutErr);
                            }
                        }, 1500);
                        return;
                    }

                    // Type matches - check registration status
                    if (response.data.registration_completed) {
                        setLoading(false);
                        navigate('/dashboard');
                    } else {
                        setLoading(false);
                        navigate('/verify-phone-flow');
                    }
                } catch (typeCheckErr) {
                    console.error('Error verifying user type:', typeCheckErr);
                    await signOut();
                    setError('Unable to verify account type. Please try again.');
                    setPassword('');
                    setLoading(false);
                }
            } else {
                setError('Login incomplete. Please try again.');
                setLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.errors?.[0]?.message || 'Invalid email or password');
            setPassword('');
            setLoading(false);
        }
    };

    const handleTabChange = (newUserType) => {
        console.log('handleTabChange called with:', newUserType);
        setUserType(newUserType);
        setError('');
        setPassword('');
    };

    const handleGoogleLogin = async () => {
        if (!isLoaded) return;

        try {
            await signIn.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/',
            });
        } catch (err) {
            console.error('Google login error:', err);
            setError('Google login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-blue-600 mb-2">
                        SajiloFix
                    </h2>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Welcome back
                    </h3>
                    <p className="text-gray-600">
                        Sign in to your account
                    </p>
                </div>

                {/* User Type Tabs */}
                <div className="mb-8 flex gap-3 bg-gray-100 p-3 rounded-lg">
                    {userTypes.map((type) => {
                        const Icon = type.icon;
                        const isActive = userType === type.key;
                        
                        let bgClass = 'bg-gray-200';
                        let textClass = 'text-gray-700';
                        let shadowClass = '';
                        
                        if (isActive) {
                            if (type.color === 'blue') {
                                bgClass = 'bg-blue-600';
                            } else if (type.color === 'green') {
                                bgClass = 'bg-green-600';
                            } else if (type.color === 'red') {
                                bgClass = 'bg-red-600';
                            }
                            textClass = 'text-white';
                            shadowClass = 'shadow-lg';
                        }
                        
                        return (
                            <button
                                key={type.key}
                                type="button"
                                onClick={() => {
                                    console.log('Tab clicked:', type.key);
                                    handleTabChange(type.key);
                                }}
                                className={`flex-1 py-3 px-3 rounded-lg font-medium flex flex-col items-center gap-2 transition-all duration-300 ${bgClass} ${textClass} ${shadowClass} ${!loading && 'hover:scale-105'} ${loading && 'opacity-50 cursor-not-allowed'}`}
                                disabled={loading}
                            >
                                <Icon className="text-xl" />
                                <span className="text-xs font-bold">{type.label}</span>
                            </button>
                        );
                    })}
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                        <p className="text-red-700 text-sm font-medium whitespace-pre-line">{error}</p>
                        {error.includes('tab') && (
                            <p className="text-red-600 text-xs mt-2 font-semibold">👆 Click the correct tab above to continue</p>
                        )}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-6">
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
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={loading}
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
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                disabled={loading}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Logging in...' : `Log In as ${currentUserType?.label}`}
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

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="mt-6 w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <FcGoogle className="mr-2 text-xl" />
                        Google
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-600 hover:text-blue-500 font-semibold">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ClerkLogin;