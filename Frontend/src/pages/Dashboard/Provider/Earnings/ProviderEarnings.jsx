import React, { useState, useEffect, useMemo } from 'react';
import {
    
    DollarSign,
    Calendar,
    Star,
    Clock,
    User,
    CalendarCheck,
    MessageSquare,
    Settings,
    ChevronDown,
    Banknote,
    ArrowRight,
    Download,
    Menu,
} from 'lucide-react'; // Using lucide-react as a standard replacement for react-icons
import ProviderDashboardLayout from '../../../../layouts/ProviderDashboardLayout';

// --- MOCK DATA AND UTILS FOR EARNINGS VIEW ---

const mockTransactions = [
    { id: 1, date: '2024-01-15', customer: 'John Smith', service: 'Plumbing Repair', amount: 120, paymentMethod: 'Credit Card', status: 'Paid' },
    { id: 2, date: '2024-01-14', customer: 'Lisa Chen', service: 'Pipe Installation', amount: 200, paymentMethod: 'Cash', status: 'Paid' },
    { id: 3, date: '2024-01-13', customer: 'David Wilson', service: 'Emergency Repair', amount: 150, paymentMethod: 'Credit Card', status: 'Paid' },
    { id: 4, date: '2024-01-12', customer: 'Sarah Johnson', service: 'Maintenance Check', amount: 80, paymentMethod: 'Credit Card', status: 'Funding' }, // Changed to 'Funding' to match image
    { id: 5, date: '2024-01-11', customer: 'Mike Rodriguez', service: 'Drain Cleaning', amount: 90, paymentMethod: 'Cash', status: 'Paid' },
    { id: 6, date: '2024-01-10', customer: 'Amanda Wilson', service: 'Water Heater Service', amount: 120, paymentMethod: 'Credit Card', status: 'Paid' },
    { id: 7, date: '2024-01-09', customer: 'Robert Brown', service: 'Kitchen Plumbing', amount: 180, paymentMethod: 'Credit Card', status: 'Paid' },
    { id: 8, date: '2023-12-25', customer: 'Christmas Eve', service: 'Holiday Service', amount: 300, paymentMethod: 'Cash', status: 'Paid' },
    { id: 9, date: '2023-12-01', customer: 'Early December', service: 'Seasonal Checkup', amount: 50, paymentMethod: 'Credit Card', status: 'Paid' },
];

const FILTER_OPTIONS = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Last Month', value: 'lastMonth' },
];

/**
 * Utility function to calculate the date range for filtering.
 */
const getFilterStartDate = (filter) => {
    // Mocking current date for consistent demonstration: January 16, 2024
    const today = new Date('2024-01-16T12:00:00'); 
    let startDate = new Date(today);

    startDate.setHours(0, 0, 0, 0);

    switch (filter) {
        case 'week':
            // Past 7 days
            startDate.setDate(today.getDate() - 7);
            break;
        case 'month':
            startDate.setDate(1);
            break;
        case 'lastMonth':
            startDate.setMonth(today.getMonth() - 1);
            startDate.setDate(1);
            break;
        default:
            return new Date(0);
    }
    return startDate;
};

/**
 * Renders a single statistic card.
 */
const StatCard = ({ icon: Icon, title, value, detail, color, bgColor }) => (
    <div className={`flex items-start p-4 md:p-5 rounded-xl shadow-sm border ${color === 'green' ? 'border-green-100' : color === 'blue' ? 'border-blue-100' : color === 'yellow' ? 'border-yellow-100' : 'border-purple-100'} bg-white`}>
        {/* Adjusted icon background and padding for visual match */}
        <div className={`rounded-full shrink-0 ${bgColor} text-white`}> 
            <Icon size={28} />
        </div>
        <div className="">
            <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{value}</p>
            <p className={`text-[10px] sm:text-xs mt-1 ${color === 'green' ? 'text-green-600' : color === 'blue' ? 'text-blue-600' : color === 'yellow' ? 'text-yellow-600' : 'text-purple-600'} truncate`}>
                {detail}
            </p>
        </div>
    </div>
);

/**
 * Renders the table row status badge.
 */
const StatusBadge = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full";
    let statusClasses = "";

    switch (status) {
        case 'Paid':
            statusClasses = "bg-green-100 text-green-700";
            break;
        case 'Pending':
        case 'Funding':
            statusClasses = "bg-yellow-100 text-yellow-700";
            break;
        default:
            statusClasses = "bg-gray-100 text-gray-700";
    }

    return (
        <span className={`${baseClasses} ${statusClasses}`}>
            {status}
        </span>
    );
};


// --- EARNINGS VIEW COMPONENT (Content of the Dashboard) ---

const EarningsView = () => {
    const [selectedFilter, setSelectedFilter] = useState('week');

    // 1. Filter Transactions based on selectedFilter
    const filteredTransactions = useMemo(() => {
        const startDate = getFilterStartDate(selectedFilter);
        
        return mockTransactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= startDate;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [selectedFilter]);

    // 2. Calculate Dashboard Metrics from filteredTransactions
    const { totalEarnings, completedJobs, pendingPayments, avgJobValue } = useMemo(() => {
        let earnings = 0;
        let completed = 0;
        let pending = 0;

        filteredTransactions.forEach(tx => {
            if (tx.status === 'Paid') {
                earnings += tx.amount;
                completed += 1;
            } else if (tx.status === 'Funding' || tx.status === 'Pending') {
                pending += tx.amount;
            }
        });

        const paidJobsCount = filteredTransactions.filter(tx => tx.status === 'Paid').length;
        const calculatedAvgJobValue = paidJobsCount > 0 ? earnings / paidJobsCount : 0;

        return {
            totalEarnings: earnings,
            completedJobs: completed,
            pendingPayments: pending,
            avgJobValue: calculatedAvgJobValue,
        };
    }, [filteredTransactions]);

    // 3. Mocked Comparison Data (Based on the design image)
    const mockComparison = {
        earningsDetail: '+12% from last month',
        jobsDetail: '+8 this month',
        pendingDetail: '2 payments pending',
        avgJobDetail: '+5% increase',
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header and Filter (Enhanced Responsiveness) */}
            <header className="flex flex-col justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Earnings</h1>
                    <p className="text-gray-500 text-sm mt-1">Track your income and payment history</p>
                </div>

                <div className="flex flex-col lg:flex-row space-x-3 mt-4 sm:mt-0 sm:w-auto">
                    
                    {/* Filter Dropdown */}
                    <div className="relative flex-1 sm:flex-initial min-w-[150px]">
                        <select
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-2.5 pl-4 pr-10 text-sm font-medium focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-sm"
                        >
                            {FILTER_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-700">
                            <ChevronDown size={16} />
                        </div>
                    </div>

                    {/* Action Button */}
                    <button className="flex items-center justify-center flex-1 sm:flex-initial px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-150 text-sm min-w-[150px]">
                        <Banknote size={20} className="mr-2" />
                        Withdraw Funds
                    </button>
                </div>
            </header>

            {/* Statistics Cards (Fully Responsive Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <StatCard
                    icon={DollarSign}
                    title="Total Earnings"
                    value={`$${totalEarnings.toLocaleString()}`}
                    detail={mockComparison.earningsDetail}
                    color="green"
                    bgColor="bg-green-500"
                />
                <StatCard
                    icon={CalendarCheck}
                    title="Completed Jobs"
                    value={completedJobs.toLocaleString()}
                    detail={mockComparison.jobsDetail}
                    color="blue"
                    bgColor="bg-blue-500"
                />
                <StatCard
                    icon={Clock}
                    title="Pending Payments"
                    value={`$${pendingPayments.toLocaleString()}`}
                    detail={mockComparison.pendingDetail}
                    color="yellow"
                    bgColor="bg-yellow-500"
                />
                <StatCard
                    icon={ArrowRight} // Using ArrowRight to represent 'Average' or 'Flow' as a placeholder
                    title="Avg Job Value"
                    value={`$${avgJobValue.toFixed(0)}`}
                    detail={mockComparison.avgJobDetail}
                    color="purple"
                    bgColor="bg-purple-500"
                />
            </div>

            {/* Recent Earnings Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 max-w-5xl overflow-x-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">Recent Earnings</h2>
                    <button className="flex items-center px-3 py-1 sm:px-4 sm:py-2 border border-gray-300 text-gray-700 font-medium rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition shadow-sm">
                        <Download size={16} className="mr-1" />
                        Export
                    </button>
                </div>

                <div className="overflow-x-auto ">
                    <table className=" divide-y divide-gray-200">
                        <thead>
                            <tr className="text-xs font-semibold uppercase text-gray-500 bg-gray-50">
                                <th className="px-3 py-3 sm:px-6 text-left whitespace-nowrap">Date</th>
                                <th className="px-3 py-3 sm:px-6 text-left whitespace-nowrap">Customer</th>
                                <th className="px-3 py-3 sm:px-6 text-left whitespace-nowrap">Service</th>
                                <th className="px-3 py-3 sm:px-6 text-right whitespace-nowrap">Amount</th>
                                <th className="hidden lg:table-cell px-6 py-3 text-left whitespace-nowrap">Payment Method</th>
                                <th className="px-3 py-3 sm:px-6 text-center whitespace-nowrap">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map(tx => (
                                    <tr key={tx.id} className="text-sm text-gray-900 hover:bg-blue-50/50 transition">
                                        <td className="px-3 py-3 sm:px-6 whitespace-nowrap text-gray-600 text-xs sm:text-sm">{tx.date}</td>
                                        <td className="px-3 py-3 sm:px-6 whitespace-nowrap font-medium text-sm">{tx.customer}</td>
                                        <td className="px-3 py-3 sm:px-6 whitespace-nowrap text-sm">{tx.service}</td>
                                        <td className="px-3 py-3 sm:px-6 whitespace-nowrap text-right font-semibold text-sm">${tx.amount}</td>
                                        <td className="hidden lg:table-cell px-6 py-3 whitespace-nowrap text-gray-600 text-sm">{tx.paymentMethod}</td>
                                        <td className="px-3 py-3 sm:px-6 whitespace-nowrap text-center">
                                            <StatusBadge status={tx.status} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-sm sm:text-lg">
                                        No earnings found for the selected period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


export default function ProviderEarnings() {
    // Defaulting to 'earnings' key as requested
    const [activeMenuKey, setActiveMenuKey] = useState('earnings');

    const renderContent = () => {
        switch (activeMenuKey) {
            case 'earnings':
                return <EarningsView />;
            // Add other views here if the user requests them later
            default:
                return (
                    <div className="p-8 text-center text-gray-600">
                        <h2 className="text-xl font-semibold">
                            {sidebarItems.find(item => item.key === activeMenuKey)?.label || 'Dashboard'} View is not yet implemented.
                        </h2>
                        <p className="mt-2">Select 'Earnings' to see the implemented view.</p>
                    </div>
                );
        }
    };

    return (
        <ProviderDashboardLayout activeMenuKey={activeMenuKey} onMenuChange={setActiveMenuKey}>
            {renderContent()}
        </ProviderDashboardLayout>
    );
}