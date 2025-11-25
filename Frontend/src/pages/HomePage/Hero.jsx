import React from 'react'
import HomeBackground from '../../assets/Home-background.jpg'
import {FaSearch,} from 'react-icons/fa'
import { FaLocationDot } from "react-icons/fa6";
function Hero() {
    return (
        <section className='relative bg-linear-to-br from-blue-50 to-white py-20'>
            <div className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{
                    backgroundImage: `url(${HomeBackground})`,
                    width: '100% ',
                    height: '600px',
                }}>
            </div>
            <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full'>
                <div className='text-center'>
                    <h1 className='text-4xl md:text-6xl font-bold text-gray-900 mb-6'>
                        Find Trusted
                        <span className='text-green-600 pl-4'>Service Providers</span>
                        <br />
                        Near You
                    </h1>
                    <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
                        Book reliable plumbers, electricians, cleaners, and more. Get your home services done by verified professionals.
                    </p>
                    <div className='bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-4xl mx-auto'>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='relative'>
                                <div className='absolute inset-y-0 left-0 pl-3 flex items-center'>
                                    <div className='w-5 h-5 flex items-center-safe justify-center-safe
                                    '>
                                        <FaSearch className='text-green-500' />

                                    </div>

                                </div>
                                <input type="text" placeholder='What services do you need?' className='w-full pl-10 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm outline-none' />

                            </div>
                            <div className='relative'>
                                <div className='absolute inset-y-0 left-0 pl-3 flex items-center'>
                                    <div className='w-5 h-5 flex items-center-safe justify-center-safe
                                    '>
                                        <FaLocationDot className='text-green-500' />

                                    </div>

                                </div>
                                <input type="text" placeholder='Enter your location' className='w-full pl-10 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm outline-none' />

                            </div>
                            <button className='bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 font-medium  transition-all  duration-200 w-full flex items-center justify-center cursor-pointer whitespace-nowrap shadow-md text-lg '>
                                <div className='flex items-center justify-center mr-2 w-5 h-5'>
                                    <FaSearch />
                                </div>
                                Find Professionals
                            </button>
                        </div>

                    </div>
                </div>

            </div>


        </section >
    )
}

export default Hero