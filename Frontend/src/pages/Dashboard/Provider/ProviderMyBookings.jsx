import React, { useState } from 'react';
import ProviderBookingCard from '../../../layouts/ProviderBookingCard';
import ProviderDashboardLayout from '../../../layouts/ProviderDashboardLayout';
import { Modal } from '../../../components/Modal';
import { MdPhone } from 'react-icons/md';
// Sample data mirroring the image content and adding a second booking for 'Pending'
const bookings = [
    {
        id: 1,
        title: 'Plumbing Repair',
        customer: 'John Smith',
        rating: 4.8,
        location: '123 Main St, City',
        description: 'Kitchen sink repair and pipe inspection',
        schedule: { date: '2024-12-05', time: '10:00 AM' },
        phoneNumber:'+977 9812345678',
        amount: 120,
        status: 'Confirmed',
        actions: ['view', 'call', 'directions'],
    },
    // 2. Pending/Scheduled (as per image)
    {
        id: 2,
        title: 'Pipe Installation',
        customer: 'Lisa Chen',
        rating: 4.9,
        location: '456 Oak Ave, City',
        description: 'New bathroom pipe installation',
        schedule: { date: '2024-12-06', time: '2:00 PM' },
        phoneNumber:'+977 9812345678',
        amount: 200,
        status: 'Scheduled', // Used 'Scheduled' for future bookings needing action
        actions: ['view', 'accept', 'decline'],
    },
    // 3. In Progress
    {
        id: 3,
        title: 'HVAC Maintenance',
        customer: 'David Lee',
        rating: 4.7,
        location: '789 Pine Ln, Suburb',
        description: 'Annual A/C unit cleaning and check-up.',
        schedule: { date: '2024-12-05', time: '1:00 PM' },
        phoneNumber:'+977 9812345678',
        amount: 150,
        status: 'In Progress',
        actions: ['view', 'call'],
    },
    // 4. Completed
    {
        id: 4,
        title: 'Electrical Wiring',
        customer: 'Sarah Connor',
        rating: 5.0,
        location: '101 Tech Rd, Downtown',
        description: 'Installation of new electrical outlet in garage.',
        schedule: { date: '2024-12-01', time: '9:30 AM' },
        phoneNumber:'+977 9812345678',
        amount: 85,
        status: 'Completed',
        actions: ['view'],
    },
    // 5. Cancelled
    {
        id: 5,
        title: 'Roof Repair',
        customer: 'Michael B.',
        rating: 4.5,
        location: '555 Lake View, Town',
        description: 'Emergency patch repair for storm damage.',
        schedule: { date: '2024-12-07', time: '11:00 AM' },
        amount: 350,
        status: 'Cancelled',
        actions: ['view'],
        phoneNumber:'+977 9812345678',
    },

];



export default function ProviderMyBookings(booking={booking}) {
    const [activeMenu, setActiveMenu] = useState("my-bookings");
    const [activeTab, setActiveTab] = useState("All");
    const [selectedBooking, setSelectedBooking] = useState(null);

    const tabs = ["All", "Scheduled", "Confirmed", "In Progress", "Pending", "Completed", "Cancelled"];

    // Filter bookings by tab
    const filteredBookings =
        activeTab === "All"
            ? bookings
            : bookings.filter(
                (b) => b.status.toLowerCase() === activeTab.toLowerCase()
            );


    // const filteredBookings = initialBookings.filter(booking => {
    //     if (activeFilter === 'All') {
    //         return true;
    //     }

    //     return booking.status.includes(activeFilter) || (activeFilter === 'Scheduled' && (booking.status === 'Confirmed' || booking.status === 'Pending'));
    // });

    // Function to determine filter button styles
    // const getFilterClasses = (filter) => {
    //     return activeFilter === filter
    //         ? 'bg-blue-600 text-white shadow-md'
    //         : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300';
    // };

    return (
        <ProviderDashboardLayout activeMenuKey={activeMenu} onMenuChange={setActiveMenu}>


            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
                <p className="text-gray-500 mt-1">Manage all your customer bookings and appointments</p>
            </header>

            {/* Filter Tabs */}
            <div className=" flex flex-wrap space-x-2 space-y-2 overflow-x-hidden bg-gray-100 mb-6 px-2 rounded-lg">
                <div className="flex flex-wrap gap-3 py-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            className={`whitespace-nowrap rounded px-3 py-1 text-sm font-medium cursor-pointer transition ${activeTab === tab
                                ? "bg-white text-green-600"
                                : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                                }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bookings List */}
            <main className='grid gap-6 grid-cols-1'>
                {filteredBookings.length > 0 ? (
                    filteredBookings.map(booking => (
                        <ProviderBookingCard key={booking.id} booking={booking}
                             />
                    ))
                ) : (
                    <div className="text-center p-10 bg-white rounded-lg shadow-md text-gray-500">
                        No bookings found for the selected filter.
                    </div>
                )}
            </main>

            {/* Modal for view */}
        
        </ProviderDashboardLayout>
    );
};

