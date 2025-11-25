import React from 'react'
import { FaEnvelope, FaFacebookF, FaPhoneAlt, FaTwitter } from 'react-icons/fa'
import { FaLocationDot } from 'react-icons/fa6'
import { PiInstagramLogoFill } from "react-icons/pi";
import { Link } from 'react-router';


function Footer() {
    return (
        <footer className='bg-gray-900 text-white'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
                    {/* first section intro */}
                    <div className='col-span-1 md:col-span-2'>
                        <h3 className='text-2xl font-bold mb-4 font-[Poppins,sans-serif]'>SajiloFix</h3>
                        <p className='text-gray-400 leading-relaxed mb-6 font-normal'>
                            Your trusted platform for booking reliable service providers. From plumbing to electrical work, we connect you with verified professionals in your area.
                        </p>
                        {/* social media links */}
                        <div className='flex space-x-4'>
                            <button className="w-10 h-10 flex items-center justify-center bg-green-600
                            rounded-full cursor-pointer hover:bg-green-700 transition-colors">
                                <FaFacebookF className="text-white" />
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center bg-green-600 rounded-full cursor-pointer hover:bg-green-700 transition-colors">
                                <FaTwitter className="text-white" />
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center bg-green-600 rounded-full cursor-pointer hover:bg-green-700 transition-colors">
                                <PiInstagramLogoFill className="text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h4 className='font-semibold mb-4'>Quick Links</h4>
                        <ul className='space-y-2'>
                            <li>
                                <Link to="/about" className='text-gray-300 hover:text-white cursor-pointer'>About us</Link>
                            </li>
                            <li>
                                <Link to="/services" className='text-gray-300 hover:text-white cursor-pointer'>Services</Link>
                            </li>
                            <li>
                                <Link to="/howitworks" className='text-gray-300 hover:text-white cursor-pointer'>How It Works</Link>
                            </li>
                            <li>
                                <Link to="/contact" className='text-gray-300 hover:text-white cursor-pointer'>Contact us</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact US */}
                    <div>
                        <h4 className='font-semibold mb-4'>Contact Us</h4>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <div className='w-5 h-5 flex items-center justify-center mr-3'>
                                    <FaPhoneAlt className='text-[#ffa928]' />
                                </div>
                                <span className="text-gray-300">+977 1234567890</span>
                            </div>
                            <div className="flex items-center">
                                <div className='w-5 h-5 flex items-center justify-center mr-3'>
                                    <FaEnvelope className='text-[#ffa928]' />
                                </div>
                                <span className="text-gray-300">support@sajilofix.com</span>
                            </div>
                            <div className="flex items-center">
                                <div className='w-5 h-5 flex items-center justify-center mr-3 mt-0.5'>
                                    <FaLocationDot className='text-[#ffa928]' />
                                </div>
                                <span className="text-gray-300">Simalchour-8,Pokhara
                                    <br />
                                    Kaski,Nepal
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* copyright part */}
                <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-300 text-sm">&copy; 2025 SajiloFix . All rights reserved.</p>
                    <div className="flex items-center space-x-6 mt-4 md:mt-0 ">
                        <a href="#" className='text-gray-300 hover:text-white text-sm cursor-pointer'>Privacy Policy</a>
                        <a href="#" className='text-gray-300 hover:text-white text-sm cursor-pointer'>Terms of Service</a>
                    </div>
                </div>

            </div>

        </footer >
    )
}

export default Footer