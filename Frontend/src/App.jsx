import { useState } from 'react'

import './App.css'
import Navbar from './components/Navbar'
import Register from './pages/Auth/Register'
import Login from './pages/Auth/Login'
import HomePage from './pages/HomePage/HomePage'
import { BrowserRouter, Router, Route, Routes } from 'react-router-dom'
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
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter>
        <div className=''>
          <Navbar />
          <main>
            <Routes>
              <Route path='/' element={<HomePage />} />
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Register />} />
              <Route path='/about' element={<About />} />
              <Route path='/contact' element={<Contact />} />
              <Route path='/howitworks' element={<HowItWorksPage />} />
              <Route path='/services' element={<Service />} />
              <Route path="/provider/:id" element={<BookingPage />} />
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/my-bookings" element={<MyBookings />} />
              <Route path='/user/my-profile' element={<UserMyProfile />} />
              <Route path='/user/my-payments' element={<UserPayments />} />
              <Route path='/provider/dashboard' element={<ProviderDashboard />} />
              <Route path='/provider/my-bookings' element={<ProviderMyBookings />} />
              <Route path='/provider/my-services' element={<ProviderMyServices />} />
              <Route path='/provider/reviews' element={<CustomerReviews />} />
              <Route path='/provider/earnings' element={<ProviderEarnings />} />
              <Route path='/provider/my-profile' element={<MyProfile />} />
              <Route path='/provider/availability' element={<Availability />} />
              

              
              
            </Routes>
          </main>
          <Footer />
        </div>

      </BrowserRouter>
    </>
  )
}

export default App
