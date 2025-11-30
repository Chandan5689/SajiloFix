import React, { useState } from 'react'
import { FaTimes } from 'react-icons/fa';
import { FcGoogle } from "react-icons/fc";
import { FaEnvelope } from "react-icons/fa";
import { FaLock } from "react-icons/fa";
import { Link } from 'react-router';
import ContinueSection from './ContinueSection';
function LoginFormLayout({ activeTab, setActiveTab, children }) {
    
    const tabs = ["Customer", "Service Provider", "Admin"]
    return (
        <div className='min-h-screen bg-linear-to-br from-blue-50 to-white flex items-center justify-center p-4'>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
                <button

                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                    <FaTimes className='text-xl' />
                </button>
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2

                            className="text-3xl font-bold text-blue-600 mb-2 cursor-pointer hover:text-blue-700 transition-colors duration-300"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                            SajiloFix
                        </h2>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Welcome back
                        </h3>
                        <p className="text-gray-600">
                            Sign in to your account to continue
                        </p>
                        <div className="mt-8 flex sm:max-w-96 space-x-4 mb-2 bg-gray-200 rounded-lg">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 m-1 py-2 flex justify text-sm font-medium rounded transition cursor-pointer ${activeTab === tab
                                        ? "bg-white text-green-600"
                                        : "text-gray-700 hover:text-gray-900"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                    <form className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email address
                            </label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="email"

                                    placeholder="Enter your email"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="password"


                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="remember"

                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-gray-700 cursor-pointer">
                                    Remember me
                                </label>
                            </div>
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer">
                                Forgot password?
                            </a>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap rounded-lg"
                        >
                            Log In
                        </button>
                    </form>
                        <div>
                            {children}
                        </div>
                </div>
            </div>
        </div >
    )
}

export default LoginFormLayout