import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import api from '../../api/axios';

function PhoneVerification({ userType, location, onComplete, signUpData, completedSignUp }) {
    const navigate = useNavigate();
    const { isLoaded, user } = useUser();
    const { getToken } = useAuth();
    const clerk = useClerk();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verificationId, setVerificationId] = useState(null);
    const [isTestNumber, setIsTestNumber] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Guard: Check if this component was accessed properly with required data
    useEffect(() => {
        // Check if we have the minimum required data
        // Either: (signUpData + completedSignUp) for registration flow
        // Or: (user) for post-email-verification flow
        const hasRegistrationFlowData = signUpData && completedSignUp;
        const hasPostVerificationFlowData = user && isLoaded;
        
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
        
        console.log('✅ PhoneVerification component properly initialized');
        if (hasRegistrationFlowData) {
            console.log('⚠️ Registration flow: Clerk session is NOT active yet - will activate after phone verification');
        } else {
            console.log('✅ Post-verification flow: User already authenticated with Clerk');
        }
    }, [signUpData, userType, location, completedSignUp, user, isLoaded, navigate]);

    // Test phone numbers configuration
    const TEST_PHONE_NUMBERS = {
        '9806682952':'887754',
        '9812345678': '321546',
        '9856037190': '123456',
        '9802837190': '890221',
        '9802835190':'569771',
        '9832145678':'002234',
        '9742516049':'223356',
        '9817194571':'778899',
        // Add more test numbers as configured in Firebase
    };

    // Check if phone number is a test number
    const checkIsTestNumber = (phone) => {
        return TEST_PHONE_NUMBERS.hasOwnProperty(phone);
    };

    // Setup reCAPTCHA
    const setupRecaptcha = () => {
        // Clear any existing verifier
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                console.warn('Error clearing recaptcha verifier:', e);
            }
            window.recaptchaVerifier = null;
        }

        window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            'recaptcha-container',
            {
                size: 'invisible',
                callback: () => {
                    console.log('✅ reCAPTCHA solved');
                },
                'expired-callback': () => {
                    console.log('⚠️ reCAPTCHA expired');
                    if (window.recaptchaVerifier) {
                        window.recaptchaVerifier.clear();
                        window.recaptchaVerifier = null;
                    }
                },
                'error-callback': () => {
                    console.error('❌ reCAPTCHA error');
                    if (window.recaptchaVerifier) {
                        window.recaptchaVerifier.clear();
                        window.recaptchaVerifier = null;
                    }
                }
            }
        );
    };

    // Step 1: Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Check if we have authentication (either from active Clerk session OR from completedSignUp)
        if (!completedSignUp && !user) {
            setError('Authentication required. Please sign in or complete registration.');
            setLoading(false);
            return;
        }

        // Validate phone number
        if (!/^98\d{8}$/.test(phoneNumber)) {
            setError('Phone number must be 10 digits starting with 98');
            setLoading(false);
            return;
        }

        // Check if it's a test number
        const isTest = checkIsTestNumber(phoneNumber);
        setIsTestNumber(isTest);

        try {
            // Setup reCAPTCHA (required even for test numbers)
            setupRecaptcha();
            const appVerifier = window.recaptchaVerifier;
            const phoneNumberWithCountryCode = `+977${phoneNumber}`;

            console.log('📞 Sending OTP to:', phoneNumberWithCountryCode);
            console.log('🧪 Is test number:', isTest);

            if (isTest) {
                console.log(`⚠️ Test number detected. Use code: ${TEST_PHONE_NUMBERS[phoneNumber]}`);
            }

            console.log('🔄 Initiating reCAPTCHA and sending OTP...');
            const confirmationResult = await signInWithPhoneNumber(
                auth,
                phoneNumberWithCountryCode,
                appVerifier
            );

            console.log('✅ OTP sent successfully');
            setVerificationId(confirmationResult);
            setStep(2);
            setError('');
        } catch (err) {
            console.error('❌ Error sending OTP:', err);
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);
            
            // Handle specific Firebase errors
            if (err.code === 'auth/invalid-phone-number') {
                setError('Invalid phone number format');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many requests. Please try again later.');
            } else if (err.code === 'auth/captcha-check-failed') {
                setError('reCAPTCHA verification failed. Please refresh and try again.');
            } else if (err.message && err.message.includes('recaptcha')) {
                setError('reCAPTCHA error. Please refresh the page and try again.');
            } else {
                setError(err.message || 'Failed to send OTP. Please try again.');
            }
            
            // Reset reCAPTCHA
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP and create user in database
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('🔐 Verifying OTP:', otp);
            console.log('Test number:', isTestNumber);
            console.log('Verification ID type:', verificationId ? typeof verificationId : 'null');
            console.log('Verification ID object:', verificationId);
            
            // Always verify with Firebase (works for test numbers too)
            if (!verificationId) {
                setError('Verification session expired. Please request a new code.');
                setStep(1);
                setLoading(false);
                return;
            }

            // Double check if verificationId has the confirm method
            if (typeof verificationId.confirm !== 'function') {
                console.error('❌ verificationId.confirm is not a function:', verificationId);
                setError('Invalid verification session. Please request a new code.');
                setStep(1);
                setLoading(false);
                return;
            }

            console.log('🔐 Confirming with Firebase...');
            console.log('Phone number:', phoneNumber);
            console.log('OTP code:', otp);
            console.log('OTP length:', otp.length);
            
            let firebaseUser;
            
            try {
                // Ensure OTP is exactly 6 digits
                const cleanOTP = otp.trim();
                if (!/^\d{6}$/.test(cleanOTP)) {
                    setError('OTP must be exactly 6 digits');
                    setLoading(false);
                    return;
                }

                console.log('🔄 Calling verificationId.confirm()...');
                const result = await verificationId.confirm(cleanOTP);
                firebaseUser = result.user;
                console.log('✅ Firebase phone verification successful');
                console.log('Firebase UID:', firebaseUser.uid);
            } catch (firebaseError) {
                console.error('❌ Firebase verification failed:', firebaseError);
                console.error('Error code:', firebaseError.code);
                console.error('Error message:', firebaseError.message);
                console.error('Full error object:', JSON.stringify(firebaseError, null, 2));
                
                // Handle specific Firebase errors
                if (firebaseError.code === 'auth/invalid-verification-code') {
                    if (isTestNumber) {
                        setError(`Invalid code. For test number ${phoneNumber}, use: ${TEST_PHONE_NUMBERS[phoneNumber]}`);
                    } else {
                        setError('Invalid verification code. Please check and try again.');
                    }
                } else if (firebaseError.code === 'auth/code-expired') {
                    setError('Verification code expired. Please request a new one.');
                    setStep(1);
                } else if (firebaseError.code === 'auth/session-expired') {
                    setError('Verification session expired. Please request a new code.');
                    setStep(1);
                } else if (firebaseError.code === 'auth/too-many-requests') {
                    setError('Too many attempts. Please wait a few minutes and try again.');
                } else {
                    setError(firebaseError.message || 'Verification failed. Please try again.');
                }
                setLoading(false);
                return;
            }

            // 2. Get Clerk JWT token
            console.log('🔑 Getting Clerk token...');
            console.log('Debug - completedSignUp:', completedSignUp);
            console.log('Debug - user:', !!user);
            console.log('Debug - isLoaded:', isLoaded);
            
            let clerkToken;
            
            // Prioritize active user session over completedSignUp
            if (user && isLoaded) {
                // Post-registration flow: User is already signed in, get token from active session
                console.log('👤 Post-registration flow: Getting token from active user session');
                try {
                    clerkToken = await getToken();
                    console.log('✅ Clerk token obtained from active session');
                } catch (tokenError) {
                    console.error('❌ Error getting token from active session:', tokenError);
                    setError('Failed to get authentication token. Please sign in again.');
                    setLoading(false);
                    return;
                }
            } else if (completedSignUp && completedSignUp.createdSessionId) {
                // Registration flow: Temporarily activate session to get token, then deactivate
                console.log('📝 Registration flow: Getting token from completedSignUp');
                console.log('Debug - createdSessionId:', completedSignUp.createdSessionId);
                
                try {
                    // Temporarily set the session as active to get a token
                    console.log('Temporarily activating session to get token...');
                    await clerk.setActive({ session: completedSignUp.createdSessionId });
                    
                    // Now get the token
                    clerkToken = await getToken();
                    console.log('✅ Clerk token obtained from registration session');
                    
                    // Important: Don't sign out here, we need the session to remain active
                    // The parent component (ClerkRegister) will handle the final session state
                } catch (sessionError) {
                    console.error('❌ Error activating session or getting token:', sessionError);
                    setError('Failed to authenticate. Please try registering again.');
                    setLoading(false);
                    return;
                }
            } else {
                console.error('❌ No valid authentication method available');
                console.error('Need to sign in - redirecting...');
                setError('Please sign in to continue.');
                setLoading(false);
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
                return;
            }

            // 3. Send phone verification to Django
            console.log('💾 Saving phone to database...');
            const phoneVerifyResponse = await api.post(
                '/auth/verify-phone/',
                {
                    phone_number: phoneNumber,
                    firebase_uid: firebaseUser.uid,
                },
                {
                    headers: {
                        Authorization: `Bearer ${clerkToken}`,
                    },
                }
            );
            console.log('✅ Phone saved:', phoneVerifyResponse.data);

            // 5. Update user type and location in Django
            console.log('💾 Saving user type and location...');
            const updateTypeResponse = await api.post(
                '/auth/update-user-type/',
                {
                    user_type: userType,
                    location: location,
                },
                {
                    headers: {
                        Authorization: `Bearer ${clerkToken}`,
                    },
                }
            );
            console.log('✅ User type saved:', updateTypeResponse.data);

            // 6. Success! User is now fully registered
            console.log('🎉 Registration complete!');
            console.log('User data:', {
                clerkId: signUpData?.clerkUserId,
                email: signUpData?.email,
                phone: phoneNumber,
                userType: userType,
                location: location
            });

            // 7. Dispatch event to notify other components (like Navbar) that registration is complete
            console.log('📢 Dispatching registrationComplete event');
            window.dispatchEvent(new Event('registrationComplete'));
            
            // Give a small delay to allow the event to be processed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 8. Call completion callback - THIS IS CRUCIAL
            // This will activate the Clerk session in ClerkRegister component
            if (onComplete) {
                onComplete();
            }
        } catch (err) {
            console.error('❌ Verification error:', err);
            
            if (err.code === 'auth/invalid-verification-code') {
                setError('Invalid verification code. Please check and try again.');
            } else if (err.code === 'auth/code-expired') {
                setError('Verification code expired. Please request a new one.');
                setStep(1);
            } else if (err.code === 'auth/invalid-phone-number') {
                setError('Invalid phone number. Please try again.');
            } else if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError(err.message || 'Verification failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (resendDisabled) return;

        setError('');
        setLoading(true);
        setResendDisabled(true);
        setResendTimer(60);

        try {
            setupRecaptcha();
            const appVerifier = window.recaptchaVerifier;
            const phoneNumberWithCountryCode = `+977${phoneNumber}`;

            console.log('📞 Resending OTP to:', phoneNumberWithCountryCode);

            const confirmationResult = await signInWithPhoneNumber(
                auth,
                phoneNumberWithCountryCode,
                appVerifier
            );

            console.log('✅ OTP resent successfully');
            setVerificationId(confirmationResult);
            setOtp('');
            setError('');
        } catch (err) {
            console.error('❌ Error resending OTP:', err);
            setError(err.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Timer for resend button
    React.useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setResendDisabled(false);
        }
    }, [resendTimer]);

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

                {!isLoaded && (
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
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                            {loading ? (
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
                            disabled={loading || otp.length !== 6}
                            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                            {loading ? (
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
                            disabled={loading || resendDisabled}
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
