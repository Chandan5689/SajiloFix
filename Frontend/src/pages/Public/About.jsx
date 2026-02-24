import React from 'react'
import { FaAward, FaHandshake, FaUsers } from 'react-icons/fa'
import Team from "../../assets/team.jpg"
import Juli from "../../assets/juli12.jpg"
import Ramil from "../../assets/ramil.jpg"
import Chandan from "../../assets/team-member-chandan.jpg"

function About() {
    return (
        <section className='bg-gray-50 min-h-screen'>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        About SajiloFix
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Connecting homeowners with trusted professionals for all their service needs.
                    </p>
                </div>
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Our Mission
                        </h2>
                        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                            At SajiloFix, we believe that finding reliable home services shouldn't be a hassle. Our mission is to create a seamless connection between homeowners and skilled professionals.
                        </p>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            We're committed to building trust in the service industry by thoroughly vetting our professionals and ensuring every job meets our high standards.
                        </p>
                    </div>
                    <div className="relative">
                        <div className="aspect-3/2 w-full overflow-hidden rounded-2xl shadow-lg">
                            <img
                                src={Team}
                                alt="Our Team"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
                {/* Meet Our Team */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Meet Our Team
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
                        The passionate people behind SajiloFix who work to make your experience seamless.
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                    {[
                        { img: Juli, name: 'Aneel Chhetri', role: 'Frontend Developer & UI/UX' },
                        { img: Ramil, name: 'Ramil Lamichhane', role: 'Frontend & Database' },
                        { img: Chandan, name: 'Chandan Tiwari', role: 'Full Stack Developer' },
                    ].map((member) => (
                        <div key={member.name} className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-shadow duration-300">
                            <div className="aspect-square overflow-hidden">
                                <img
                                    src={member.img}
                                    alt={member.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="p-6 text-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                                <p className="text-green-600 font-medium">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Our Values
                    </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                           <FaHandshake className="text-blue-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Trust</h3>
                        <p className="text-gray-600">We build trust through transparency and reliability.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                           <FaAward className="text-green-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Excellence</h3>
                        <p className="text-gray-600">We strive for excellence in every service delivery.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                        <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaUsers className="text-purple-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Community</h3>
                        <p className="text-gray-600">Building a community of trusted professionals and satisfied customers.</p>
                    </div>
                </div>
            </div>
    </section >
  )
}

export default About