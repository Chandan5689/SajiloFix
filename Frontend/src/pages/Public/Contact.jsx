import React from 'react'
import { FaEnvelope, FaPhone, FaPhoneAlt } from 'react-icons/fa'
import { FaLocationDot } from 'react-icons/fa6'

function Contact() {
    return (
        <section className='bg-gray-50 '>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 font-['Poppins,sans-serif']" >
                        Contact Us
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Have questions or need help? We're here to assist you.
                    </p>
                </div>
                <div className="grid lg:grid-cols-2 gap-12">
                    <div className="bg-white rounded-2xl p-8 shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                        <form className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                    <input type="text" placeholder="John" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                    <input type="text" placeholder="Doe" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input type="email" placeholder="john@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                <input type="text" placeholder="How can we help you?" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                <textarea rows={6} placeholder="Tell us more..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none outline-none"></textarea>
                            </div>
                            <button type="submit" className="w-full bg-green-600 text-white py-3 font-semibold hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap rounded-xl">
                                Send Message
                            </button>
                        </form>
                    </div>
                    <div>
                        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                            <div className="space-y-6">
                                <div className="flex items-center">
                                    <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                                        <FaPhoneAlt className="text-blue-600 text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Phone</h3>
                                        <p className="text-gray-600">+1 (555) 123-4567</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                                        <FaEnvelope className="text-green-600 text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                                        <p className="text-gray-600">support@sajilofix.com</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                                        <FaLocationDot className="text-purple-600 text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                                        <p className="text-gray-600">Simalchour-8,Pokhara,Nepal</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
     

    </section >
  )
}

export default Contact