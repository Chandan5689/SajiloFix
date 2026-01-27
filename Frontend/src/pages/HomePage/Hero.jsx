import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HomeBackground from '../../assets/Home-background.jpg'
import backgroundhome from '../../assets/backgroundhome.png'
import {FaSearch,} from 'react-icons/fa'
import { FaLocationDot } from "react-icons/fa6";

function Hero() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        
        // Build URL params
        const params = new URLSearchParams();
        
        if (searchQuery.trim()) {
            params.set('q', searchQuery.trim());
        }
        
        if (location.trim()) {
            // Try to intelligently determine if it's a city or district
            // For simplicity, we'll just use the location as city filter
            // The Service page will handle more advanced filtering
            const locationValue = location.trim();
            
            // If user enters a location, search in both city and use it as search term
            // This allows the backend to match against city, district, or provider details
            params.set('city', locationValue);
            
            // Also add to general search so it can match district names
            if (!searchQuery.trim()) {
                params.set('q', locationValue);
            }
        }
        
        // Navigate to services page with search params
        navigate(`/services?${params.toString()}`);
    };

    return (
        <section className='relative bg-linear-to-br from-blue-50 to-white py-20'>
            <div className="absolute inset-0 bg-cover bg-center opacity-40"
                style={{
                    backgroundImage: `url(${backgroundhome})`,
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
                        <form onSubmit={handleSearch} className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='relative'>
                                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                    <div className='w-5 h-5 flex items-center justify-center'>
                                        <FaSearch className='text-green-500' />
                                    </div>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder='What services do you need?' 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className='w-full pl-10 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm outline-none' 
                                />
                            </div>
                            
                            <div className='relative'>
                                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                    <div className='w-5 h-5 flex items-center justify-center'>
                                        <FaLocationDot className='text-green-500' />
                                    </div>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder='City or District (e.g., Kathmandu)' 
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className='w-full pl-10 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm outline-none' 
                                />
                            </div>
                            
                            <button 
                                type="submit"
                                className='bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 font-medium transition-all duration-200 w-full flex items-center justify-center cursor-pointer whitespace-nowrap shadow-md text-lg'
                            >
                                <div className='flex items-center justify-center mr-2 w-5 h-5'>
                                    <FaSearch />
                                </div>
                                Find Professionals
                            </button>
                        </form>
                    </div>
                </div>

            </div>


        </section >
    )
}

export default Hero