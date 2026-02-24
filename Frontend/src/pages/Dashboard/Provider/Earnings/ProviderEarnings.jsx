import React, { useState, useEffect, useMemo } from "react";
import { DollarSign, Briefcase, Clock, TrendingUp, Download, RefreshCw } from "lucide-react";
import { AiOutlineDollarCircle, AiOutlineDownload } from "react-icons/ai";
import ProviderDashboardLayout from "../../../../layouts/ProviderDashboardLayout";
import { Modal } from "../../../../components/Modal";
import paymentsService from "../../../../services/paymentsService";
import { useToast } from "../../../../components/Toast";

// Period map: display label → API query param
const PERIOD_OPTIONS = [
    { label: "This Week", value: "this_week" },
    { label: "This Month", value: "this_month" },
    { label: "Last Month", value: "last_month" },
    { label: "This Year", value: "this_year" },
];

const Earnings = () => {
    const [selectedPeriod, setSelectedPeriod] = useState("this_month");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const { addToast } = useToast();

    // API state
    const [earnings, setEarnings] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch data when period changes
    useEffect(() => {
        fetchData();
    }, [selectedPeriod]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setStatsLoading(true);
            setError(null);

            const [historyRes, statsRes] = await Promise.all([
                paymentsService.getProviderEarningsHistory({ period: selectedPeriod }),
                paymentsService.getProviderEarningsStats(selectedPeriod),
            ]);

            setEarnings(historyRes.results || historyRes || []);
            setStats(statsRes);
        } catch (err) {
            console.error("Failed to load earnings:", err);
            setError(err.message || "Failed to load earnings data");
            addToast("Failed to load earnings data", "error");
        } finally {
            setLoading(false);
            setStatsLoading(false);
        }
    };

    // Build stats cards from API data
    const statCards = useMemo(() => {
        if (!stats) {
            return [
                { icon: <DollarSign className="w-5 h-5" />, label: "Total Earnings", value: "NRs 0", change: "No data yet", changePositive: true, bgColor: "bg-green-50", iconColor: "text-green-600" },
                { icon: <Briefcase className="w-5 h-5" />, label: "Completed Jobs", value: "0", change: "0 jobs completed", changePositive: true, bgColor: "bg-blue-50", iconColor: "text-blue-600" },
                { icon: <Clock className="w-5 h-5" />, label: "Pending Payments", value: "NRs 0", change: "0 payments pending", changePositive: false, bgColor: "bg-yellow-50", iconColor: "text-yellow-600" },
                { icon: <TrendingUp className="w-5 h-5" />, label: "Avg. Job Value", value: "NRs 0", change: "Per completed job", changePositive: true, bgColor: "bg-purple-50", iconColor: "text-purple-600" },
            ];
        }

        return [
            {
                icon: <DollarSign className="w-5 h-5" />,
                label: "Your Earnings",
                value: `NRs ${stats.provider_earnings?.toLocaleString() || "0"}`,
                change: `NRs ${stats.platform_fees?.toLocaleString() || "0"} platform fees`,
                changePositive: true,
                bgColor: "bg-green-50",
                iconColor: "text-green-600",
            },
            {
                icon: <Briefcase className="w-5 h-5" />,
                label: "Completed Jobs",
                value: (stats.completed_jobs || 0).toString(),
                change: `${stats.completed_jobs || 0} job${stats.completed_jobs !== 1 ? "s" : ""} completed`,
                changePositive: true,
                bgColor: "bg-blue-50",
                iconColor: "text-blue-600",
            },
            {
                icon: <Clock className="w-5 h-5" />,
                label: "Pending Payments",
                value: `NRs ${stats.pending_amount?.toLocaleString() || "0"}`,
                change: `${stats.pending_count || 0} payment${stats.pending_count !== 1 ? "s" : ""} pending`,
                changePositive: false,
                bgColor: "bg-yellow-50",
                iconColor: "text-yellow-600",
            },
            {
                icon: <TrendingUp className="w-5 h-5" />,
                label: "Avg. Job Value",
                value: `NRs ${stats.avg_job_value?.toLocaleString() || "0"}`,
                change: "Per completed job",
                changePositive: true,
                bgColor: "bg-purple-50",
                iconColor: "text-purple-600",
            },
        ];
    }, [stats]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    };

    const getStatusBadge = (status) => {
        const colors = {
            completed: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            processing: "bg-blue-100 text-blue-800",
            failed: "bg-red-100 text-red-800",
            cancelled: "bg-gray-100 text-gray-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getMethodIcon = (method) => {
        if (method === "khalti") return "💳";
        if (method === "cash") return "💵";
        
        return "💳";
    };

    // Download receipt for a single earning
    const downloadReceipt = (earning) => {
        const receiptContent = `
Earnings Receipt
----------------------
Service: ${earning.service_title || "Service"}
Customer: ${earning.customer_name || "Customer"}
Total Amount: NRs ${earning.amount}
Platform Fee (${earning.platform_fee_percentage}%): NRs ${earning.platform_fee}
Your Earnings: NRs ${earning.provider_amount}
Payment Method: ${earning.payment_method_display || earning.payment_method}
Status: ${earning.status}
Date: ${formatDate(earning.paid_at || earning.created_at)}
----------------------
Thank you!
`;
        const blob = new Blob([receiptContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `earning_${earning.id}_receipt.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Export all earnings as CSV
    const exportCSV = () => {
        if (!Array.isArray(earnings) || earnings.length === 0) {
            addToast("No earnings data to export", "warning");
            return;
        }
        const headers = ["Date", "Customer", "Service", "Amount", "Platform Fee", "Your Earnings", "Method", "Status"];
        const rows = earnings.map((e) => [
            formatDate(e.paid_at || e.created_at),
            e.customer_name || "",
            e.service_title || "",
            e.amount,
            e.platform_fee,
            e.provider_amount,
            e.payment_method_display || e.payment_method,
            e.status,
        ]);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `earnings_${selectedPeriod}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast("Earnings exported successfully", "success");
    };

    const periodLabel = PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.label || "This Month";

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
                        {PERIOD_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={exportCSV}
                        disabled={loading || !earnings.length}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 mb-2">
                                    {statsLoading ? (
                                        <span className="inline-block h-7 w-24 bg-gray-200 rounded animate-pulse" />
                                    ) : (
                                        stat.value
                                    )}
                                </p>
                                <p className={`text-xs ${stat.changePositive ? "text-green-600" : "text-gray-600"}`}>
                                    {statsLoading ? "" : stat.change}
                                </p>
                            </div>
                            <div className={`${stat.bgColor} ${stat.iconColor} p-3 rounded-lg`}>{stat.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Payment Methods Breakdown */}
            {stats?.payment_methods_breakdown && Object.keys(stats.payment_methods_breakdown).length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Breakdown</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Object.entries(stats.payment_methods_breakdown).map(([method, data]) => (
                            <div key={method} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <span className="text-2xl">{getMethodIcon(method)}</span>
                                <div>
                                    <p className="font-semibold capitalize text-gray-900">{method}</p>
                                    <p className="text-sm text-gray-600">
                                        {data.count} job{data.count !== 1 ? "s" : ""} · NRs {data.amount.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Earnings Table */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Recent Earnings
                        {!loading && (
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({Array.isArray(earnings) ? earnings.length : 0} records)
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse flex items-center gap-4">
                                <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 bg-gray-200 rounded" />
                                    <div className="h-3 w-1/4 bg-gray-200 rounded" />
                                </div>
                                <div className="h-4 w-20 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <p className="text-red-600 font-semibold">{error}</p>
                        <button
                            onClick={fetchData}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Retry
                        </button>
                    </div>
                ) : !Array.isArray(earnings) || earnings.length === 0 ? (
                    <div className="p-8 text-center">
                        <AiOutlineDollarCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-semibold">No earnings found for {periodLabel}</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Complete bookings and receive payments to see your earnings here
                        </p>
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
                                            Your Earnings
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Method
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {earnings.map((earning) => (
                                        <tr key={earning.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(earning.paid_at || earning.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {earning.customer_name || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {earning.service_title || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                NRs {parseFloat(earning.amount || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                                                NRs {parseFloat(earning.provider_amount || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                <span className="inline-flex items-center gap-1">
                                                    {getMethodIcon(earning.payment_method)}
                                                    <span className="capitalize">{earning.payment_method_display || earning.payment_method}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusBadge(earning.status)}`}
                                                >
                                                    {earning.status_display || earning.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => setSelectedPayment(earning)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden divide-y divide-gray-200">
                            {earnings.map((earning) => (
                                <div
                                    key={earning.id}
                                    className="p-4 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setSelectedPayment(earning)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex flex-col gap-1">
                                            <p className="font-semibold text-gray-900">{earning.customer_name || "Customer"}</p>
                                            <p className="text-sm text-gray-600">{earning.service_title || "Service"}</p>
                                        </div>
                                        <span
                                            className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(earning.status)}`}
                                        >
                                            {earning.status_display || earning.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-gray-500">Date</p>
                                            <p className="text-gray-900 font-medium">{formatDate(earning.paid_at || earning.created_at)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Your Earnings</p>
                                            <p className="text-green-700 font-semibold">NRs {parseFloat(earning.provider_amount || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Total Amount</p>
                                            <p className="text-gray-900">NRs {parseFloat(earning.amount || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Method</p>
                                            <p className="text-gray-900 capitalize">
                                                {getMethodIcon(earning.payment_method)} {earning.payment_method_display || earning.payment_method}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Earning Detail Modal */}
            <Modal isOpen={!!selectedPayment} onClose={() => setSelectedPayment(null)} title="Earning Details">
                {selectedPayment && (
                    <div className="space-y-4 text-gray-800">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Service</p>
                                <p className="font-semibold">{selectedPayment.service_title || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Customer</p>
                                <p className="font-semibold">{selectedPayment.customer_name || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Amount</p>
                                <p className="font-bold text-lg text-gray-900">NRs {selectedPayment.amount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Your Earnings</p>
                                <p className="font-bold text-lg text-green-700">NRs {selectedPayment.provider_amount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Platform Fee ({selectedPayment.platform_fee_percentage}%)</p>
                                <p className="text-sm font-medium text-red-600">- NRs {selectedPayment.platform_fee}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span
                                    className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${getStatusBadge(selectedPayment.status)}`}
                                >
                                    {selectedPayment.status_display || selectedPayment.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Payment Method</p>
                                <p className="capitalize font-medium">
                                    {getMethodIcon(selectedPayment.payment_method)} {selectedPayment.payment_method_display || selectedPayment.payment_method}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Date</p>
                                <p className="text-sm">{formatDate(selectedPayment.paid_at || selectedPayment.created_at)}</p>
                            </div>
                        </div>

                        {selectedPayment.status === "completed" && (
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <button
                                    onClick={() => downloadReceipt(selectedPayment)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 cursor-pointer transition"
                                >
                                    <AiOutlineDownload size={20} />
                                    Download Receipt
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
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


