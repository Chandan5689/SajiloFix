import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import api from '../../api/axios';

function PhoneVerification({ userType, location, onComplete, signUpData, completedSignUp }) {
    const navigate = useNavigate();
    const { user, loading: authLoading, getToken, sendPhoneOtp, verifyPhoneOtp } = useSupabaseAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [resendDisabled, setResendDisabled] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Guard: Check if this component was accessed properly with required data
    useEffect(() => {
        const hasRegistrationFlowData = signUpData && completedSignUp;
        const hasPostVerificationFlowData = user && !authLoading;
        
        if (!userType || location === undefined) {
            console.error('❌ PhoneVerification: Missing userType or location');
            setError('Invalid registration state. Redirecting to registration...');
            const timer = setTimeout(() => navigate('/register'), 2000);
            return () => clearTimeout(timer);
        }
        
        if (!hasRegistrationFlowData && !hasPostVerificationFlowData) {
            console.error('❌ PhoneVerification: No valid authentication flow detected');
            setError('Invalid registration state. Redirecting to registration...');
            const timer = setTimeout(() => navigate('/register'), 2000);
            return () => clearTimeout(timer);
        }
        
        if (hasRegistrationFlowData) {
            console.log('✅ Registration flow: Email verified, now completing phone verification');
        } else {
            console.log('✅ Post-verification flow: User already authenticated with Supabase');
        }
    }, [signUpData, userType, location, completedSignUp, user, authLoading, navigate]);

    // Test phone numbers configuration (from Supabase)
    const TEST_PHONE_NUMBERS = {
        '9845678910': '333111'  // Phone + OTP from your Supabase config
    };

    // Check if phone number is a test number
    const checkIsTestNumber = (phone) => {
        return TEST_PHONE_NUMBERS.hasOwnProperty(phone);
    };

    // Step 1: Send OTP via Supabase
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        // Check if we have authentication
        if (!completedSignUp && !user) {
            setError('Authentication required. Please sign in or complete registration.');
            setSubmitting(false);
            return;
        }

        // Validate phone number (10 digits starting with 98)
        if (!/^98\d{8}$/.test(phoneNumber)) {
            setError('Phone number must be 10 digits starting with 98');
            setSubmitting(false);
            return;
        }

        try {
            const isTest = checkIsTestNumber(phoneNumber);
            console.log('📞 Sending Supabase OTP to:', phoneNumber);
            console.log('🧪 Is test number:', isTest);

            // Use Supabase's sendPhoneOtp method
            await sendPhoneOtp(phoneNumber);
            
            console.log('✅ OTP sent successfully via Supabase');
            setStep(2);
            setError('');
            setResendDisabled(true);
            setResendTimer(60);
        } catch (err) {
            console.error('❌ Error sending OTP:', err);
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Step 2: Verify OTP via Supabase
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            console.log('🔐 Verifying OTP:', otp);

            // Use Supabase's verifyPhoneOtp method
            const result = await verifyPhoneOtp(phoneNumber, otp);
            console.log('✅ Phone OTP verified successfully:', result);

            // Now register the phone number with backend
            const token = await getToken();
            if (!token) {
                throw new Error('No authentication token available');
            }

            const phoneVerifyResponse = await api.post(
                '/auth/verify-phone/',
                {
                    phone_number: phoneNumber,
                    firebase_uid: result?.user?.id || ''
                }
            );

            console.log('✅ Phone verified and saved to backend:', phoneVerifyResponse.data);

            // Update user type and location
            const locationPayload = typeof location === 'object' ? location : null;
            const formData = new FormData();
            formData.append('user_type', userType);
            formData.append('first_name', signUpData?.firstName || '');
            formData.append('middle_name', signUpData?.middleName || '');
            formData.append('last_name', signUpData?.lastName || '');
            formData.append('location', typeof location === 'object' ? (location.formatted || '') : (location || ''));
            formData.append('address', typeof location === 'object' ? (location.street || '') : '');
            formData.append('city', typeof location === 'object' ? (location.city || '') : '');
            formData.append('district', typeof location === 'object' ? (location.district || '') : '');
            formData.append('postal_code', typeof location === 'object' ? (location.postal_code || '') : '');
            formData.append('latitude', typeof location === 'object' ? (location.latitude ?? null) : null);
            formData.append('longitude', typeof location === 'object' ? (location.longitude ?? null) : null);
            formData.append('location_payload', JSON.stringify(locationPayload || {}));
            
            if (signUpData?.serviceArea != null && String(signUpData.serviceArea).trim() !== '') {
                formData.append('service_area', String(signUpData.serviceArea).trim());
            }
            
            if (signUpData?.profilePicture) {
                formData.append('profile_picture', signUpData.profilePicture);
            }
            
            const updateTypeResponse = await api.post(
                '/auth/update-user-type/',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            console.log('✅ User type saved:', updateTypeResponse.data);

            console.log('🎉 Registration complete!');
            window.dispatchEvent(new Event('registrationComplete'));
            
            if (onComplete) {
                onComplete();
            }
        } catch (err) {
            console.error('❌ Error verifying OTP:', err);
            setError(err.message || 'Failed to verify OTP. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async (e) => {
        e.preventDefault();
        if (resendDisabled) return;

        setError('');
        setSubmitting(true);

        try {
            console.log('🔄 Resending OTP to:', phoneNumber);
            await sendPhoneOtp(phoneNumber);
            console.log('✅ OTP resent successfully');
            setError('');
            setResendDisabled(true);
            setResendTimer(60);
        } catch (err) {
            console.error('❌ Error resending OTP:', err);
            setError(err.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Timer for resend button
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setResendDisabled(false);
        }
    }, [resendTimer]);

    const isTestNumber = checkIsTestNumber(phoneNumber);

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">📱</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Verify Phone Number
                    </h2>
                    <p className="text-gray-600">
                        Final step to complete your registration
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {authLoading && (
                    <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                        <p className="text-blue-700 text-sm">Loading authentication system...</p>
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number (Nepal)
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-4 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                                    +977
                                </span>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="9812345678"
                                    maxLength="10"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Enter 10 digits starting with 97 or 98
                            </p>
                            
                            {/* Show test number hint if detected */}
                            {phoneNumber && checkIsTestNumber(phoneNumber) && (
                                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-xs text-yellow-800">
                                        🧪 <strong>Test Number Detected</strong><br/>
                                        Use verification code: <strong>{TEST_PHONE_NUMBERS[phoneNumber]}</strong>
                                    </p>
                                </div>
                            )}
                        </div>

                        <div id="recaptcha-container"></div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending Code...
                                </span>
                            ) : (
                                'Send Verification Code'
                            )}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div className="text-center mb-6">
                            {isTestNumber ? (
                                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        🧪 <strong>Test Mode</strong><br/>
                                        Use code: <strong className="text-2xl">{TEST_PHONE_NUMBERS[phoneNumber]}</strong>
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-600">
                                        We sent a 6-digit code to
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900 mt-1">
                                        +977 {phoneNumber}
                                    </p>
                                </>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1);
                                    setOtp('');
                                }}
                                className="text-blue-600 text-sm mt-2 hover:underline"
                            >
                                Change number
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                Enter Verification Code
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                maxLength="6"
                                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-3xl tracking-widest font-semibold"
                                required
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || otp.length !== 6}
                            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Completing Registration...
                                </span>
                            ) : (
                                'Verify & Complete Registration'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleResendOTP}
                            className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium disabled:text-gray-400"
                            disabled={submitting || resendDisabled}
                        >
                            {resendDisabled ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        By continuing, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PhoneVerification;
