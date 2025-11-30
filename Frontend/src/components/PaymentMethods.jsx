import { useState } from "react";
import { BsCreditCard2Back, BsBank,} from "react-icons/bs";


export default function PaymentMethodsSection({onEdit, onRemove, onAdd }) {

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
     const handleEditPaymentMethod = (id) => {
        alert(`Edit payment method ${id} clicked `);
    };
    const handleRemovePaymentMethod = (id,type) => {
        if (window.confirm(`Are you sure you want to remove this payment method?`)) {
            setPaymentMethods((methods) => methods.filter((m) => m.id !== id));
        }
    };
    const handleAddPaymentMethod = () => {
        alert("Add Payment Method clicked (implement as needed)");
    };


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
                                onClick={() => handleEditPaymentMethod(id)}
                                className="rounded border border-green-600 text-green-600 px-4 py-1 text-sm font-semibold hover:bg-green-50 cursor-pointer transition-all duration-200"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleRemovePaymentMethod(id)}
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