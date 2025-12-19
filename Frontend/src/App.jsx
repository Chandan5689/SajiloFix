import { useState, useEffect } from 'react'
import './App.css'
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
// import { FirebaseAuthProvider, useFirebaseAuth } from './context/FirebaseAuthContext';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Navbar from './components/Navbar'
import RequireCompleteRegistration from './components/RequireCompleteRegistration'
import RequireProviderRole from './components/RequireProviderRole'
import RequireUserRole from './components/RequireUserRole'
import DashboardRouter from './components/DashboardRouter'
import ProfileRouter from './components/ProfileRouter'
import BookingsRouter from './components/BookingsRouter'
import Register from './pages/Auth/Register'
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
import ProviderDashboard from './pages/Dashboard/Provider/ProviderDashboard'
import ProviderMyBookings from './pages/Dashboard/Provider/ProviderMyBookings'
import ProviderMyServices from './pages/Dashboard/Provider/ProviderMyServices/ProviderMyServices'
import CustomerReviews from './pages/Dashboard/Provider/Reviews/CustomerReviews'
import ProviderEarnings from './pages/Dashboard/Provider/Earnings/ProviderEarnings'
import MyProfile from './pages/Dashboard/Provider/ProviderMyProfile/MyProfile'
import Availability from './pages/Dashboard/Provider/Availability/Availability'
import Login from './pages/Auth/Login/Login'
import VerifyPhoneFlow from './pages/Auth/VerifyPhoneFlow';
import CompleteProviderProfile from './pages/Auth/CompleteProviderProfile';
import api from './api/axios';
import ClerkLogin from './pages/Auth/ClerkLogin';
import ClerkRegister from './pages/Auth/ClerkRegister';
import SSOCallback from './pages/Auth/SSOCallback';



const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;


function ProtectedRoute({ children }) {
    return (
        <>
            <SignedIn>{children}</SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </>
    );
}

function App() {
    return (
        <ClerkProvider publishableKey={clerkPubKey}>
            <Router>
                <div className='App'>
                    <Navbar />
                    <main>
                        <Routes>
                            {/* Public Routes */}
                            <Route path='/' element={<HomePage />} />
                            <Route path='/about' element={<About />} />
                            <Route path='/contact' element={<Contact />} />
                            <Route path='/howitworks' element={<HowItWorksPage />} />
                            <Route path='/services' element={<ProtectedRoute><Service /></ProtectedRoute>} />

                            {/* Auth Routes */}
                            <Route path='/login' element={<ClerkLogin />} />
                            <Route path='/register' element={<ClerkRegister />} />
                            <Route path="/sso-callback" element={<SSOCallback />} />

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

                            <Route path="/provider/:id" element={<BookingPage />} />

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
                            <Route path='/provider/my-profile' element={
                                <ProtectedRoute>
                                    <RequireCompleteRegistration>
                                        <RequireProviderRole>
                                            <MyProfile />
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

                        </Routes>
                    </main>
                    <Footer />
                </div>
            </Router>

        </ClerkProvider>

    );
}

export default App
