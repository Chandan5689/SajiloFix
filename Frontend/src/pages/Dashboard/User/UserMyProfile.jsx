import React, { useState, useEffect } from "react";
import { FiEdit2 } from "react-icons/fi";
import DashboardLayout from "../../../layouts/DashboardLayout";

export default function UserMyProfile() {
    const [activeMenuKey, setActiveMenuKey] = useState("my-profile");
    const [activeTab, setActiveTab] = useState("Personal Info");
    
    // Form state
    const [form, setForm] = useState({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@email.com",
        phone: "+1 (555) 123-4567",
        dob: "1990-05-15", // For date input type format (yyyy-mm-dd)
        address: "123 Main Street",
        city: "Anytown",
        state: "CA",
        bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod.",
    });

    const [isEditing, setIsEditing] = useState(false);

    // Backup of form data to restore if cancelled
    const [backupForm, setBackupForm] = useState(form);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // Handle Edit button click
    const handleEditClick = () => {
        setBackupForm(form); // save current state
        setIsEditing(true);
    };

    // Handle Cancel button click
    const handleCancel = () => {
        setForm(backupForm); // revert changes
        setIsEditing(false);
    };

    // Handle Save Changes (simulate save)
    const handleSave = (e) => {
        e.preventDefault();
        window.alert("Your profile has been updated.")
        // You can add API save logic here before setting editing false
        setIsEditing(false);
    };

    // Format date for input display (yyyy-mm-dd)
    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        return dateString;
    };

    // Tabs array
    const tabs = ["Personal Info", "Security", "Preferences"];
    return (
        <DashboardLayout activeMenuKey={activeMenuKey} onMenuChange={setActiveMenuKey}>
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
                <p className="mt-1 text-gray-600">
                    Manage your account settings and preferences
                </p>
            </header>

            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-lg mt-8 p-6 flex flex-col
                sm:flex-row gap-2 items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl select-none">
                        JD
                    </div>
                    <div>
                        <p className="font-semibold text-lg">John Doe</p>
                        <p className="text-gray-600">john.doe@email.com</p>
                        <p className="text-gray-600">+1 (555) 123-4567</p>
                        <span className="mt-1 inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">
                            Verified Customer
                        </span>
                    </div>
                </div>
                {!isEditing ? (
                    <button
                        type="button"
                        className="inline-flex items-center ml-10 gap-2 rounded border border-green-600 bg-white px-4 py-2 text-green-600 hover:bg-green-600 hover:text-white transition-all duration-200 font-semibold text-sm focus:outline-none cursor-pointer"
                        onClick={handleEditClick}
                    >
                        <FiEdit2 size={16} />
                        Edit Profile
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="rounded-lg bg-red-500 px-6 py-2 font-semibold text-white hover:bg-red-600 cursor-pointer transition-all duration-200"
                    >
                        Cancel
                    </button>
                )}

            </div>

            {/* Tabs */}
            <div className="mt-8 flex sm:max-w-96 space-x-4 mb-2 bg-gray-200 rounded-lg">
                {tabs.map(tab => (
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

            {/* Personal Information Form */}
            {activeTab === "Personal Info" && (
                <form
                    onSubmit={handleSave}
                    className="bg-white rounded-b-lg shadow px-6 py-8 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {[
                        { label: "First Name", name: "firstName", type: "text", value: form.firstName },
                        { label: "Last Name", name: "lastName", type: "text", value: form.lastName },
                        { label: "Email", name: "email", type: "email", value: form.email },
                        { label: "Phone", name: "phone", type: "tel", value: form.phone },
                        {
                            label: "Date of Birth",
                            name: "dob",
                            type: "date",
                            value: formatDateForInput(form.dob),
                        },
                        { label: "Address", name: "address", type: "text", value: form.address },
                        { label: "City", name: "city", type: "text", value: form.city },
                        { label: "State", name: "state", type: "text", value: form.state },
                    ].map(({ label, name, type, value }) => (
                        <div key={name}>
                            <label
                                htmlFor={name}
                                className="block text-gray-700 font-medium mb-1"
                            >
                                {label}
                            </label>
                            <input
                                id={name}
                                name={name}
                                type={type}
                                value={value}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className={`w-full rounded border px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 ${isEditing
                                    ? "border-gray-300 focus:ring-green-500"
                                    : "border-transparent bg-gray-100 cursor-not-allowed"
                                    }`}
                            />
                        </div>
                    ))}

                    {/* Bio Textarea - full width */}
                    <div className="md:col-span-2">
                        <label htmlFor="bio" className="block text-gray-700 font-medium mb-1">
                            Bio
                        </label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={form.bio}
                            onChange={handleChange}
                            disabled={!isEditing}
                            rows={4}
                            placeholder="Tell us about yourself"
                            className={`w-full rounded border px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 resize-none ${isEditing
                                ? "border-gray-300 focus:ring-green-500"
                                : "border-transparent bg-gray-100 cursor-not-allowed"
                                }`}
                        />
                    </div>

                    {/* Save/Cancel Buttons */}
                    {isEditing && (
                        <div className="md:col-span-2 flex justify-end space-x-4 pt-4 border-t border-gray-200 mt-6">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-lg bg-red-500 px-6 py-2 font-semibold text-white hover:bg-red-600 cursor-pointer transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 cursor-pointer transition-all duration-200"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}
                </form>
            )}

            {activeTab !== "Personal Info" && (
                <div className="bg-white p-8 rounded-lg shadow mt-4 text-gray-700">
                    <p>{activeTab} page content goes here.</p>
                </div>
            )}
        </DashboardLayout>
    );
}
