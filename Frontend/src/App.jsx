import { useState, useEffect } from 'react';
import './App.css'
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { SupabaseAuthProvider, useSupabaseAuth } from './context/SupabaseAuthContext';
import Navbar from './components/Navbar'
import RequireCompleteRegistration from './components/RequireCompleteRegistration'
import RequireProviderRole from './components/RequireProviderRole'
import RequireUserRole from './components/RequireUserRole'
import DashboardRouter from './components/DashboardRouter'
import ProfileRouter from './components/ProfileRouter'
import BookingsRouter from './components/BookingsRouter'
import HomePage from './pages/HomePage/HomePage'
import Footer from './components/Footer'
import About from './pages/Public/About'
import Contact from './pages/Public/Contact'
import HowItWorksPage from './pages/Public/HowItWorksPage'
import Service from './pages/Services/Service'
import BookingPage from './pages/Services/BookingPage'
import UserDashboard from './pages/Dashboard/User/UserDashboard'
import MyBookings from './pages/Dashboard/User/MyBookings'
import UserMyProfile from './pages/Dashboard/User/UserMyProfile'
import UserPayments from './pages/Dashboard/User/UserPayments'
import MyReviews from './pages/Dashboard/User/MyReviews'
import ProviderDashboard from './pages/Dashboard/Provider/ProviderDashboard'
import ProviderMyBookings from './pages/Dashboard/Provider/ProviderMyBookings'
import ProviderMyServices from './pages/Dashboard/Provider/ProviderMyServices'
import ProviderProfile from './pages/Dashboard/Provider/ProviderProfile'
import CustomerReviews from './pages/Dashboard/Provider/Reviews/CustomerReviews'
import ProviderEarnings from './pages/Dashboard/Provider/Earnings/ProviderEarnings'
import Availability from './pages/Dashboard/Provider/Availability/Availability'
import VerifyPhoneFlow from './pages/Auth/VerifyPhoneFlow';
import CompleteProviderProfile from './pages/Auth/CompleteProviderProfile';
import AuthCallback from './pages/Auth/AuthCallback';
import SupabaseLogin from './pages/Auth/SupabaseLogin'; 
import SupabaseRegister from './pages/Auth/SupabaseRegister';
import HelpSupport from './pages/Public/HelpSupport';
import React from 'react';
import Chatbot from './components/Chatbot';
import { ToastProvider } from './components/Toast';
import { UserProfileProvider } from './context/UserProfileContext';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminCustomers from './pages/Admin/AdminCustomers';
import AdminProviders from './pages/Admin/AdminProviders';
import AdminBookings from './pages/Admin/AdminBookings';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminSettings from './pages/Admin/AdminSettings';
import RequireAdminRole from './components/RequireAdminRole';
import EsewaSuccess from './pages/Payment/EsewaSuccess';
import EsewaFailure from './pages/Payment/EsewaFailure';
import PaymentHistory from './pages/Payment/PaymentHistory';
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useSupabaseAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

function App() {
    return (
        <SupabaseAuthProvider>
            <ToastProvider>
                <UserProfileProvider>
                    <Router>
                        <div>
                            <Navbar />
                            <Chatbot />
                            <main>
                                <Routes>
                                    {/* Public Routes */}
                                    
                                    <Route path='/' element={<HomePage />} />
                                    <Route path='/about' element={<About />} />
                                    <Route path='/contact' element={<Contact />} />
                                    <Route path='/howitworks' element={<HowItWorksPage />} />
                                    <Route path='/how-it-works' element={<HowItWorksPage />} />
                                    <Route path='/help-support' element={<HelpSupport />} />
                                    <Route path='/services' element={<Service />} />

                                    {/* Auth Routes */}
                                    <Route path='/login' element={<SupabaseLogin />} />
                                    <Route path='/register' element={<SupabaseRegister />} />
                                    <Route path='/auth/callback' element={<AuthCallback />} />

                                    {/* Payment Callback Routes (Protected) */}
                                    <Route
                                        path="/payment/esewa/success"
                                        element={
                                            <ProtectedRoute>
                                                <EsewaSuccess />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/payment/esewa/failure"
                                        element={
                                            <ProtectedRoute>
                                                <EsewaFailure />
                                            </ProtectedRoute>
                                        }
                                    />

                                    {/* Protected Auth Flow Routes */}
                                    <Route
                                        path="/verify-phone-flow"
                                        element={
                                            <ProtectedRoute>
                                                <VerifyPhoneFlow />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/complete-provider-profile"
                                        element={
                                            <ProtectedRoute>
                                                <CompleteProviderProfile />
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route path="/provider/:id" element={
                                        <ProtectedRoute>
                                            <RequireUserRole>
                                                <BookingPage />
                                            </RequireUserRole>
                                        </ProtectedRoute>
                                    } />

                                    {/* Protected Dashboard Routes - Single entry, route by user_type */}
                                    <Route
                                        path="/dashboard"
                                        element={
                                            <ProtectedRoute>
                                                <RequireCompleteRegistration>
                                                    <DashboardRouter />
                                                </RequireCompleteRegistration>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route path="/my-bookings" element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <BookingsRouter />
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/user/my-bookings" element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <RequireUserRole>
                                                    <MyBookings />
                                                </RequireUserRole>
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />
                                    <Route path='/profile' element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <ProfileRouter />
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />
                                    <Route path='/user/my-profile' element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <RequireUserRole>
                                                    <UserMyProfile />
                                                </RequireUserRole>
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />
                                    <Route path='/user/my-payments' element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <RequireUserRole>
                                                    <UserPayments />
                                                </RequireUserRole>
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />
                                    <Route path='/user/payment-history' element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <RequireUserRole>
                                                    <PaymentHistory />
                                                </RequireUserRole>
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />
                                    <Route path='/user/my-reviews' element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <RequireUserRole>
                                                    <MyReviews />
                                                </RequireUserRole>
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />

                                    {/* Keep a provider-specific path for deep links */}
                                    <Route path='/provider/dashboard' element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <RequireProviderRole>
                                                    <ProviderDashboard />
                                                </RequireProviderRole>
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />
                                    <Route path='/provider/my-bookings' element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <RequireProviderRole>
                                                    <ProviderMyBookings />
                                                </RequireProviderRole>
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />
                                    <Route path='/provider/my-services' element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <RequireProviderRole>
                                                    <ProviderMyServices />
                                                </RequireProviderRole>
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />
                                    <Route path='/provider/profile' element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <RequireProviderRole>
                                                    <ProviderProfile />
                                                </RequireProviderRole>
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />
                                    <Route path='/provider/reviews' element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <RequireProviderRole>
                                                    <CustomerReviews />
                                                </RequireProviderRole>
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />
                                    <Route path='/provider/earnings' element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <RequireProviderRole>
                                                    <ProviderEarnings />
                                                </RequireProviderRole>
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />

                                    <Route path='/provider/availability' element={
                                        <ProtectedRoute>
                                            <RequireCompleteRegistration>
                                                <RequireProviderRole>
                                                    <Availability />
                                                </RequireProviderRole>
                                            </RequireCompleteRegistration>
                                        </ProtectedRoute>
                                    } />

                                    {/* Admin Routes */}
                                    <Route
                                        path="/admin"
                                        element={
                                            <ProtectedRoute>
                                                <RequireAdminRole>
                                                    <AdminLayout />
                                                </RequireAdminRole>
                                            </ProtectedRoute>
                                        }
                                    >
                                        <Route index element={<AdminDashboard />} />
                                        <Route path="customers" element={<AdminCustomers />} />
                                        <Route path="providers" element={<AdminProviders />} />
                                        <Route path="bookings" element={<AdminBookings />} />
                                        <Route path="analytics" element={<AdminAnalytics />} />
                                        <Route path="settings" element={<AdminSettings />} />
                                    </Route>

                                </Routes>
                            </main>
                            <Footer />
                        </div>
                    </Router>
                </UserProfileProvider>
            </ToastProvider>
        </SupabaseAuthProvider>
    );
}

export default App
