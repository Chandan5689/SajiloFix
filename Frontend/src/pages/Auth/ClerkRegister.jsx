import React, { useState } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import PhoneVerification from './PhoneVerification';
import AddressAutocomplete from '../../components/AddressAutocomplete';

function ClerkRegister() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const navigate = useNavigate();
    
    const [step, setStep] = useState(1); // 1: Email signup, 2: Verify email, 3: Phone verification
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [userType, setUserType] = useState('find');
    const [serviceArea, setServiceArea] = useState(''); // km, for providers
    const [location, setLocation] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    
    // Store the completed sign up for later activation
    const [completedSignUp, setCompletedSignUp] = useState(null);

    // Handle profile picture selection
    const handleProfilePictureChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setFieldErrors(prev => ({ ...prev, profilePicture: 'Image must be less than 5MB' }));
                return;
            }
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setFieldErrors(prev => ({ ...prev, profilePicture: 'Please select a valid image file' }));
                return;
            }
            setProfilePicture(file);
            setFieldErrors(prev => ({ ...prev, profilePicture: '' }));
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveProfilePicture = () => {
        setProfilePicture(null);
        setProfilePicturePreview(null);
    };

    // Step 1: Validate and create account with email
    const handleEmailSignup = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;

        setError('');
        setFieldErrors({});

        // Validation
        const errors = {};
        if (!firstName.trim()) errors.firstName = 'First name is required';
        if (!lastName.trim()) errors.lastName = 'Last name is required';
        if (!email.trim()) errors.email = 'Email is required';
        const locationText = typeof location === 'string' ? location : (location?.formatted || '');
        if (!locationText.trim()) errors.location = 'Location is required';
        if (!password) errors.password = 'Password is required';
        if (password.length < 8) errors.password = 'Password must be at least 8 characters';
        if (!confirmPassword) errors.confirmPassword = 'Please confirm password';
        if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

        // If provider, require numeric service area (km)
        if (userType === 'offer') {
            const km = parseInt(String(serviceArea).trim(), 10);
            if (!Number.isFinite(km) || km < 0) {
                errors.serviceArea = 'Service area (km) is required';
            }
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);

        try {
            await signUp.create({
                emailAddress: email,
                password: password,
                firstName: firstName,
                lastName: lastName,
            });

            // Send verification email
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            
            setStep(2);
        } catch (err) {
            console.error('Signup error:', err);
            setError(err.errors?.[0]?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify email with code - DON'T activate session yet
    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;

        setLoading(true);
        setError('');

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status === 'complete') {
                // ⚠️ Store completed signup but DON'T activate session yet
                // Session will be activated ONLY after phone verification completes
                setCompletedSignUp(completeSignUp);
                console.log('✅ Email verified - session NOT activated yet');
                console.log('⏳ Moving to phone verification...');
                setStep(3);
            } else {
                setError('Email verification incomplete. Please try again.');
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.errors?.[0]?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: After phone verification completes - Session already active
    const handlePhoneVerified = async () => {
        try {
            // Session was already activated in PhoneVerification component
            console.log('📱 Phone verified! Session already active.');
            
            // Route based on user type
            if (userType === 'offer') {
                navigate('/complete-provider-profile');
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Navigation error:', err);
            setError('Failed to complete registration. Please try again.');
        }
    };

    if (step === 3) {
        return (
            <PhoneVerification 
                userType={userType} 
                location={location}
                onComplete={handlePhoneVerified}
                // Pass the completed signup object so PhoneVerification can get a token
                completedSignUp={completedSignUp}
                // Pass the sign-up data for backend registration
                signUpData={{
                    email,
                    firstName,
                    middleName,
                    lastName,
                    profilePicture,
                    clerkUserId: completedSignUp?.createdUserId,
                    locationPayload: location,
                    serviceArea,
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">Join SajiloFix</h2>
                    <p className="text-gray-600">Create your account</p>
                    
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center mt-6 space-x-2">
                        <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className={`w-8 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className={`w-8 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                        <span className={step >= 1 ? 'font-semibold' : ''}>Info</span>
                        <span className={step >= 2 ? 'font-semibold' : ''}>Email</span>
                        <span className={step >= 3 ? 'font-semibold' : ''}>Phone</span>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleEmailSignup} className="space-y-6">
                        {/* User Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                I want to
                            </label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setUserType('find')}
                                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                                        userType === 'find'
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    🔍 Find Services
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserType('offer')}
                                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                                        userType === 'offer'
                                            ? 'bg-green-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    🛠️ Offer Services
                                </button>
                            </div>
                        </div>

                        {/* Profile Picture Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Profile Picture (Optional)
                            </label>
                            {profilePicturePreview ? (
                                <div className="flex items-center gap-4">
                                    <img 
                                        src={profilePicturePreview} 
                                        alt="Preview" 
                                        className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveProfilePicture}
                                        className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
                                    >
                                        Remove Picture
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Click to upload a profile picture</p>
                                        <p className="text-xs text-gray-500 mt-1">(JPG, PNG - Max 5MB)</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePictureChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                            {fieldErrors.profilePicture && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.profilePicture}</p>
                            )}
                        </div>

                        {/* Service Area (km) - for providers */}
                        {userType === 'offer' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Service Area (km) *
                                </label>
                                <input
                                    type="number"
                                    value={serviceArea}
                                    onChange={(e) => {
                                        setServiceArea(e.target.value);
                                        if (fieldErrors.serviceArea) {
                                            setFieldErrors({ ...fieldErrors, serviceArea: '' });
                                        }
                                    }}
                                    placeholder="e.g., 20"
                                    min="0"
                                    className={`w-full px-4 py-3 border ${
                                        fieldErrors.serviceArea ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-blue-500`}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Enter your general service radius in kilometers</p>
                                {fieldErrors.serviceArea && (
                                    <p className="text-red-500 text-xs mt-1">{fieldErrors.serviceArea}</p>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => {
                                        setFirstName(e.target.value);
                                        if (fieldErrors.firstName) {
                                            setFieldErrors({...fieldErrors, firstName: ''});
                                        }
                                    }}
                                    placeholder="John"
                                    className={`w-full px-4 py-3 border ${
                                        fieldErrors.firstName ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-blue-500`}
                                    required
                                />
                                {fieldErrors.firstName && (
                                    <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Middle Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={middleName}
                                    onChange={(e) => {
                                        setMiddleName(e.target.value);
                                    }}
                                    placeholder="Kumar"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => {
                                    setLastName(e.target.value);
                                    if (fieldErrors.lastName) {
                                        setFieldErrors({...fieldErrors, lastName: ''});
                                    }
                                }}
                                placeholder="Doe"
                                className={`w-full px-4 py-3 border ${
                                    fieldErrors.lastName ? 'border-red-500' : 'border-gray-300'
                                } rounded-lg focus:ring-2 focus:ring-blue-500`}
                                required
                            />
                            {fieldErrors.lastName && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (fieldErrors.email) {
                                        setFieldErrors({...fieldErrors, email: ''});
                                    }
                                }}
                                placeholder="john@example.com"
                                className={`w-full px-4 py-3 border ${
                                    fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                                } rounded-lg focus:ring-2 focus:ring-blue-500`}
                                required
                            />
                            {fieldErrors.email && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                            )}
                        </div>

                        <div>
                            <AddressAutocomplete
                                label="Location *"
                                value={location}
                                onChange={(val) => {
                                    // val is a structured payload { formatted, city, district, postal_code, latitude, longitude }
                                    setLocation(val);
                                    if (fieldErrors.location) {
                                        setFieldErrors({ ...fieldErrors, location: '' });
                                    }
                                }}
                                disabled={loading}
                                required
                            />
                            {fieldErrors.location && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.location}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (fieldErrors.password) {
                                            setFieldErrors({...fieldErrors, password: ''});
                                        }
                                    }}
                                    placeholder="At least 8 characters"
                                    className={`w-full px-4 py-3 pr-12 border ${
                                        fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-blue-500`}
                                    required
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
                            {fieldErrors.password && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (fieldErrors.confirmPassword) {
                                            setFieldErrors({...fieldErrors, confirmPassword: ''});
                                        }
                                    }}
                                    placeholder="Re-enter password"
                                    className={`w-full px-4 py-3 pr-12 border ${
                                        fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-blue-500`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    disabled={loading}
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            {fieldErrors.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Creating Account...' : 'Continue to Email Verification'}
                        </button>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                                    Log In
                                </Link>
                            </p>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyEmail} className="space-y-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">📧</span>
                            </div>
                            <p className="text-gray-600">
                                We sent a verification code to
                            </p>
                            <p className="font-semibold text-gray-900">{email}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                Enter 6-Digit Code
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                                maxLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Verifying...' : 'Verify Email & Continue'}
                        </button>

                        <button
                            type="button"
                            onClick={() => signUp.prepareEmailAddressVerification({ strategy: 'email_code' })}
                            className="w-full text-blue-600 hover:text-blue-700 text-sm"
                            disabled={loading}
                        >
                            Resend Code
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full text-gray-600 hover:text-gray-700 text-sm"
                        >
                            ← Back to Registration
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ClerkRegister;