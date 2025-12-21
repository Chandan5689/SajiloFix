import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginFormLayout from './LoginFormLayout';
import ContinueSection from './ContinueSection';
import { useFirebaseAuth } from '../../../context/FirebaseAuthContext';
import api from '../../../api/axios';

function Login() {
    const navigate = useNavigate();
    const { login, getIdToken, refreshDjangoUser } = useFirebaseAuth();
    const [activeTab, setActiveTab] = useState("Customer");
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleSubmit = async () => {
        setError('');
        setFieldErrors({});
        
        // Validation
        const errors = {};
        if (!email.trim()) {
            errors.email = 'Email is required';
        }
        if (!password) {
            errors.password = 'Password is required';
        }
        
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return; 
        }

        setLoading(true);

        try {
            // Login with Firebase
            await login(email, password);
            
            // Get Firebase ID token
            const idToken = await getIdToken();
            
            // Fetch Django user data
            const djangoUser = await refreshDjangoUser();
            
            console.log('Login successful!', djangoUser);
            
            // Check if user needs to complete registration
            if (djangoUser?.registration_complete === false || djangoUser?.requires_phone_verification) {
                navigate('/verify-phone-flow');
                return;
            }
            
            // Redirect based on user type and active tab
            if (activeTab === "Admin") {
                // For admin login, check if user is staff/superuser
                if (djangoUser && (djangoUser.is_staff || djangoUser.is_superuser)) {
                    window.location.href = '/admin/'; // Django admin panel
                } else {
                    setError('You do not have admin privileges');
                    setLoading(false);
                }
            } else if (activeTab === "Service Provider") {
                if (djangoUser && djangoUser.user_type === 'offer') {
                    navigate('/provider/dashboard');
                } else {
                    setError('This account is not registered as a service provider');
                    setLoading(false);
                }
            } else { // Customer
                if (djangoUser && djangoUser.user_type === 'find') {
                    navigate('/');
                } else {
                    setError('This account is not registered as a customer');
                    setLoading(false);
                }
            }
            
        } catch (err) {
            console.error('Login error:', err);
            let errorMessage = 'Invalid email or password';
            
            if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (err.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <LoginFormLayout 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                email={email}
                password={password}
                setEmail={setEmail}
                setPassword={setPassword}
                rememberMe={rememberMe}
                setRememberMe={setRememberMe}
                handleSubmit={handleSubmit}
                loading={loading}
                error={error}
                fieldErrors={fieldErrors}
            >
                {/* RENDER DIFFERENT CONTENT FOR EACH TAB */}
                {activeTab === "Customer" && (
                    <ContinueSection />
                )}

                {activeTab === "Service Provider" && (
                    <ContinueSection />
                )}

                {activeTab === "Admin" && (
                    <div className="text-center text-sm text-gray-600 mt-4">
                        <p>Admin users, please use your staff credentials</p>
                    </div>
                )}
            </LoginFormLayout>
        </div>
    );
}

export default Login;
