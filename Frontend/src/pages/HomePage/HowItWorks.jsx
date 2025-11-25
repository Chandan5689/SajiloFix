import React from 'react'
import { FaCircleCheck, FaPerson } from 'react-icons/fa6'
import HowItWorks_Img1 from '../../assets/HowItWorks-1-Img.jpg'
import HowItWorks_Img2 from '../../assets/HowItWorks-2-Img.jpg'
import HowItWorks_Img3 from '../../assets/HowItWorks-3-Img.jpg'
import { FaCalendarCheck } from 'react-icons/fa'
import { Link } from 'react-router'
function HowItWorks() {
    const howItWorks = [
        {
            step_no: 1,
            title: "Choose Service",
            description: "Select the service you need from our wide range of professional offerings",
            icon: <FaCircleCheck />,
            image: HowItWorks_Img1
        },
        {
            step_no: 2,
            title: "Select Provider",
            description: "Browse through verified service providers and choose the one that fits your needs",
            icon: <FaPerson />,
            image: HowItWorks_Img2
        },
        {
            step_no: 3,
            title: "Book & Relax",
            description: "Schedule your service at a convenient time and let the professionals handle the rest",
            icon: <FaCalendarCheck />,
            image: HowItWorks_Img3
        }
    ]
    return (
        <section className='py-20 bg-white'>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4 font-[poppins, sans-serif']" >
                        How It Works
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Getting professional help for your home has never been easier. Follow these simple steps
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {howItWorks.map((step, index) => (
                        <div className="text-center relative" key={index}>
                            <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-6 relative z-10">
                                {step.step_no}
                            </div>

                            <div className='mb-6 rounded-xl overflow-hidden shadow-lg'>
                                <img src={step.image} alt={step.title} className="w-full h-48 object-cover object-top" />
                            </div>
                            <div className="w-16 h-16 bg-[#FFA928]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className='text-2xl text-[#FFA928]'>{step.icon}</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                {step.title}
                            </h3>
                            <p className='text-gray-600'>
                                {step.description}
                            </p>
                        </div>
                    ))}

                </div>
                <Link to='#'>
                    <div className='text-center mt-12'>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap">
                            Get Started Now
                        </button>

                    </div>
                </Link>
            </div>

        </section>
    )
}

export default HowItWorks