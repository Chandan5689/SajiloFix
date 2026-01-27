import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { registrationSchema, emailVerificationSchema } from '../../validations/authSchemas';
import api from '../../api/axios';
// import PhoneVerification from './PhoneVerification'; // COMMENTED OUT - no longer used
import AddressAutocomplete from '../../components/AddressAutocomplete';
import { uploadProfilePicture } from '../../utils/supabaseStorage';

function SupabaseRegister() {
    const { signUp, signInWithOAuth, resendEmailOtp, verifyEmailOtp } = useSupabaseAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Basic Info, 2: Email Verification
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Store signup result for email verification
    const [signUpResult, setSignUpResult] = useState(null);

    // React Hook Form - Step 1 (Basic Info)
    const {
        register,
        handleSubmit,
        formState: { errors: formErrors },
        setValue,
        watch,
        reset,
    } = useForm({
        resolver: yupResolver(registrationSchema),
        defaultValues: {
            userType: 'find',
            profilePicture: null,
            firstName: '',
            middleName: '',
            lastName: '',
            location: '',
            phoneNumber: '',
            email: '',
            password: '',
            confirmPassword: '',
            serviceArea: '',
        },
        mode: 'onBlur',
    });

    // React Hook Form - Step 2 (Email Verification)
    const {
        register: registerVerification,
        handleSubmit: handleSubmitVerification,
        formState: { errors: verificationErrors },
    } = useForm({
        resolver: yupResolver(emailVerificationSchema),
        defaultValues: {
            emailCode: '',
        },
        mode: 'onChange',
    });

    // Watch values for conditional rendering
    const userTypeValue = watch('userType');
    const emailValue = watch('email');
    const phoneNumberValue = watch('phoneNumber');
    const locationValue = watch('location');
    const serviceAreaValue = watch('serviceArea');

    // Handle profile picture selection
    const handleProfilePictureChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // File validation is now handled by Yup schema
            // But we still need to show preview
            setValue('profilePicture', file, { shouldValidate: true });

            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveProfilePicture = () => {
        setValue('profilePicture', null);
        setProfilePicturePreview(null);
    };

    // Step 1: Register with Supabase
    const handleRegister = async (data) => {
        setError('');
        setLoading(true);

        try {
            // Sign up with Supabase
            const result = await signUp({
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                middleName: data.middleName,
                lastName: data.lastName,
            });

            if (result.error) {
                throw new Error(result.error.message || 'Registration failed');
            }

            // Store result and move to email verification
            setSignUpResult(result);
            console.log('✅ Supabase registration successful');
            console.log('📧 Verification email sent to:', data.email);
            console.log('⏳ Moving to email verification...');
            setStep(2);
        } catch (err) {
            console.error('Signup error:', err);
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify email with OTP code
    const handleVerifyEmail = async (verificationData) => {
        setLoading(true);
        setError('');

        try {
            // Verify the email OTP
            await verifyEmailOtp(emailValue, verificationData.emailCode);

            console.log('✅ Email verified - session active');
            
            // Get all form data from watch
            const registerData = watch(); // Get all form values
            
            // Get user ID from backend to use for Supabase uploads
            const meResponse = await api.get('/auth/me/');
            const userId = meResponse.data.id;
            
            // Upload profile picture directly to Supabase if provided
            let profilePictureUrl = null;
            if (registerData.profilePicture) {
                const uploadResult = await uploadProfilePicture(registerData.profilePicture, userId);
                profilePictureUrl = uploadResult.url;
            }
            
            // Prepare data payload
            const dataPayload = {
                user_type: registerData.userType,
                first_name: registerData.firstName,
                middle_name: registerData.middleName || '',
                last_name: registerData.lastName,
                phone_number: registerData.phoneNumber,
            };
            
            // Add profile picture URL if uploaded
            if (profilePictureUrl) {
                dataPayload.profile_picture = profilePictureUrl;
            }
            
            // Handle location - can be string or object
            if (typeof registerData.location === 'object' && registerData.location !== null) {
                dataPayload.location = registerData.location.formatted || '';
                dataPayload.address = registerData.location.street || '';
                dataPayload.city = registerData.location.city || '';
                dataPayload.district = registerData.location.district || '';
                dataPayload.postal_code = registerData.location.postal_code || '';
                if (registerData.location.lat) dataPayload.latitude = registerData.location.lat;
                if (registerData.location.lng) dataPayload.longitude = registerData.location.lng;
            } else if (typeof registerData.location === 'string') {
                dataPayload.location = registerData.location;
            }
            
            // Add service area for providers
            if (registerData.userType === 'offer' && registerData.serviceArea) {
                dataPayload.service_area = registerData.serviceArea;
            }
            
            // Send to backend as JSON
            const response = await api.post('/auth/update-user-type/', dataPayload);
            
            console.log('✅ User data saved:', response.data);
            console.log('✅ Registration complete!');
            
            // Dispatch event for other components to refresh
            window.dispatchEvent(new Event('registrationComplete'));
            
            // Route based on user type
            if (registerData.userType === 'offer') {
                navigate('/complete-provider-profile', { state: { location: registerData.location } });
            } else {
                navigate('/');
            }
            return;
        } catch (err) {
            console.error('Email verification or data save error:', err);
            setError(err.response?.data?.error || err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // Resend email verification code
    const handleResendEmailCode = async () => {
        try {
            await resendEmailOtp(emailValue);
            setError('');
            console.log('📧 Verification code resent');
        } catch (err) {
            console.error('Resend error:', err);
            setError(err.message || 'Failed to resend code');
        }
    };

    /* 
    // COMMENTED OUT: Step 3 Phone verification (not used anymore - phone is collected in Step 1)
    const handlePhoneVerified = async () => {
        try {
            console.log('📱 Phone verified! Registration complete.');
            // Route based on user type
            if (userType === 'offer') {
                navigate('/complete-provider-profile', { state: { location } });
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Navigation error:', err);
            setError('Failed to complete registration. Please try again.');
        }
    };
    */

    const handleGoogleSignup = async () => {
        try {
            await signInWithOAuth('google');
        } catch (err) {
            console.error('Google signup error:', err);
            setError('Google signup failed. Please try again.');
        }
    };

    // Step 2: Email verification form
    if (step === 2) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                        <p className="text-gray-600">
                            We sent a verification code to <strong>{emailValue}</strong>
                        </p>

                        {/* Progress Indicator - 2 Steps */}
                        <div className="flex items-center justify-center mt-6 space-x-2">
                            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <div className={`w-8 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                            <span>Info</span>
                            <span className="font-semibold">Email</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmitVerification(handleVerifyEmail)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Verification Code
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="Enter 6-digit code"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 ${
                                    verificationErrors.emailCode
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                {...registerVerification('emailCode')}
                                disabled={loading}
                            />
                            {verificationErrors.emailCode && (
                                <p className="mt-1 text-sm text-red-600">{verificationErrors.emailCode.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !!verificationErrors.emailCode}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Verifying...' : 'Verify Email & Continue'}
                        </button>

                        <button
                            type="button"
                            onClick={handleResendEmailCode}
                            className="w-full text-sm text-blue-600 hover:text-blue-500"
                            disabled={loading}
                        >
                            Didn't receive the code? Resend
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    /* 
    // COMMENTED OUT: Step 3 Phone verification rendering (not used anymore)
    if (step === 3) {
        return (
            <PhoneVerification
                userType={userType}
                location={location}
                onComplete={handlePhoneVerified}
                completedSignUp={true}
                signUpData={{
                    email,
                    firstName,
                    middleName,
                    lastName,
                    profilePicture,
                    supabaseUserId: signUpResult?.data?.user?.id,
                    locationPayload: location,
                    serviceArea,
                }}
            />
        );
    }
    */

    // Step 1: Basic info form
    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">Join SajiloFix</h2>
                    <p className="text-gray-600">Create your account</p>

                    {/* Progress Indicator - 2 Steps */}
                    <div className="flex items-center justify-center mt-6 space-x-2">
                        <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className={`w-8 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                        <span className={step >= 1 ? 'font-semibold' : ''}>Info</span>
                        <span className={step >= 2 ? 'font-semibold' : ''}>Email</span>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(handleRegister)} className="space-y-6">
                    {/* User Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            I want to
                        </label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setValue('userType', 'find', { shouldValidate: true })}
                                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${userTypeValue === 'find'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                            >
                                🔍 Find Services
                            </button>
                            <button
                                type="button"
                                onClick={() => setValue('userType', 'offer', { shouldValidate: true })}
                                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${userTypeValue === 'offer'
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
                        {formErrors.profilePicture && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.profilePicture.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name *
                            </label>
                            <input
                                type="text"
                                {...register('firstName')}
                                placeholder="John"
                                className={`w-full px-4 py-3 border ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-blue-500`}
                            />
                            {formErrors.firstName && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.firstName.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Middle Name (Optional)
                            </label>
                            <input
                                type="text"
                                {...register('middleName')}
                                placeholder="Optional"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                {...register('lastName')}
                                placeholder="Doe"
                                className={`w-full px-4 py-3 border ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-blue-500`}
                            />
                            {formErrors.lastName && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.lastName.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            
                        </label>
                        <AddressAutocomplete
                            value={locationValue}
                            onChange={(value) => {
                                setValue('location', value, { shouldValidate: true, shouldDirty: true });
                            }}
                            placeholder="Enter your location"
                            error={formErrors.location?.message}
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                        </label>
                        <div className="flex">
                            <span className="inline-flex items-center px-4 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 font-medium">
                                +977
                            </span>
                            <input
                                type="tel"
                                value={phoneNumberValue || ''}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    setValue('phoneNumber', value, { shouldValidate: true, shouldDirty: true });
                                }}
                                placeholder="9812345678"
                                maxLength="10"
                                className={`flex-1 px-4 py-3 border ${formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                    } rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Enter 10 digits starting with 97 or 98
                        </p>
                        {formErrors.phoneNumber && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber.message}</p>
                        )}
                        {userTypeValue === 'offer' && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs text-blue-800">
                                    <span className="font-semibold">📱 Phone Verification:</span> Our SajiloFix team will call you on this number to verify your account. Your account will be fully activated once verification is complete. You may receive the verification call within 1-2 hours.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* {userTypeValue === 'offer' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Area (km) <span className="text-gray-400">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={serviceAreaValue || ''}
                                onChange={(e) => setValue('serviceArea', e.target.value, { shouldValidate: true, shouldDirty: true })}
                                placeholder="e.g., 10"
                                className={`w-full px-4 py-3 border ${formErrors.serviceArea ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-blue-500`}
                            />
                            {formErrors.serviceArea && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.serviceArea.message}</p>
                            )}
                        </div>
                    )} */}

                   

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            {...register('email')}
                            placeholder="your@email.com"
                            className={`w-full px-4 py-3 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                                } rounded-lg focus:ring-2 focus:ring-blue-500`}
                        />
                        {formErrors.email && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.email.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                {...register('password')}
                                placeholder="At least 8 characters"
                                className={`w-full px-4 py-3 pr-12 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-blue-500`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {formErrors.password && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.password.message}</p>
                        )}
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-800">
                                <span className="font-semibold">🔒 Password Requirements:</span> Must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.
                            </p>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                {...register('confirmPassword')}
                                placeholder="Confirm your password"
                                className={`w-full px-4 py-3 pr-12 border ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-blue-500`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {formErrors.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Creating account...' : 'Continue to Email Verification'}
                    </button>
                </form>

                {/* OAuth Section */}
                {/* <div className="mt-6">
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
                        onClick={handleGoogleSignup}
                        className="mt-6 w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <FcGoogle className="mr-2 text-xl" />
                        Google
                    </button>
                </div> */}

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 hover:text-blue-500 font-semibold">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SupabaseRegister;
