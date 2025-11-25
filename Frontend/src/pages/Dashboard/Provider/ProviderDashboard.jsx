import React, { useState } from "react";
import ProviderDashboardLayout from "../../../layouts/ProviderDashboardLayout";
import {
  AiOutlineCalendar,
  AiOutlineDollarCircle,
  AiOutlineStar,
  AiOutlineClockCircle,
  AiOutlinePhone,
  AiOutlineAreaChart,
  AiOutlineEdit,
  AiOutlinePlusCircle,
} from "react-icons/ai";
import { BiCog } from "react-icons/bi";
import { FaPhoneAlt } from "react-icons/fa";
import { IoNavigateOutline } from "react-icons/io5";
import { Link } from "react-router";

export default function ProviderDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const upcomingBookings = [
    {
      id: 1,
      name: "Plumbing Repair",
      customer: "John Smith",
      date: "2024-01-16 10:00 AM",
      location: "123 Main St, City",
      price: 120,
      status: "Confirmed",
      statusColor: "bg-green-100 text-green-700",
    },
    {
      id: 2,
      name: "Pipe Installation",
      customer: "Lisa Chen",
      date: "2024-01-17 02:00 PM",
      location: "456 Oak Ave, City",
      price: 200,
      status: "Pending",
      statusColor: "bg-yellow-100 text-yellow-700",
    },
    {
      id: 3,
      name: "Emergency Repair",
      customer: "Chris Lee",
      date: "2024-01-18 03:00 PM",
      location: "789 Pine St, City",
      price: 150,
      status: "Confirmed",
      statusColor: "bg-green-100 text-green-700",
    },
  ];

  const recentReviews = [
    {
      customer: "Sarah Johnson",
      text: "Excellent work! Very professional and fixed the issue quickly.",
      service: "Plumbing Repair",
      rating: 5,
      date: "2024-01-15",
    },
    {
      customer: "Mike Rodriguez",
      text: "Good service, arrived on time and completed the job well.",
      service: "Pipe Installation",
      rating: 5,
      date: "2024-01-14",
    },
    {
      customer: "Amanda Wilson",
      text: "Highly recommend! Great communication and quality work.",
      service: "Emergency Repair",
      rating: 5,
      date: "2024-01-13",
    },
  ];

  return (
    <ProviderDashboardLayout activeMenuKey={activeMenu} onMenuChange={setActiveMenu}>
      {/* Dashboard Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your services and track your performance</p>
      </header>

      {/* Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-8">
        {[
          {
            title: "Total Jobs",
            value: 127,
            change: "+8 this month",
            icon: <AiOutlineCalendar className="h-7 w-7 text-blue-600" />,
            bgColor: "bg-blue-100",
          },
          {
            title: "Total Earnings",
            value: "$8,450",
            change: "+$1,200 this month",
            icon: <AiOutlineDollarCircle className="h-7 w-7 text-green-600" />,
            bgColor: "bg-green-100",
          },
          {
            title: "Average Rating",
            value: 4.9,
            sub: "127 reviews",
            icon: <AiOutlineStar className="h-7 w-7 text-yellow-600" />,
            bgColor: "bg-yellow-100",
          },
          {
            title: "Response Time",
            value: "15m",
            sub: "Excellent",
            icon: <AiOutlineClockCircle className="h-7 w-7 text-purple-600" />,
            bgColor: "bg-purple-100",
          },
        ].map(({ title, value, change, sub, icon, bgColor }) => (
          <div key={title} className="bg-white rounded-xl p-6 flex items-center space-x-4 shadow-sm">
            <div className={`p-3 ${bgColor} rounded-lg`}>{icon}</div>
            <div>
              <p className="font-semibold text-gray-600">{title}</p>
              <p className="text-xl font-bold">{value}</p>
              {change && <p className="text-green-600 text-sm">{change}</p>}
              {sub && <p className="text-gray-500 text-sm">{sub}</p>}
            </div>
          </div>
        ))}
      </section>

      {/* Main columns */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-10">
        {/* Upcoming Bookings */}
        <div className="bg-white rounded-xl p-6 shadow-sm md:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
            <Link to="/provider/my-bookings" className="text-sm bg-blue-600 px-3 py-2 rounded-lg text-white font-semibold hover:bg-blue-700 cursor-pointer transition">View All</Link>
          </div>

          <div className="space-y-5">
            {upcomingBookings.map(({ id, name, customer, date, location, price, status, statusColor }) => (
              <div key={id} className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 last:border-0 relative">
                <div>
                  <h3 className="font-semibold text-gray-900">{name}</h3>
                  <p className="text-gray-600 text-sm">Customer: {customer}</p>
                  <p className="text-gray-600 text-sm">Date: {date}</p>
                  <p className="text-gray-600 text-sm">Location: {location}</p>
                  <div className={`py-1 mt-4 px-3 w-fit rounded-full text-xs font-semibold ${statusColor}`}>{status}</div>
                </div>
                <div className="flex flex-col sm:items-center gap-3">
                  <div className="absolute top-2 right-0">
                  <span className="font-bold sm:mb-6 text-gray-900 ">${price}</span>
                  </div>

                  <div className="flex gap-3 sm:mt-20">
                    <button className="flex items-center gap-1 border-2 border-blue-600 text-blue-600 rounded-md px-3 py-2 text-xs font-semibold hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <FaPhoneAlt />
                      Call
                    </button>
                    <button className="flex items-center gap-1 border bg-green-600 text-white rounded-lg px-3 py-2 text-xs font-semibold hover:bg-green-700 transition cursor-pointer">
                      <IoNavigateOutline className="-rotate-90" />
                      Navigate
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
            <button className="text-sm border-blue-600 border-2 px-3 py-2 rounded-lg text-blue-600 font-semibold hover:bg-blue-600 hover:text-white cursor-pointer transition">View All</button>
          </div>

          <div className="space-y-6">
            {recentReviews.map(({ customer, text, service, rating, date }, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-4 last:border-0">
                <p className="font-semibold">{customer}</p>
                <p className="text-sm mb-1">&quot;{text}&quot;</p>
                <div className="flex justify-between items-center text-yellow-400 mb-1">
                  <div>
                    {[...Array(rating)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        className="inline h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.384 2.456a1 1 0 00-.364 1.118l1.287 3.974c.3.92-.755 1.688-1.54 1.118L10 13.347l-3.384 2.456c-.784.57-1.838-.197-1.539-1.118l1.287-3.974a1 1 0 00-.364-1.118L3.616 9.4c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.973z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{date}</span>
                </div>
                <p className="text-xs text-gray-500">{service}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap gap-4 max-w-4xl mt-10">
        {[
          { label: "Update Availability", icon: <BiCog size={20} />,bgColor:"bg-blue-600",hover:"bg-blue-700" },
          { label: "Add Service", icon: <AiOutlinePlusCircle size={20} />,bgColor:"bg-green-600",hover:"bg-green-700" },
          { label: "Edit Profile", icon: <AiOutlineEdit size={20} />,bgColor:"bg-blue-600",hover:"bg-blue-700" },
          { label: "View Analytics", icon: <AiOutlineAreaChart size={20} />,bgColor:"bg-yellow-500",hover:"bg-yellow-600"},
        ].map(({ label, icon, bgColor,hover }) => (
          <button
            key={label}
            className={`flex items-center gap-2 ${bgColor} text-white  px-6 py-3 rounded-md font-semibold hover:${hover}  cursor-pointer transition`}
            onClick={() => alert(`${label} clicked`)}
          >
            {icon}
            {label}
          </button>
        ))}
      </section>
    </ProviderDashboardLayout>
  );
}

const recentReviews = [
  {
    customer: "Sarah Johnson",
    text: "Excellent work! Very professional and fixed the issue quickly.",
    service: "Plumbing Repair",
    rating: 5,
    date: "2024-01-15",
  },
  {
    customer: "Mike Rodriguez",
    text: "Good service, arrived on time and completed the job well.",
    service: "Pipe Installation",
    rating: 5,
    date: "2024-01-14",
  },
  {
    customer: "Amanda Wilson",
    text: "Highly recommend! Great communication and quality work.",
    service: "Emergency Repair",
    rating: 5,
    date: "2024-01-13",
  },
];
