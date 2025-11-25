import React from 'react'
import { FaTimes } from 'react-icons/fa';
import { FcGoogle } from "react-icons/fc";
import { FaEnvelope } from "react-icons/fa";
import { FaLock } from "react-icons/fa";
import { Link } from 'react-router';
function Login() {
    return (
        <div className='min-h-screen bg-linear-to-br from-blue-50 to-white flex items-center justify-center p-4'>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
                <button
                    
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                    <FaTimes className='text-xl'/>
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
                    </div>
                    <form  className="space-y-6">
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
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>
                        <div className="mt-6 grid ">
                            <button className="w-full inline-flex justify-center py-2 px-4 border-2 border-blue-500 shadow-sm text-sm font-medium text-gray-500 hover:bg-blue-50 cursor-pointer rounded-lg">
                                <FcGoogle className="mr-2 text-xl"/>
                                Google
                            </button>
                            {/* <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer">
                                <i className="fab fa-facebook-f mr-2 text-blue-600"></i>
                                Facebook
                            </button> */}
                        </div>
                    </div>
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?
                            <button
                                
                                className="ml-1 text-blue-600 hover:text-blue-500 font-medium cursor-pointer"
                            >
                                <Link to="/register">
                                Sign up here
                                </Link>
                            </button>
                        </p>
                    </div>
                </div>
            </div>
    </div >
  )
}

export default Login