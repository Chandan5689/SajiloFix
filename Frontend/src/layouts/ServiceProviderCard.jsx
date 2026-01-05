import React from 'react'
import { TiMessageTyping } from "react-icons/ti";
import { FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import RatingBadge from '../components/RatingBadge';
function ServiceProviderCard({ provider }) {
    const navigate = useNavigate();
    return (
        <div className="bg-white rounded-lg shadow p-6 w-full max-w-xs">
            <div className="flex justify-center relative mb-3">
                <img
                    src={provider.img}
                    alt={provider.name}
                    className="w-20 h-20 rounded-full border-2 border-gray-200"
                />
                <div className="absolute top-0 left-0 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>
            <h3 className="text-center font-semibold text-lg">{provider.name}</h3>
            <div className="flex justify-center gap-1 text-sm mb-2">
                <span>Service:</span>
                <span className="text-center text-blue-600 font-medium">{provider.profession}</span>
            </div>
            <div className="flex justify-center gap-1 text-xs text-gray-600 mb-4">
                {provider.city && <span>{provider.city}</span>}
                {provider.district && <span>• {provider.district}</span>}
            </div>
            <div className="text-center text-yellow-500 flex items-center justify-center mb-4 space-x-1">
                <RatingBadge
                    providerId={provider.id}
                    fallbackRating={provider.rating}
                    fallbackCount={provider.reviews}
                    compact
                />
            </div>
            <div className="text-gray-700 space-y-1 mb-4 text-sm">
                <div className="flex justify-between">
                    <span className="font-semibold">Price: </span>
                                        {provider.price != null ? (
                                            <span className="text-green-600 font-semibold">
                                                NPR {provider.price}
                                                {provider.priceType === 'hourly' ? '/hour' : ''}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">Contact for price</span>
                                        )}
                </div>
                <div className="flex justify-between">
                    <span className="font-semibold">Experience: </span>
                    {provider.experience} years
                </div>
                <div className="flex justify-between">
                    <span className="font-semibold">Availability: </span>
                    <span className={`font-semibold ${provider.availability.includes("Today") ? "text-green-600" : "text-orange-400"}`}>
                        {provider.availability}
                    </span>
                </div>
                <div className="font-semibold pt-1">Specialties:</div>
                <div className="flex flex-wrap gap-1">
                    {provider.specialties.map((spec) => (
                        <span
                            key={spec}
                            className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                            {spec}
                        </span>
                    ))}
                </div>
            </div>
            <div className="flex gap-3">
                <button className="flex-1 py-2 px-4 text-blue-600 font-semibold border border-blue-600 rounded hover:bg-blue-600 hover:text-white flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer" onClick={() => alert("Message feature coming soon!")}>
                    <TiMessageTyping className="h-4 w-4" />
                    Message
                </button>
                <button className="flex-1 py-2 px-4 bg-green-600 text-white font-semibold rounded hover:bg-white hover:text-green-600 flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer border border-green-600" onClick={() => navigate(`/provider/${provider.id}`)}>
                    <FaCalendarAlt className="h-4 w-4" />
                    Book Now
                </button>
            </div>
        </div>
    )
}

export default ServiceProviderCard

