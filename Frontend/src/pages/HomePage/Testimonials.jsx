import React, { useEffect, useState } from 'react'
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const testimonials = [
    {
        id: 1,
        name: "Emily Rodriguez",
        role: "Property Manager",
        image: "/images/user1.jpg",
        text: "Excellent platform for finding reliable contractors. The booking process is smooth and all providers are verified.",
        rating: 5,
    },
    {
        id: 2,
        name: "Michael Smith",
        role: "Homeowner",
        image: "/images/user2.jpg",
        text: "I found a plumber in less than 10 minutes! The whole process was simple and transparent.",
        rating: 5,
    },
    {
        id: 3,
        name: "Sarah Johnson",
        role: "Interior Designer",
        image: "/images/user3.jpg",
        text: "Highly recommend this platform. All professionals are skilled and punctual.",
        rating: 5,
    },
    {
        id: 4,
        name: "David Lee",
        role: "Business Owner",
        image: "/images/user4.jpg",
        text: "The service providers are verified and professional. Saved me a lot of time and effort!",
        rating: 5,
    },
];
function Testimonials() {
    const [current, setCurrent] = useState(0);
    //Auto slide every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 3000);
        return () => clearInterval(interval);
    }, [current]);

    const nextSlide = () => {
        setCurrent((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    }
    const prevSlide = () => {
        setCurrent((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };
    return (
        <section className='py-20 bg-gray-50'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='text-center mb-12'>
                    <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>What Our Customers Say</h2>
                    <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
                        Don't just take our word for it. Here's what our satisfied customers have to say
                    </p>
                </div>
                {/* carousel slider container */}
                <div className='relative max-w-4xl mx-auto'>
                    {testimonials.map((t, index) => (
                        <div key={t.id} className={`transition-opacity duration-700 ease-in-out ${index === current ? "opacity-100" : "opacity-0 absolute inset-0"
                            }`}>
                            <div className="bg-white shadow-lg rounded-xl p-8 text-center max-w-2xl mx-auto">
                                {/* Star Rating */}
                                <div className="text-yellow-400 mb-4 text-lg">
                                    {"★".repeat(t.rating)}
                                </div>
                                <p className="text-gray-700 text-lg italic mb-6">"{t.text}"</p>
                                <div className="flex justify-center items-center gap-3">
                                    <img
                                        src={t.image}
                                        alt={t.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">{t.name}</p>
                                        <p className="text-gray-500 text-sm">{t.role}</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ))}

                    {/* Navigation Buttons */}
                    <button
                        onClick={prevSlide}
                        className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white shadow-md p-3 rounded-full hover:bg-gray-100 cursor-pointer"
                    >
                        <FaArrowLeft className="text-gray-700" />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white shadow-md p-3 rounded-full hover:bg-gray-100 cursor-pointer"
                    >
                        <FaArrowRight className="text-gray-700" />
                    </button>
                    
                    {/* Pagination Dots */}
                    <div className="flex justify-center mt-6 space-x-2">
                        {testimonials.map((_, index) => (
                            <span
                                key={index}
                                onClick={() => setCurrent(index)}
                                className={`h-2 w-2 rounded-full cursor-pointer ${current === index ? "bg-green-600" : "bg-gray-300"
                                    }`}
                            ></span>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    )
}

export default Testimonials