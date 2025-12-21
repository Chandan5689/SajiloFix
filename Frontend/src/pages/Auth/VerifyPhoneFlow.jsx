import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import PhoneVerification from './PhoneVerification';
import LocationSelector from '../../components/LocationSelector';
import api from '../../api/axios';

function VerifyPhoneFlow() {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();
    const [userType, setUserType] = useState(null);
    const [location, setLocation] = useState(null);

    // Check if phone is already verified
    React.useEffect(() => {
        const checkPhoneVerification = async () => {
            if (!user) {
                console.log('⚠️ User not loaded yet, redirecting to sign in...');
                // If user is not authenticated, redirect to login
                navigate('/login');
                return;
            }
            
            try {
                const token = await user.getToken();
                const response = await api.get('/auth/me/', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.data.phone_verified) {
                    // Phone already verified, redirect based on user type
                    if (response.data.user_type === 'offer') {
                        navigate('/provider/dashboard');
                    } else {
                        navigate('/');
                    }
                }
            } catch (err) {
                console.error('Error checking phone verification:', err);
            }
        };

        if (isLoaded) {
            checkPhoneVerification();
        }
    }, [user, isLoaded, navigate]);

    const handlePhoneVerified = () => {
        if (userType === 'offer') {
            navigate('/complete-provider-profile');
        } else {
            navigate('/');
        }
    };

    if (!userType) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Welcome to SajiloFix!
                        </h2>
                        <p className="text-gray-600">
                            How would you like to use our platform?
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => setUserType('find')}
                            className="w-full py-4 px-6 border-2 border-blue-600 rounded-xl hover:bg-blue-50 transition-all"
                        >
                            <div className="text-4xl mb-2">🔍</div>
                            <h3 className="font-semibold text-lg">Find Services</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                I'm looking for service providers
                            </p>
                        </button>

                        <button
                            onClick={() => setUserType('offer')}
                            className="w-full py-4 px-6 border-2 border-green-600 rounded-xl hover:bg-green-50 transition-all"
                        >
                            <div className="text-4xl mb-2">🛠️</div>
                            <h3 className="font-semibold text-lg">Offer Services</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                I'm a service provider
                            </p>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!location) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            📍 Where are you located?
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Help us find nearby service providers in your area
                        </p>
                    </div>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (location) {
                            // Location is set, continue to phone verification
                        }
                    }} className="space-y-6">
                        <LocationSelector 
                            value={location}
                            onChange={setLocation}
                            error=""
                        />

                        <button
                            type="button"
                            onClick={() => location && handlePhoneVerified?.()}
                            disabled={!location}
                            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-semibold"
                        >
                            Continue to Phone Verification
                        </button>

                        <button
                            type="button"
                            onClick={() => setUserType(null)}
                            className="w-full text-gray-600 hover:text-gray-700 font-medium"
                        >
                            ← Back to User Type Selection
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return <PhoneVerification userType={userType} location={location} onComplete={handlePhoneVerified} />;
}

export default VerifyPhoneFlow;