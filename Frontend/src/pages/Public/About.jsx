import React from 'react'
import { FaAward, FaHandshake, FaUsers } from 'react-icons/fa'

function About() {
    return (
        <section className='bg-gray-50 min-h-screen'>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        About SajiloFix
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Connecting homeowners with trusted professionals for all their service needs.
                    </p>
                </div>
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Our Mission
                        </h2>
                        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                            At SajiloFix, we believe that finding reliable home services shouldn't be a hassle. Our mission is to create a seamless connection between homeowners and skilled professionals.
                        </p>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            We're committed to building trust in the service industry by thoroughly vetting our professionals and ensuring every job meets our high standards.
                        </p>
                    </div>
                    <div>
                        <img
                            src="https://readdy.ai/api/search-image?query=professional%20home%20service%20team%20diverse%20group%20of%20workers%20with%20tools%20smiling%20confident%20modern%20clean%20background%20high%20quality%20photography&width=600&height=400&seq=about1&orientation=landscape"
                             alt="Our Team"
                            className="w-full h-auto rounded-2xl shadow-lg object-cover"
                        />
                    </div>
                </div>
                {/* <div className="bg-white rounded-2xl p-12 shadow-lg mb-20">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-blue-600 mb-2">10,000+</div>
                            <div className="text-gray-600">Happy Customers</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                            <div className="text-gray-600">Verified Professionals</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
                            <div className="text-gray-600">Service Categories</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-blue-600 mb-2">4.9★</div>
                            <div className="text-gray-600">Average Rating</div>
                        </div>
                    </div>
                </div> */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Our Values
                    </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                           <FaHandshake className="text-blue-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Trust</h3>
                        <p className="text-gray-600">We build trust through transparency and reliability.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                           <FaAward className="text-green-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Excellence</h3>
                        <p className="text-gray-600">We strive for excellence in every service delivery.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                        <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaUsers className="text-purple-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Community</h3>
                        <p className="text-gray-600">Building a community of trusted professionals and satisfied customers.</p>
                    </div>
                </div>
            </div>
    </section >
  )
}

export default About