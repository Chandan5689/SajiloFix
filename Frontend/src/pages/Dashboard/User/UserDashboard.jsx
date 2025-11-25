import React, { useState } from "react";
import {Link} from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { FaRegCalendarCheck } from "react-icons/fa";
import { HiOutlineWrenchScrewdriver } from "react-icons/hi2";
import { AiOutlineDollarCircle } from "react-icons/ai";
import { LiaPiggyBankSolid } from "react-icons/lia";
import { FiPlusCircle } from "react-icons/fi";
import { MdHeadsetMic } from "react-icons/md";

export default function DashboardPage() {
  const [activeMenuKey, setActiveMenuKey] = useState("dashboard");

  return (
    <DashboardLayout activeMenuKey={activeMenuKey} onMenuChange={setActiveMenuKey}>
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's what's happening with your services.
        </p>
      </header>

      {/* Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {[
          {
            title: "Total Bookings",
            value: 12,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            icon:<FaRegCalendarCheck className="h-6 w-6" />
            
          },
          {
            title: "Active Jobs",
            value: 3,
            bgColor: "bg-yellow-50",
            iconColor: "text-yellow-500",
            icon: <HiOutlineWrenchScrewdriver className="h-6 w-6" />
          },
          {
            title: "Total Spent",
            value: "$1,240",
            bgColor: "bg-green-50",
            iconColor: "text-green-600",
            icon: <AiOutlineDollarCircle className="h-6 w-6" />
          },
          {
            title: "Saved Amount",
            value: "$180",
            bgColor: "bg-purple-50",
            iconColor: "text-purple-400 ",
            icon: <LiaPiggyBankSolid className="h-6 w-6" />
          },
        ].map(({ title, value, bgColor, iconColor, icon }) => (
          <div
            key={title}
            className={`flex items-center justify-between rounded-lg p-5 shadow-sm bg-white`}
          >
            <div>
              <p className="text-gray-500 text-sm">{title}</p>
              <p className="font-semibold text-xl">{value}</p>
            </div>
            <div className={`${bgColor} p-3 rounded-lg flex items-center justify-center`}>
              {React.cloneElement(icon, { className: `h-6 w-6 ${iconColor}` })}
            </div>
          </div>
        ))}
      </section>

      {/* Recent Bookings & Payment Overview */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
          <ul className="space-y-4">
            {[
              {
                iconColor: "text-blue-400",
                iconbgColor: "bg-blue-100",
                iconPath: "M13 16h-1v-4h-1m4-4H9l-3 7h6",
                service: "Plumbing Service",
                date: "Dec 15, 2023",
                status: "Completed",
                statusText: "text-green-600",
                statusBgColor: "bg-green-100",
              },
              {
                iconColor: "text-yellow-400",
                iconbgColor: "bg-yellow-100",
                iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
                service: "Electrical Repair",
                date: "Dec 12, 2023",
                status: "In Progress",
                statusText: "text-blue-600",
                statusBgColor: "bg-blue-100",
              },
              {
                iconColor: "text-purple-400",
                iconbgColor: "bg-purple-100",
                iconPath: "M3 10h18M3 14h18",
                service: "House Cleaning",
                date: "Dec 10, 2023",
                status: "Scheduled",
                statusText: "text-yellow-600",
                statusBgColor: "bg-yellow-100",
              },
            ].map((b) => (
              <li
                key={b.service}
                className={`flex items-center justify-between rounded-lg p-3 bg-gray-50`}
              >
                <div className="flex items-center gap-3">
                  {/* <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ${b.iconColor} ${b.iconbgColor} rounded`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={b.iconPath} />
                  </svg> */}
                  <div>
                    <p className="font-semibold">{b.service}</p>
                    <p className="text-gray-500 text-sm">{b.date}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold rounded-full px-3 py-1 ${b.statusText} ${b.statusBgColor} bg-opacity-40`}
                >
                  {b.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Payment Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Overview</h2>
          <ul className="space-y-3">
            {[
              {
                service: "Plumbing Service",
                provider: "Mike Johnson",
                amount: "$120",
                status: "Paid",
                statusText: "text-green-600",
              },
              {
                service: "Electrical Repair",
                provider: "Sarah Wilson",
                amount: "$85",
                status: "Pending",
                statusText: "text-orange-500",
              },
              {
                service: "House Cleaning",
                provider: "Clean Pro Services",
                amount: "$60",
                status: "Scheduled",
                statusText: "text-blue-600",
              },
            ].map(({ service, provider, amount, status, statusText }) => (
              <li key={service} className="flex justify-between py-3 border border-gray-300 rounded-lg px-4">
                <div>
                  <p className="font-semibold">{service}</p>
                  <p className="text-sm text-gray-500">{provider}</p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="font-semibold">{amount}</p>
                  <p className={`text-xs font-semibold ${statusText}`}>{status}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap gap-4 max-w-3xl">
        <Link to="/services" className="grow sm:flex-auto bg-green-600 text-white rounded-md px-6 py-3 font-semibold hover:bg-green-700 transition  cursor-pointer">
            <FiPlusCircle className="inline-block mr-2 h-5 w-5" />
          Book New Service
        </Link>
        <button className="grow sm:flex-auto border border-orange-400 text-orange-500 rounded-md px-6 py-3 font-semibold hover:bg-orange-50 transition cursor-pointer">
            <FaRegCalendarCheck className="inline-block mr-2 h-5 w-5" />
          View Bookings
        </button>
        <button className="grow sm:flex-auto border border-blue-500 text-blue-600 rounded-md px-6 py-3 font-semibold hover:bg-blue-50 transition cursor-pointer">
            <MdHeadsetMic className="inline-block mr-2 h-5 w-5" />
          Contact Support
        </button>
      </section>
    </DashboardLayout>
  );
}
