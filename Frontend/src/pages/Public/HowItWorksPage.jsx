import React from 'react'
import HowItWorks from '../HomePage/HowItWorks'
import { FaClock, FaHeadset, FaShieldAlt, FaStar } from 'react-icons/fa'
function HowItWorksPage() {
  return (
    <div>
      <HowItWorks />

      <div className="bg-gray-50 rounded-2xl p-12 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Why Choose SajiloFix?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="text-blue-600 text-2xl" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Verified Professionals</h4>
            <p className="text-gray-600 text-sm">All service providers are background checked and verified</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FaClock className="text-green-600 text-2xl" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Quick Booking</h4>
            <p className="text-gray-600 text-sm">Book services in minutes, get help when you need it</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FaStar className="text-purple-600 text-2xl" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Quality Guaranteed</h4>
            <p className="text-gray-600 text-sm">100% satisfaction guarantee on all completed services</p>
          </div>
          <div className="text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FaHeadset className="text-orange-600 text-2xl" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h4>
            <p className="text-gray-600 text-sm">Round-the-clock customer support for any assistance</p>
          </div>
        </div>
      </div>

    </div>

  )
}

export default HowItWorksPage