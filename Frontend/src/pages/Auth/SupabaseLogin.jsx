import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FaEnvelope, FaLock, FaUser, FaTools, FaShieldAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { loginSchema } from '../../validations/authSchemas';
import api from '../../api/axios';

function SupabaseLogin() {
    const { signIn, signInWithOAuth, getToken, signOut } = useSupabaseAuth();
    const navigate = useNavigate();
    
    const [userType, setUserType] = useState('find');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // React Hook Form with Yup validation
    const {
        register,
        handleSubmit,
        formState: { errors: formErrors },
        reset,
        setValue,
    } = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur', // Validate on blur for better UX
    });

    const userTypes = [
        { key: 'find', label: 'Customer', icon: FaUser, color: 'blue' },
        { key: 'offer', label: 'Provider', icon: FaTools, color: 'green' },
        { key: 'admin', label: 'Admin', icon: FaShieldAlt, color: 'red' },
    ];

    const currentUserType = userTypes.find(t => t.key === userType);

    const handleEmailLogin = async (data) => {
        setLoading(true);
        setError('');

        try {
            // Sign in with Supabase Auth (data now comes from React Hook Form)
            const result = await signIn(data.email, data.password);

            if (result.session) {
                const token = result.session.access_token;
                // Fetch user registration status from backend
                const response = await api.get('/auth/registration-status/', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const actualUserType = response.data.user_type;
                const isAdmin = response.data.is_admin; // Use backend is_admin

                // Check if selected type matches actual type
                if (actualUserType && actualUserType !== userType) {
                    if (userType === 'admin') {
                        if (!isAdmin) {
                            await signOut();
                            setError(`⚠️ Access Denied!\n\nYou do not have admin privileges.\nPlease click ${actualUserType === 'find' ? 'the Customer tab' : 'the Provider tab'} and try again.`);
                            setValue('password', '');
                            setLoading(false);
                            return;
                        }
                    } else {
                        await signOut();
                        const roleLabel = actualUserType === 'find' ? 'Customer' : actualUserType === 'offer' ? 'Provider' : 'Admin';
                        const correctTab = actualUserType === 'find' ? 'the Customer tab' : actualUserType === 'offer' ? 'the Provider tab' : 'the Admin tab';
                        setError(`⚠️ Account Type Mismatch!\n\nYou are registered as a ${roleLabel}.\nPlease click ${correctTab} above and try again.`);
                        setValue('password', '');
                        setLoading(false);
                        return;
                    }
                } else if (userType === 'admin' && !isAdmin) {
                    await signOut();
                    setError(`⚠️ Access Denied!\n\nYou do not have admin privileges.\nPlease use ${actualUserType === 'find' ? 'the Customer tab' : actualUserType === 'offer' ? 'the Provider tab' : 'the correct tab'}.`);
                    setValue('password', '');
                    setLoading(false);
                    return;
                }

                // Check registration status and redirect accordingly
                if (userType === 'admin' && isAdmin) {
                    setLoading(false);
                    window.location.href = 'http://127.0.0.1:8000/admin/';
                    return;
                }

                if (response.data.registration_completed) {
                    setLoading(false);
                    if (actualUserType === 'offer') {
                        navigate('/provider/dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                } else {
                    setLoading(false);
                    if (actualUserType === 'offer') {
                        navigate('/complete-provider-profile');
                    } else {
                        navigate('/register');
                    }
                }
            } else {
                console.error('No session returned from signIn');
                setError('Login failed. Please try again.');
                setLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError('Invalid email or password. Please try again.');
            } else if (err.message?.includes('Invalid login credentials')) {
                setError('Invalid email or password. Please try again.');
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
            setValue('password', '');
            setLoading(false);
        }
    };

    const handleTabChange = (newUserType) => {
        setUserType(newUserType);
        setError('');
        setValue('password', ''); // Clear password field
    };

    const handleGoogleLogin = async () => {

        try {
            await signInWithOAuth('google');
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
                                onClick={() => handleTabChange(type.key)}
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

                <form onSubmit={handleSubmit(handleEmailLogin)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email address
                        </label>
                        <div className="relative">
                            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type="email"
                                {...register('email')}
                                placeholder="Enter your email"
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 ${
                                    formErrors.email 
                                        ? 'border-red-500 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                disabled={loading}
                            />
                        </div>
                        {formErrors.email && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                {...register('password')}
                                placeholder="Enter your password"
                                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 ${
                                    formErrors.password 
                                        ? 'border-red-500 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
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
                        {formErrors.password && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.password.message}</p>
                        )}
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

export default SupabaseLogin;