import React from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaQuestionCircle, FaBook, FaComments } from 'react-icons/fa';

function HelpSupport() {
    const supportOptions = [
        {
            icon: FaQuestionCircle,
            title: 'FAQs',
            description: 'Find answers to common questions',
            color: 'blue',
        },
        {
            icon: FaBook,
            title: 'User Guide',
            description: 'Learn how to use SajiloFix',
            color: 'green',
        },
        // {
        //     icon: FaComments,
        //     title: 'Live Chat',
        //     description: 'Chat with our support team',
        //     color: 'purple',
        // },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Help & Support
                    </h1>
                    <p className="text-gray-600 text-lg">
                        We're here to help. Choose an option below or contact us directly.
                    </p>
                </div>

                {/* Support Options */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {supportOptions.map((option, index) => {
                        const Icon = option.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                            >
                                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-${option.color}-100`}>
                                    <Icon className={`text-2xl text-${option.color}-600`} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {option.title}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    {option.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-md p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
                        Contact Us Directly
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <FaEnvelope className="text-green-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email Support</p>
                                <a
                                    href="mailto:support@sajilofix.com"
                                    className="text-green-600 font-medium hover:underline"
                                >
                                    support@sajilofix.com
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <FaPhone className="text-blue-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone Support</p>
                                <a
                                    href="tel:+9779800000000"
                                    className="text-blue-600 font-medium hover:underline"
                                >
                                    +977 1234567890
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back Link */}
                <div className="text-center mt-8">
                    <Link
                        to="/"
                        className="text-green-600 hover:text-green-700 font-medium"
                    >
                        ← Back to homepage
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default HelpSupport;
