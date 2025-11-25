import React, { useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { Modal } from "../../../components/Modal";
import {
    MdCalendarToday,
    MdLocationOn,
    MdStarRate,
    MdPhone,
} from "react-icons/md";
import { FaPlusCircle } from "react-icons/fa";

export default function MyBookingsPage() {
    const [activeMenuKey, setActiveMenuKey] = useState("my-bookings");
    const [activeTab, setActiveTab] = useState("All");
    const [selectedBooking, setSelectedBooking] = useState(null);

    const tabs = ["All", "Scheduled", "Confirmed", "In Progress", "Pending", "Completed", "Cancelled"];

    const bookingsData = [
        {
            id: 1,
            service: "Plumbing Service",
            provider: "Mike Johnson",
            rating: 4.8,
            status: "Confirmed",
            statusColor: "bg-blue-100 text-blue-700",
            date: "2024-01-20",
            time: "10:00 AM",
            address: "123 Main St, Downtown",
            price: 120,
            description: "Kitchen sink repair and pipe inspection",
        },
        {
            id: 2,
            service: "Electrical Repair",
            provider: "Sarah Wilson",
            rating: 4.9,
            status: "In Progress",
            statusColor: "bg-yellow-100 text-yellow-700",
            date: "2024-01-18",
            time: "2:00 PM",
            address: "456 Oak Ave, Midtown",
            price: 85,
            description: "Light fixture installation and wiring check",
        },
        {
            id: 3,
            service: "House Cleaning",
            provider: "Clean Pro Services",
            rating: 4.7,
            status: "Completed",
            statusColor: "bg-green-100 text-green-700",
            date: "2024-01-15",
            time: "9:00 AM",
            address: "789 Pine St, Uptown",
            price: 60,
            description: "Deep cleaning service for 2-bedroom apartment",
        },
        {
            id: 4,
            service: "AC Repair",
            provider: "Cool Air Solutions",
            rating: 4.6,
            status: "Scheduled",
            statusColor: "bg-purple-100 text-purple-700",
            date: "2024-01-12",
            time: "11:00 AM",
            address: "321 Elm St, Westside",
            price: 150,
            description: "Air conditioning unit maintenance and filter replacement",
        },
        {
            id: 5,
            service: "AC Repair",
            provider: "Cool Air Solutions",
            rating: 4.8,
            status: "Pending",
            statusColor: "bg-purple-100 text-purple-700",
            date: "2024-01-12",
            time: "11:00 AM",
            address: "321 Elm St, Westside",
            price: 150,
            description: "Air conditioning unit maintenance and filter replacement",
        },
    ];

    // Filter bookings by tab
    const filteredBookings =
        activeTab === "All"
            ? bookingsData
            : bookingsData.filter(
                (b) => b.status.toLowerCase() === activeTab.toLowerCase()
            );

    return (
        <DashboardLayout activeMenuKey={activeMenuKey} onMenuChange={setActiveMenuKey}>
            {/* Header & Book New Service Button */}
            <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-semibold">My Bookings</h2>
                    <p className="text-gray-600 text-sm">
                        Track and manage all your service bookings
                    </p>
                </div>
                <button className="bg-green-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-green-700 transition">
                    Book New Service

                </button>
            </div>

            {/* Tabs */}
            <div className=" flex flex-wrap space-x-2 space-y-2 overflow-x-hidden bg-gray-200 mb-6 px-2 rounded-lg">
                <div className="flex flex-wrap gap-3 py-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            className={`whitespace-nowrap rounded px-3 py-1 text-sm font-medium transition cursor-pointer ${activeTab === tab
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

            {/* Bookings grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                {filteredBookings.length > 0 ? (
                    filteredBookings.map(
                        (booking) => (
                            <div
                                key={booking.id}
                                className="bg-white p-6 rounded-lg shadow border border-gray-100"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <p className="font-semibold text-lg">{booking.service}</p>
                                        <p className="text-gray-700 text-sm">{booking.provider}</p>
                                    </div>
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${booking.statusColor}`}
                                    >
                                        {booking.status}
                                    </span>
                                </div>

                                {/* Star rating with react-icons */}
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
                                    <span className="ml-2 text-gray-700">{booking.rating.toFixed(1)}</span>
                                </div>

                                <div className="text-gray-600 text-sm space-y-1 mt-3 mb-4">
                                    <p className="flex items-center gap-2">
                                        <MdCalendarToday /> {booking.date} at {booking.time}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <MdLocationOn /> {booking.address}
                                    </p>
                                    <p className="font-semibold">${booking.price}</p>
                                </div>

                                <p className="text-gray-700 text-sm mb-5">{booking.description}</p>

                                <div className="flex space-x-3">
                                    <button
                                        className="px-4 py-2 border border-green-600 text-green-600 rounded-md text-sm font-semibold hover:bg-green-50 transition"
                                        onClick={() => setSelectedBooking(booking)}
                                    >
                                        View Details
                                    </button>

                                    {booking.status === "Completed" && (
                                        <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-700 flex items-center gap-1 transition cursor-pointer">
                                            ★ Rate Service
                                        </button>
                                    )}

                                    {booking.status === "In Progress" && (
                                        <button className="px-4 py-2 border bg-yellow-500 text-white rounded-md text-sm font-semibold hover:bg-yellow-600 transition cursor-pointer" onClick={() => alert("Calling provider...")}>
                                            <MdPhone className="inline-block" /> Call Provider
                                        </button>
                                    )}

                                    {booking.status === "Confirmed" && (
                                        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 flex items-center gap-1 transition cursor-pointer" onClick={() => alert("Calling provider...")}>
                                            <MdPhone className="inline-block" /> Call Provider
                                        </button>
                                    )}

                                </div>
                            </div>
                        )
                    )
                ) : (
                    <div className="text-center p-10 bg-white rounded-lg shadow-md text-gray-500">
                        No bookings found for the selected filter.
                    </div>
                )}

            </div>
            {/* Booking Details Modal */}
            <Modal
                isOpen={selectedBooking !== null}
                onClose={() => setSelectedBooking(null)}
                title={`Booking Details - ${selectedBooking?.service || ""}`}
            >
                {selectedBooking && (
                    <div className="space-y-4 text-gray-800">
                        <p>
                            <strong>Provider:</strong> {selectedBooking.provider}
                        </p>
                        <p>
                            <strong>Status:</strong>{" "}
                            <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${selectedBooking.statusColor || "bg-gray-200 text-gray-700"
                                    }`}
                            >
                                {selectedBooking.status}
                            </span>
                        </p>
                        <p>
                            <strong>Date & Time:</strong> {selectedBooking.date} at{" "}
                            {selectedBooking.time}
                        </p>
                        <p>
                            <strong>Description:</strong> {selectedBooking.description}
                        </p>
                        <p>
                            <strong>Phone:</strong>{" "}
                            <a
                                href={`tel:${selectedBooking.phone}`}
                                className="text-green-600 hover:underline"
                            >
                                {selectedBooking.phone}
                            </a>
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="px-4 py-2 border bg-red-500 text-white rounded-md text-sm font-semibold hover:bg-red-600 transition"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => alert("Calling provider...")}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition "
                            >
                                <MdPhone size={20} />
                                Call Provider
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
}
