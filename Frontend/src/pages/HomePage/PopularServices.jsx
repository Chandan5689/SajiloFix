import React from 'react'
import { FaWrench, FaBolt, FaBroom, FaHammer, FaSnowflake, FaPaintRoller, FaLeaf, FaTools } from 'react-icons/fa';
import { FaA, FaArrowRight } from 'react-icons/fa6';
import { Link } from 'react-router';
function PopularServices() {
    const serviceCategories = [
        { name: "Plumber", icon: <FaWrench />, color: "bg-blue-100 text-blue-600", description: "Pipe repairs & installations" },
        { name: "Electrician", icon: <FaBolt />, color: "bg-yellow-100 text-yellow-600", description: "Electrical repairs & wiring" },
        { name: "Cleaner", icon: <FaBroom />, color: "bg-green-100 text-green-600", description: "Home & office cleaning" },
        { name: "Carpenter", icon: <FaHammer />, color: "bg-amber-100 text-amber-600", description: "Furniture & wood work" },
        { name: "AC Repair", icon: <FaSnowflake />, color: "bg-cyan-100 text-cyan-600", description: "AC installation & repair" },
        { name: "Painter", icon: <FaPaintRoller />, color: "bg-purple-100 text-purple-600", description: "Interior & exterior painting" },
        { name: "Gardener", icon: <FaLeaf />, color: "bg-emerald-100 text-emerald-600", description: "Garden maintenance" },
        { name: "Appliance Repair", icon: <FaTools />, color: "bg-red-100 text-red-600", description: "Home appliance fixes" }
    ];
    return (
        <section className='py-32 bg-gray-50'>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4 font-['Poppins, sans-serif']" >
                        Popular Services
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Choose from our wide range of professional services to get your tasks done efficiently
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {serviceCategories.map((service, index) => (
                        <div key={index} className="bg-white p-6 rounded-2xl shadow-lg cursor-pointer group border border-gray-100 flex flex-col items-center text-center hover:scale-110 transition-transform duration-300">
                            <div className={`w-16 h-16 ${service.color} rounded-full flex items-center justify-center mb-4  `}>
                                <span className="text-2xl">{service.icon}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 font-['Poppins, sans-serif']" >
                                {service.name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                                {service.description}
                            </p>
                        </div>
                    ))}
                </div>
                <Link to="/services">
                    <div className="mt-12 text-center">
                        <button className="text-green-600 px-8 py-3 rounded-full font-medium hover:text-green-700 transition-all duration-300 cursor-pointer flex items-center space-x-2 mx-auto gap-2">
                            View All Services 
                            <span className='mt-1'><FaArrowRight /></span>
                            
                        </button>
                    </div>
                </Link>
            </div>
        </section>
    )
}

export default PopularServices