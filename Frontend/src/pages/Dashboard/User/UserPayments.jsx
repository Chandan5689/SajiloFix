import React, { useState, useEffect } from "react";
import {
    AiOutlineDownload,
    AiOutlineDollarCircle 
} from "react-icons/ai";
import { MdOutlinePending } from "react-icons/md";
import { BsCreditCard2Back, BsBank,} from "react-icons/bs";
// import { SiKhalti, SiEsewa } from "react-icons/si";
import { Modal } from "../../../components/Modal";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useUserProfile } from "../../../context/UserProfileContext";
import paymentsService from "../../../services/paymentsService";
import { useToast } from "../../../components/Toast";

export default function UserPayments() {
    const [activeTab, setActiveTab] = useState("Payment History");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [activeMenuKey, setActiveMenuKey] = useState("my-payments");
    const { userProfile: userData } = useUserProfile();
    const { addToast } = useToast();
    
    // Real API state
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch payment data from API
    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [historyResponse, pendingResponse] = await Promise.all([
                paymentsService.getPaymentHistory(),
                paymentsService.getPendingPayments(),
            ]);
            
            setPaymentHistory(historyResponse.results || historyResponse || []);
            const pendingList = pendingResponse?.pending_payments ?? pendingResponse?.results ?? pendingResponse ?? [];
            setPendingPayments(Array.isArray(pendingList) ? pendingList : []);
        } catch (err) {
            console.error('Failed to load payments:', err);
            setError(err.message || 'Failed to load payment data');
            addToast('Failed to load payment history', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Calculate payment summary from real data
    const getTotalPaid = () => {
        if (!Array.isArray(paymentHistory)) return '0.00';
        return paymentHistory
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
            .toFixed(2);
    };

    const getPendingAmount = () => {
        if (!Array.isArray(pendingPayments)) return '0.00';
        return pendingPayments
            .reduce((sum, b) => sum + parseFloat(b.final_price || b.quoted_price || 0), 0)
            .toFixed(2);
    };

    const getUniquePaymentMethods = () => {
        if (!Array.isArray(paymentHistory)) return 0;
        const methods = new Set(paymentHistory.map(p => p.payment_method));
        return methods.size;
    };

    const paymentSummary = [
        {
            title: "Total Paid",
            amount: `NPR ${getTotalPaid()}`,
            subtitle: "All time",
            bgColor: "bg-green-50",
            icon: <AiOutlineDollarCircle className="h-6 w-6 text-green-600" />,
        },
        {
            title: "Pending",
            amount: `NPR ${getPendingAmount()}`,
            subtitle: `${Array.isArray(pendingPayments) ? pendingPayments.length : 0} booking${(!Array.isArray(pendingPayments) || pendingPayments.length !== 1) ? 's' : ''}`,
            bgColor: "bg-yellow-50",
            icon: <MdOutlinePending className="h-6 w-6 text-yellow-500" />,
        },
        {
            title: "Payment Methods",
            amount: getUniquePaymentMethods().toString(),
            subtitle: "Used methods",
            bgColor: "bg-blue-50",
            icon: <BsCreditCard2Back className="h-6 w-6 text-blue-600" />,
        },
    ];

    // Nepal-specific payment methods (informational only)
    const availablePaymentMethods = [
        {
            id: 1,
            type: "Khalti",
            details: "Digital wallet payment",
            icon: <BsCreditCard2Back className="h-6 w-6 text-purple-600" />,
            available: true,
        },
        
        {
            id: 3,
            type: "Cash",
            details: "Pay provider directly after service",
            icon: <BsBank className="h-6 w-6 text-amber-600" />,
            available: true,
        },
    ];

    // Handlers
    const handleViewPayment = async (transactionUid) => {
        try {
            setDetailLoading(transactionUid);
            const paymentDetail = await paymentsService.getTransactionDetail(transactionUid);
            setSelectedPayment(paymentDetail);
        } catch (err) {
            console.error('Failed to load payment details:', err);
            addToast('Failed to load payment details', 'error');
        } finally {
            setDetailLoading(false);
        }
    };

    // Download receipt as earlier
    const downloadReceipt = (payment) => {
        const receiptContent = `
Payment Receipt
----------------------
Service: ${payment.service}
Provider: ${payment.provider}
Amount: Rs. ${payment.amount}
Status: ${payment.status}
Payment Method: ${payment.method}
Transaction ID: ${payment.transactionId}
Date: ${payment.date}
----------------------
Thank you for your payment!
`;
        const blob = new Blob([receiptContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${payment.service.replace(/\s/g, "_")}_receipt.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (

        <DashboardLayout activeMenuKey={activeMenuKey} onMenuChange={setActiveMenuKey} userData={userData}>


            {/* Title */}
            <header className="mb-8">
                <h1 className="text-xl font-semibold text-gray-900 mb-1">Payments</h1>
                <p className="text-gray-600 mb-6">Manage your payment history and methods</p>
            </header>


            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                {paymentSummary.map(({ title, amount, subtitle, bgColor, icon }) => (
                    <div
                        key={title}
                        className={`flex items-center gap-4 p-5 rounded-lg shadow-sm bg-white ${bgColor}`}
                    >
                        <div className="shrink-0">{icon}</div>
                        <div>
                            <p className="text-gray-500 font-semibold">{title}</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">{amount}</p>
                            <p className="text-sm text-gray-600">{subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="mt-8 flex sm:max-w-80 space-x-4 mb-2 bg-gray-200 rounded-lg">
                {["Payment History", "Payment Methods"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 m-1 py-2 flex justify text-sm font-medium rounded transition cursor-pointer ${activeTab === tab
                            ? "bg-white text-green-600"
                            : "text-gray-700 hover:text-gray-900"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-700 font-semibold">{error}</p>
                    <button
                        onClick={fetchPayments}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            ) : activeTab === "Payment History" ? (
                <PaymentHistorySection
                    paymentHistory={paymentHistory}
                    onViewPayment={handleViewPayment}
                    downloadReceipt={downloadReceipt}
                    detailLoading={detailLoading}
                />
            ) : (
                <PaymentMethodsSection
                    paymentMethods={availablePaymentMethods}
                />
            )}

            {/* Payment Details Modal */}
            <Modal
                isOpen={!!selectedPayment}
                onClose={() => setSelectedPayment(null)}
                title="Payment Details"
            >
                {selectedPayment && (
                    <PaymentDetail payment={selectedPayment} downloadReceipt={downloadReceipt} />
                )}
            </Modal>
        </DashboardLayout>
    );
}

// Payment History section component
function PaymentHistorySection({ paymentHistory, onViewPayment, downloadReceipt, detailLoading }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getStatusColor = (status) => {
        const colors = {
            completed: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            processing: 'bg-blue-100 text-blue-700',
            failed: 'bg-red-100 text-red-700',
            cancelled: 'bg-gray-100 text-gray-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getMethodIcon = (method) => {
        if (method === 'khalti') return '💳';
        if (method === 'cash') return '💵';
        
        return '💳';
    };

    if (!Array.isArray(paymentHistory) || paymentHistory.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <AiOutlineDollarCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold">No payment history yet</p>
                <p className="text-sm text-gray-400 mt-2">Your completed payments will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 my-6">
            {paymentHistory.map((payment) => (
                <div
                    key={payment.id}
                    className="flex items-center justify-between bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                >
                    {/* Left side */}
                    <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                            {getMethodIcon(payment.payment_method)}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{payment.service_title || 'Service'}</p>
                            <p className="text-gray-600 text-sm">
                                {payment.provider_name || 'Provider'}
                            </p>
                            <p className="text-gray-400 text-xs">
                                {formatDate(payment.completed_at || payment.created_at)} &bull; <span className="capitalize">{payment.payment_method_display || payment.payment_method}</span>
                            </p>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex flex-col gap-2 items-end">
                        <div className="text-right">
                            <p className="font-semibold text-gray-900">NPR {payment.amount}</p>
                            <span
                                className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${getStatusColor(payment.status)}`}
                            >
                                {payment.status_display || payment.status}
                            </span>
                        </div>

                        <button
                            className="flex items-center gap-1 border border-blue-600 text-blue-600 hover:bg-blue-700 hover:text-white rounded-lg px-3 py-1 text-sm font-semibold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => onViewPayment(payment.transaction_uid)}
                            disabled={detailLoading === payment.transaction_uid}
                        >
                            {detailLoading === payment.transaction_uid ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Loading...
                                </>
                            ) : (
                                'View Details'
                            )}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Payment Methods section component
function PaymentMethodsSection({ paymentMethods }) {
    return (
        <>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Available Payment Methods</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Choose your preferred payment method when completing a booking
                </p>
            </div>

            <div className="space-y-4">
                {paymentMethods.map(({ id, type, details, icon, available }) => (
                    <div
                        key={id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded shadow"
                    >
                        <div className="flex items-center gap-4">
                            <div className="shrink-0">{icon}</div>
                            <div>
                                <p className="font-semibold">{type}</p>
                                <p className="text-gray-600 text-sm">{details}</p>
                            </div>
                            {available && (
                                <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold select-none">
                                    Available
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Payment methods are selected during booking payment. You can choose between Khalti or Cash when making a payment.
                </p>
            </div>
        </>
    );
}

// Payment details inside modal
function PaymentDetail({ payment, downloadReceipt }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            completed: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            processing: 'bg-blue-100 text-blue-700',
            failed: 'bg-red-100 text-red-700',
            cancelled: 'bg-gray-100 text-gray-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="space-y-4 text-gray-800">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-semibold">{payment.booking_service_title || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Provider</p>
                    <p className="font-semibold">{payment.provider_name || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="text-blue-600 font-bold text-lg">NPR {payment.amount}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                        className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${getStatusColor(payment.status)}`}
                    >
                        {payment.status}
                    </span>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="capitalize font-medium">{payment.payment_method_display || payment.payment_method}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <p className="text-xs font-mono break-all">{payment.transaction_uid || 'N/A'}</p>
                </div>
                {payment.gateway_transaction_id && (
                    <div>
                        <p className="text-sm text-gray-500">Gateway Ref</p>
                        <p className="text-xs font-mono break-all">{payment.gateway_transaction_id}</p>
                    </div>
                )}
                <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-sm">{formatDate(payment.created_at)}</p>
                </div>
                {payment.completed_at && (
                    <div>
                        <p className="text-sm text-gray-500">Completed</p>
                        <p className="text-sm">{formatDate(payment.completed_at)}</p>
                    </div>
                )}
            </div>

            {payment.customer_name && (
                <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{payment.customer_name}</p>
                    {payment.customer_email && <p className="text-sm text-gray-500">{payment.customer_email}</p>}
                </div>
            )}

            {payment.status === 'completed' && (
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button
                        onClick={() => downloadReceipt({
                            service: payment.booking_service_title || 'Service',
                            provider: payment.provider_name || 'N/A',
                            amount: payment.amount,
                            status: payment.status,
                            method: payment.payment_method,
                            transactionId: payment.transaction_uid,
                            date: formatDate(payment.completed_at || payment.created_at),
                        })}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 cursor-pointer transition"
                    >
                        <AiOutlineDownload size={20} />
                        Download Receipt
                    </button>
                </div>
            )}
        </div>
    );
}
