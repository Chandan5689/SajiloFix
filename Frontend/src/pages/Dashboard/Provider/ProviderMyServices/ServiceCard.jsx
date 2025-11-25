import React from "react";
import { MdEdit } from "react-icons/md";


export default function ServiceCard({ service, onEdit,onStatusToggle }) {
    const isNew = service.id === 'placeholder' || service.bookings === 0
    return (
        <div className='bg-white p-6 rounded-lg shadow border border-gray-100'>
            <div className='flex justify-between items-center mb-2'>
                <div>
                    <p className="font-semibold text-lg capitalize">{service.serviceName}</p>
                    <p className="text-gray-700 text-sm">{service.category}</p>
                </div>
                <StatusToggleSwitch
                    serviceId={service.id}
                    currentStatus={service.status}
                    onToggle={onStatusToggle}
                />
            </div>

            <div className='flex items-start justify-between gap-2 mt-4'>
                <div>
                    <p className='font-medium text-sm text-gray-500'>Price</p>
                    <p className='text-blue-600 font-bold text-lg'>$ {service.price}</p>
                </div>
                <div>
                    <p className='font-medium text-sm text-gray-500'>Duration</p>
                    <p className='text-gray-800 font-semibold text-md'>{service.duration}</p>
                </div>
            </div>
            <div className='mt-3'>
                <p className='font-normal text-sm text-gray-500'>{service.description}</p>
            </div>
            <div className='flex flex-wrap gap-3 mt-3 pt-4'>
                <button className='bg-green-500 text-white px-4 py-2 rounded-md font-medium hover:bg-green-600 flex items-center gap-1 transition cursor-pointer' onClick={() => onEdit(service)}>
                    <MdEdit className="inline-block" />Edit

                </button>
            </div>
        </div>
    )
}

const StatusToggleSwitch = ({ serviceId, currentStatus, onToggle }) => {
    const isActive = currentStatus === 'Active';

    return (
        <div className="flex flex-col gap-2 items-center space-x-2 xl:flex-row xl:gap-0.5">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold 
                ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
            >
                {currentStatus}
            </span>
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent card edit modal from opening
                    onToggle(serviceId, currentStatus);
                }}
                className={`relative inline-flex shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-blue-500 ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                role="switch"
                aria-checked={isActive}
            >
                <span className="sr-only">Toggle Status</span>
                <span 
                    aria-hidden="true" 
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transform transition ease-in-out duration-200 ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
                />
            </button>
        </div>
    );
};