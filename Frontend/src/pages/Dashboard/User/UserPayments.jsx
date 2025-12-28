import React, { useState, useEffect } from "react";
import {
    AiOutlineDownload,
    AiOutlineDollarCircle 
} from "react-icons/ai";
import { MdOutlinePending } from "react-icons/md";
import { BsCreditCard2Back, BsBank,} from "react-icons/bs";
import { HiOutlineWrenchScrewdriver } from "react-icons/hi2";
// import { SiKhalti, SiEsewa } from "react-icons/si";
import { Modal } from "../../../components/Modal";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useUserProfile } from "../../../context/UserProfileContext";

export default function UserPayments() {
    const [activeTab, setActiveTab] = useState("Payment History");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [activeMenuKey, setActiveMenuKey] = useState("my-payments");
    const { userProfile: userData } = useUserProfile();

    const paymentSummary = [
        {
            title: "Total Paid",
            amount: "$330",
            subtitle: "This month",
            bgColor: "bg-green-50",
            icon: <AiOutlineDollarCircle className="h-6 w-6 text-green-600" />,
        },
        {
            title: "Pending",
            amount: "$85",
            subtitle: "Awaiting payment",
            bgColor: "bg-yellow-50",
            icon: <MdOutlinePending className="h-6 w-6 text-yellow-500" />,
        },
        {
            title: "Payment Methods",
            amount: "3",
            subtitle: "Active methods",
            bgColor: "bg-blue-50",
            icon: <BsCreditCard2Back className="h-6 w-6 text-blue-600" />,
        },
    ];

    const paymentHistory = [
        {
            id: 1,
            service: "Plumbing Service",
            provider: "Mike Johnson",
            date: "2024-01-15",
            method: "eSewa",
            amount: 120,
            status: "Paid",
            statusColor: "bg-green-100 text-green-700",
            transactionId: "TXN-001234",
        },
        {
            id: 2,
            service: "House Cleaning",
            provider: "Clean Pro Services",
            date: "2024-01-12",
            method: "Khalti",
            amount: 60,
            status: "Paid",
            statusColor: "bg-green-100 text-green-700",
            transactionId: "TXN-001235",
        },
        {
            id: 3,
            service: "Electrical Repair",
            provider: "Sarah Wilson",
            date: "2024-01-18",
            method: "Bank Account",
            amount: 85,
            status: "Pending",
            statusColor: "bg-yellow-100 text-yellow-700",
            transactionId: "TXN-001236",
        },
    ];

    // Nepal-specific payment methods data
    const [paymentMethods, setPaymentMethods] = useState([
        {
            id: 1,
            type: "eSewa",
            details: "john.doe@esewa.com",
            default: true,
            icon: <BsCreditCard2Back className="h-6 w-6 text-red-500" />,
        },
        {
            id: 2,
            type: "Khalti",
            details: "john.khalti@gmail.com",
            default: false,
            icon: <BsCreditCard2Back className="h-6 w-6 text-pink-600" />,
        },
        {
            id: 3,
            type: "Bank Account",
            details: "SBI Bank •••• 1234",
            default: false,
            icon: <BsBank className="h-6 w-6 text-blue-600" />,
        },
    ]);

    // Handlers
    const handleEditPaymentMethod = (id) => {
        alert(`Edit payment method ${id} clicked (implement as needed)`);
    };

    const handleRemovePaymentMethod = (id) => {
        if (window.confirm("Are you sure you want to remove this payment method?")) {
            setPaymentMethods((methods) => methods.filter((m) => m.id !== id));
        }
    };

    const handleAddPaymentMethod = () => {
        alert("Add Payment Method clicked (implement as needed)");
    };

    // Download receipt as earlier
    const downloadReceipt = (payment) => {
        const receiptContent = `
Payment Receipt
----------------------
Service: ${payment.service}
Provider: ${payment.provider}
Amount: $${payment.amount}
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
            {activeTab === "Payment History" ? (
                <PaymentHistorySection
                    paymentHistory={paymentHistory}
                    setSelectedPayment={setSelectedPayment}
                    downloadReceipt={downloadReceipt}
                />
            ) : (
                <PaymentMethodsSection
                    paymentMethods={paymentMethods}
                    onEdit={handleEditPaymentMethod}
                    onRemove={handleRemovePaymentMethod}
                    onAdd={handleAddPaymentMethod}
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
function PaymentHistorySection({ paymentHistory, setSelectedPayment, downloadReceipt }) {
    return (
        <div className="space-y-3 my-6">
            {paymentHistory.map(
                ({
                    id,
                    service,
                    provider,
                    date,
                    method,
                    amount,
                    status,
                    statusColor,
                    transactionId,
                }) => (
                    <div
                        key={id}
                        className="flex items-center justify-between bg-white rounded shadow p-4"
                    >
                        {/* Left side */}
                        <div className="flex items-center space-x-4">
                            <button className="text-gray-900 bg-gray-300 px-2 py-2 rounded-lg">
                                <HiOutlineWrenchScrewdriver />
                            </button>
                            <div>
                                <p className="font-semibold">{service}</p>
                                <p className="text-gray-600 text-sm">{provider}</p>
                                <p className="text-gray-400 text-xs">
                                    {date} &bull; {method}
                                </p>
                            </div>
                        </div>

                        {/* Right side */}
                        <div className="flex flex-col gap-2 items-center space-x-4">
                            <div className="text-right">
                                <p className="font-semibold">${amount}</p>
                                <span
                                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}
                                >
                                    {status}
                                </span>
                            </div>

                            <button
                                className="flex items-center gap-1 border border-blue-600 text-blue-600 hover:bg-blue-700 hover:text-white rounded-lg px-3 py-1 text-sm font-semibold cursor-pointer transition-all duration-200"
                                onClick={() => setSelectedPayment({
                                    service,
                                    provider,
                                    amount,
                                    status,
                                    method,
                                    transactionId,
                                    date,
                                })}
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

// Payment Methods section component
function PaymentMethodsSection({ paymentMethods, onEdit, onRemove, onAdd }) {
    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Your Payment Methods</h3>
                {/* <button
                    onClick={onAdd}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition"
                >
                    <AiOutlinePlus size={18} />
                    Add Payment Method
                </button> */}
            </div>

            <div className="space-y-4">
                {paymentMethods.map(({ id, type, details, default: isDefault, icon }) => (
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
                            {isDefault && (
                                <span className="ml-2 px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-xs font-semibold select-none">
                                    Default
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2 mt-3 sm:mt-0">
                            <button
                                onClick={() => onEdit(id)}
                                className="rounded border border-green-600 text-green-600 px-4 py-1 text-sm font-semibold hover:bg-green-50 cursor-pointer transition-all duration-200"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => onRemove(id)}
                                className="rounded border border-red-600 text-red-600 px-4 py-1 text-sm font-semibold hover:bg-red-50 cursor-pointer transition-all duration-200"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

// Payment details inside modal
function PaymentDetail({ payment, downloadReceipt }) {
    return (
        <div className="space-y-4 text-gray-800">
            <p>
                <strong>Service:</strong> <br />
                {payment.service}
            </p>
            <p>
                <strong>Provider:</strong> <br />
                {payment.provider}
            </p>
            <p>
                <strong>Amount:</strong> <br />
                <span className="text-blue-600 font-semibold">${payment.amount}</span>
            </p>
            <p>
                <strong>Status:</strong> <br />
                <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${payment.status === "Paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                        }`}
                >
                    {payment.status}
                </span>
            </p>
            <p>
                <strong>Payment Method:</strong> <br />
                {payment.method}
            </p>
            <p>
                <strong>Transaction ID:</strong> <br />
                {payment.transactionId}
            </p>
            <p>
                <strong>Date:</strong> <br />
                {payment.date}
            </p>

            <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={() => downloadReceipt(payment)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 cursor-pointer transition"
                >
                    <AiOutlineDownload size={20} />
                    Download Receipt
                </button>
            </div>
        </div>
    );
}
