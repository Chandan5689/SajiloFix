import React from 'react';
// Import necessary icons
import { FiEye, FiPhone, FiMapPin, FiCheck, FiX } from 'react-icons/fi';
import { MdStarRate } from 'react-icons/md';

// Define the configuration for all possible buttons
const actionConfig = {
    view: {
        text: 'View Details',
        icon: FiEye,
        classes:'text-white bg-blue-600 border border-blue-600 hover:bg-white hover:text-blue-600',

    },
    call: {
        text: 'Call Customer',
        icon: FiPhone,
        classes: 'text-blue-600 bg-white border-2 border-blue-600 hover:bg-blue-50',

    },
    directions: {
        text: 'Get Directions',
        icon: FiMapPin,
        classes: 'text-green-600 bg-white border-2 border-green-600 hover:bg-green-600 hover:text-white',

    },
    accept: {
        text: 'Accept',
        icon: FiCheck,
        classes: 'text-white bg-green-600  hover:bg-green-700', // Primary action

    },
    decline: {
        text: 'Decline',
        icon: FiX,
        classes: 'text-red-600 bg-white border-2 border-red-600 hover:bg-red-600 hover:text-white', // Destructive action

    },
};

const ProviderBookingCard = ({ booking }) => {
    const { title, customer, rating, location, description, schedule, phoneNumber, amount, status, actions } = booking;

    // Function to determine status badge styles
    const getStatusClasses = (status) => {
        switch (status) {
            case 'Confirmed':
                return 'bg-green-100 text-green-700';
            case 'Scheduled':
                return 'bg-yellow-100 text-yellow-700';
            case 'In Progress':
                return 'bg-blue-100 text-blue-700';
            case 'Completed':
                return 'bg-green-100 text-green-900';
            case 'Cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };


    const defaultBtnClasses = 'flex items-center px-4 py-2 text-sm font-medium rounded-md transition duration-150';

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-6 relative">
            <div className={`absolute top-4 right-4 px-3 py-1 text-sm font-semibold rounded-full ${getStatusClasses(status)}`}>
                {status}
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>

            {/* Grid Layout for Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-28 items-start">
                {/* Customer Info */}
                <div>
                    <p className="text-sm font-medium text-gray-500">Customer</p>
                    <p className="text-gray-900 font-medium">{customer}</p>
                    <div className="flex items-center space-x-1 text-yellow-400">
                        {[...Array(5)].map((_, i) => {
                            const starNumber = i + 1;
                            return starNumber <= Math.floor(booking.rating) ? (
                                <MdStarRate key={i} />
                            ) : starNumber - booking.rating < 1 ? (
                                <MdStarRate key={i} style={{ clipPath: "inset(0 50% 0 0)" }} />
                            ) : (
                                <MdStarRate key={i} className="text-gray-300" />
                            );
                        })}
                        <span className="text-gray-700">{booking.rating.toFixed(1)}</span>
                    </div>
                </div>

                {/* Schedule */}
                <div>
                    <p className="text-sm font-medium text-gray-500">Schedule</p>
                    <p className="text-gray-900 font-medium">{schedule.date}</p>
                    <p className="text-gray-600 text-sm">{schedule.time}</p>

                </div>

                {/* Amount */}
                <div>
                    <p className="text-sm font-medium text-gray-500">Amount</p>
                    <p className="text-lg font-bold text-green-600">${amount}</p>
                </div>
            </div>

            {/* Location and Description */}
            <div className="mt-4">
                <div className='grid gap-2 sm:grid-cols-2 sm:gap-20'>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Location</p>
                        <p className="text-gray-800 mb-2">{location}</p>    
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Phone Number</p>
                        <p className="text-gray-900 font-medium">{phoneNumber}</p>
                    </div>
                </div>

                <p className="text-sm text-gray-600  pt-2 mt-2">{description}</p>

            </div>

            {/* Actions: MINIMIZED CODE */}
            <div className="flex flex-wrap gap-3 mt-6 pt-4 ">
                {actions.map(actionKey => {
                    const config = actionConfig[actionKey];
                    if (!config) return null; // Skip if action is not configured
                    const Icon = config.icon; // Component for React Icon
                    let onClickHandler = () => console.log(`${actionKey} action clicked for ${title}`);

                    return (
                        <button
                            key={actionKey}
                            onClick={onClickHandler}
                            className={`${defaultBtnClasses} ${config.classes} cursor-pointer`}
                        >
                            <Icon className="w-4 h-4 mr-2" />
                            {config.text}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ProviderBookingCard;


