import React, { useState, useMemo } from "react";
import { DollarSign, Briefcase, Clock, TrendingUp, Download } from "lucide-react";
import ProviderDashboardLayout from "../../../../layouts/ProviderDashboardLayout";
import PaymentMethods from "../../../../components/PaymentMethods";
import PaymentMethodsSection from "../../../../components/PaymentMethods";
import { Modal } from "../../../../components/Modal";

const Earnings = () => {
    const [selectedPeriod, setSelectedPeriod] = useState("This Month");
    const [selectedPayment, setSelectedPayment] = useState(null);
    
    // All earnings data
    const allEarnings = [
        {
            date: "2025-11-28",
            customer: "John Smith",
            service: "Plumbing Repair",
            amount: 120,
            paymentMethod: "Credit Card",
            status: "Paid",
        },
        {
            date: "2025-11-27",
            customer: "Lisa Chen",
            service: "Pipe Installation",
            amount: 200,
            paymentMethod: "Cash",
            status: "Paid",
        },
        {
            date: "2025-11-26",
            customer: "David Wilson",
            service: "Emergency Repair",
            amount: 150,
            paymentMethod: "Credit Card",
            status: "Paid",
        },
        {
            date: "2025-11-25",
            customer: "Sarah Johnson",
            service: "Maintenance Check",
            amount: 80,
            paymentMethod: "Credit Card",
            status: "Pending",
        },
        {
            date: "2025-11-24",
            customer: "Mike Rodriguez",
            service: "Drain Cleaning",
            amount: 90,
            paymentMethod: "Cash",
            status: "Paid",
        },
        {
            date: "2025-11-23",
            customer: "Amanda Wilson",
            service: "Water Heater Service",
            amount: 120,
            paymentMethod: "Credit Card",
            status: "Paid",
        },
        {
            date: "2025-11-20",
            customer: "Robert Brown",
            service: "Kitchen Plumbing",
            amount: 180,
            paymentMethod: "Credit Card",
            status: "Paid",
        },
        {
            date: "2025-11-18",
            customer: "Emily Davis",
            service: "Bathroom Repair",
            amount: 110,
            paymentMethod: "Cash",
            status: "Paid",
        },
        {
            date: "2025-11-15",
            customer: "Tom Harris",
            service: "Leak Repair",
            amount: 95,
            paymentMethod: "Credit Card",
            status: "Paid",
        },
        {
            date: "2025-11-12",
            customer: "Nancy White",
            service: "Pipe Replacement",
            amount: 220,
            paymentMethod: "Cash",
            status: "Paid",
        },
        {
            date: "2025-11-05",
            customer: "Paul Martinez",
            service: "Drain Cleaning",
            amount: 85,
            paymentMethod: "Credit Card",
            status: "Paid",
        },
        {
            date: "2025-10-28",
            customer: "Maria Garcia",
            service: "Emergency Service",
            amount: 175,
            paymentMethod: "Cash",
            status: "Paid",
        },
        {
            date: "2025-10-20",
            customer: "Kevin Lee",
            service: "Water Heater Install",
            amount: 350,
            paymentMethod: "Credit Card",
            status: "Paid",
        },
        {
            date: "2025-10-15",
            customer: "Susan Taylor",
            service: "Plumbing Repair",
            amount: 130,
            paymentMethod: "Cash",
            status: "Paid",
        },
    ];

    // Filter earnings based on selected period
    const filteredEarnings = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        return allEarnings.filter((earning) => {
            const earningDate = new Date(earning.date);
            const earningYear = earningDate.getFullYear();
            const earningMonth = earningDate.getMonth();

            switch (selectedPeriod) {
                case "This Week": {
                    const weekAgo = new Date(now);
                    weekAgo.setDate(now.getDate() - 7);
                    return earningDate >= weekAgo && earningDate <= now;
                }
                case "This Month":
                    return earningYear === currentYear && earningMonth === currentMonth;
                case "Last Month": {
                    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                    return earningYear === lastMonthYear && earningMonth === lastMonth;
                }
                case "This Year":
                    return earningYear === currentYear;
                default:
                    return true;
            }
        });
    }, [selectedPeriod]);

    // Calculate stats based on filtered earnings
    const stats = useMemo(() => {
        const totalEarnings = filteredEarnings
            .filter(e => e.status === "Paid")
            .reduce((sum, e) => sum + e.amount, 0);

        const completedJobs = filteredEarnings.filter(e => e.status === "Paid").length;

        const pendingAmount = filteredEarnings
            .filter(e => e.status === "Pending")
            .reduce((sum, e) => sum + e.amount, 0);

        const pendingCount = filteredEarnings.filter(e => e.status === "Pending").length;

        const avgJobValue = completedJobs > 0 ? totalEarnings / completedJobs : 0;

        return [
            {
                icon: <DollarSign className="w-5 h-5" />,
                label: "Total Earnings",
                value: `$${totalEarnings.toLocaleString()}`,
                change: "+2% from last period",
                changePositive: true,
                bgColor: "bg-green-50",
                iconColor: "text-green-600",
            },
            {
                icon: <Briefcase className="w-5 h-5" />,
                label: "Completed Jobs",
                value: completedJobs.toString(),
                change: `${completedJobs} jobs completed`,
                changePositive: true,
                bgColor: "bg-blue-50",
                iconColor: "text-blue-600",
            },
            {
                icon: <Clock className="w-5 h-5" />,
                label: "Pending Payments",
                value: `$${pendingAmount}`,
                change: `${pendingCount} payment${pendingCount !== 1 ? 's' : ''} pending`,
                changePositive: false,
                bgColor: "bg-yellow-50",
                iconColor: "text-yellow-600",
            },
            {
                icon: <TrendingUp className="w-5 h-5" />,
                label: "Avg. Job Value",
                value: `$${Math.round(avgJobValue)}`,
                change: "+5% increase",
                changePositive: true,
                bgColor: "bg-purple-50",
                iconColor: "text-purple-600",
            },
        ];
    }, [filteredEarnings]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
                    <p className="text-sm text-gray-500 mt-1">Track your income and payment history</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    >
                        <option>This Week</option>
                        <option>This Month</option>
                        <option>Last Month</option>
                        <option>This Year</option>
                    </select>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                        <Download className="w-4 h-4" />
                        Withdraw Funds
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                                <p className={`text-xs ${stat.changePositive ? 'text-green-600' : 'text-gray-600'}`}>
                                    {stat.change}
                                </p>
                            </div>
                            <div className={`${stat.bgColor} ${stat.iconColor} p-3 rounded-lg`}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Earnings Table */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Earnings</h2>
                    <button className="px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2" onClick={() => setSelectedPayment({
                        service,
                        provider,
                        amount,
                        status,
                        method,
                        transactionId,
                        date,
                    })}>
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>

                {filteredEarnings.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No earnings found for this period.
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Service
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment Method
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredEarnings.map((earning, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {earning.date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {earning.customer}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {earning.service}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                ${earning.amount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {earning.paymentMethod}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${earning.status === "Paid"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                >
                                                    {earning.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden divide-y divide-gray-400">
                            {filteredEarnings.map((earning, index) => (
                                <div key={index} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex flex-col gap-2">
                                            <div>
                                                <p className="text-gray-500">Customer</p>
                                                <p className="font-semibold text-gray-900">{earning.customer}</p>

                                            </div>
                                            <div>
                                                <p className="text-gray-500">Service</p>
                                                <p className="text-sm text-gray-700 mt-0.5">{earning.service}</p>
                                            </div>
                                        </div>

                                        <span
                                            className={`px-3 py-1 text-xs font-semibold rounded-full ${earning.status === "Paid"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-yellow-100 text-yellow-800"
                                                }`}
                                        >
                                            {earning.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                        <div className="flex justify-between ">
                                            <div>
                                                <p className="text-gray-500">Date</p>
                                                <p className="text-gray-900 font-medium">{earning.date}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Amount</p>
                                                <p className="text-gray-900 font-semibold">${earning.amount}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-gray-500">Payment Method</p>
                                            <p className="text-gray-900">{earning.paymentMethod}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
            {/* payment method section */}
            <PaymentMethodsSection />

        </div>
    );
};



export default function ProviderEarnings() {
    const [activeMenuKey, setActiveMenuKey] = useState('earnings');

    return (
        <ProviderDashboardLayout activeMenuKey={activeMenuKey} onMenuChange={setActiveMenuKey}>
            <Earnings />
        </ProviderDashboardLayout>
    );
}


