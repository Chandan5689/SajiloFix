import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FiChevronsDown, FiEdit2 } from "react-icons/fi";
import ProviderDashboardLayout from "../../../../layouts/ProviderDashboardLayout";
import { RxCross2 } from "react-icons/rx";
import { Eye, FileText, Pencil, PlusCircle, Trash2 } from "lucide-react";

export default function MyProfile() {
    const [activeMenuKey, setActiveMenuKey] = useState("my-profile");
    const [activeTab, setActiveTab] = useState("Personal Info");

    const allSpecialities = useMemo(() => (
        [
            {
                id: 'plumbing', name: 'Plumbing', specializations: [
                    'Residential Plumbing', 'Commercial Plumbing', 'Emergency Repairs',
                    'Pipe Installation', 'Bathroom Renovation', 'Kitchen Plumbing',
                    'Water Heater Service', 'Drain Cleaning', 'Leak Detection',
                    'Sewer Line Repair', 'HVAC Plumbing',
                ]
            },
            {
                id: 'electrical', name: 'Electrical', specializations: [
                    'Residential Wiring', 'Commercial Wiring', 'Emergency Electrical',
                    'Panel Upgrades', 'Lighting Installation', 'Outlet Repair',
                    'Generator Installation',
                ]
            },
            {
                id: 'carpentry', name: 'Carpentry', specializations: [
                    'Framing', 'Trim Work', 'Cabinet Installation',
                    'Deck Building', 'Window/Door Installation',
                ]
            },
        ]
    ))
    // Form state
    const [form, setForm] = useState({
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@email.com",
        phone: "+1 (555) 123-4567",
        address: "123 Main Street",
        city: "Anytown",
        bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod.",
        businessName: "John Plumbing Service",
        YOE: 10,
        serviceArea: "Pokhara",
        specialities: ['Plumbing'],
        specializations: ['Residential Plumbing', 'Pipe Installation', 'Emergency Repairs'],
        certificates: [
            { id: 1, name: "Master Plumber License.pdf", date: "2023-01-15", url: "#" },
            { id: 2, name: "Business Insurance Policy.docx", date: "2023-02-10", url: "#" }
        ]

    });

    const [isEditing, setIsEditing] = useState(false);

    // Backup of form data to restore if cancelled
    const [backupForm, setBackupForm] = useState(form);

    //
    const availableSpecializations = useMemo(() => {
        return [...new Set(allSpecialities.filter(s => form.specialities.includes(s.id)).flatMap(s => s.specializations))].sort().map(name => ({ id: name, name }));
    }, [form.specialities, allSpecialities])

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    //Handle adding/removing a speciality ID
    const handleSpecialityChange = useCallback((specialityId, action) => {
        setForm((prev) => {
            const current = prev.specialities || [];
            if (action === "add" && !current.includes(specialityId)) {
                return { ...prev, specialities: [current, specialityId] };
            }
            if (action === "remove") {
                const newSpecialities = current.filter(id => id !== specialityId);
                //Find the specializations belonging to the speciality being removed
                const removedSpeciality = allSpecialities.find(s => s.id === specialityId);
                // Keep only specializations that DO NOT belong to the removed specialty
                const remainingSpecializations = prev.specializations.filter(specName => !removedSpeciality?.specializations.includes(specName));

                return { ...prev, specialities: newSpecialities, specializations: remainingSpecializations }
            }
            return prev;
        })
    }, [allSpecialities])

    // Handle adding/removing a specialization name
    const handleSpecializationChange = useCallback((specName, action) => {
        setForm((prev) => {
            const current = prev.specializations || [];
            if (action === 'add' && !current.includes(specName)) {
                // Ensure the specialization being added is actually available based on selected specialties
                const isAvailable = availableSpecializations.some(s => s.id === specName);
                if (isAvailable) {
                    return { ...prev, specializations: [...current, specName] };
                }
            }
            if (action === 'remove') {
                return { ...prev, specializations: current.filter(name => name !== specName) };
            }
            return prev;
        });
    }, [availableSpecializations]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // In a real app, you would upload to a server here.
            // We are simulating it by creating a local URL.
            const newCertificate = {
                id: Date.now(),
                name: file.name,
                date: new Date().toISOString().split('T')[0],
                url: URL.createObjectURL(file),
                file: file // Storing raw file if needed for actual upload logic
            };
            setForm(prev => ({
                ...prev,
                certificates: [...prev.certificates, newCertificate]
            }));
        }
    };

    // Handle File Removal
    const handleRemoveCertificate = (id) => {
        setForm(prev => ({
            ...prev,
            certificates: prev.certificates.filter(cert => cert.id !== id)
        }));
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
    const tabs = ["Personal Info", "Business Info", "Certificates"];

    const renderInputField = (label, name, type, value, isEditing, onChange, extraProps = {}) => (
        <div>
            <label htmlFor={name} className="block text-gray-700 font-medium mb-1">{label}</label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                disabled={!isEditing}
                className={`w-full rounded border px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 transition ${isEditing
                    ? "border-gray-300 focus:ring-green-500"
                    : "border-transparent bg-gray-100 cursor-not-allowed"
                    }`}
                {...extraProps}
            />
        </div>
    );

    return (
        <ProviderDashboardLayout activeMenuKey={activeMenuKey} onMenuChange={setActiveMenuKey}>
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
                <p className="mt-1 text-gray-600">
                    Manage your profile settings and preferences
                </p>
            </header>

            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-xl mt-8 p-6 flex flex-col sm:flex-row gap-4 items-center justify-between border-t-4 border-green-500">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl select-none shadow-md">
                        {form.firstName[0]}{form.lastName[0]}
                    </div>
                    <div>
                        <p className="font-semibold text-lg">{form.firstName} {form.lastName}</p>
                        <p className="text-gray-600 text-sm">{form.email}</p>
                        <p className="text-gray-600 text-sm">{form.phone}</p>
                        <span className="mt-2 inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Verified Provider
                        </span>
                    </div>
                </div>
                {!isEditing ? (
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-green-600 bg-white px-5 py-2.5 text-green-600 hover:bg-green-600 hover:text-white transition-all duration-200 font-semibold text-sm shadow-md"
                        onClick={handleEditClick}
                    >
                        <Pencil size={16} /> {/* Using Pencil from lucide-react instead of FiEdit2 */}
                        Edit Profile
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="rounded-full bg-red-500 px-5 py-2.5 font-semibold text-white hover:bg-red-600 transition-all duration-200 shadow-md"
                    >
                        Cancel Editing
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="mt-8">
                <div className="flex space-x-1 p-1 bg-gray-200 rounded-xl shadow-inner">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === tab
                                ? "bg-white text-green-600 shadow-md"
                                : "text-gray-700 hover:bg-gray-300"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-b-xl shadow-xl p-6 sm:p-8 mt-4">
                <form onSubmit={handleSave}>

                    {/* Personal Info Tab Content */}
                    {activeTab === "Personal Info" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Simple Inputs */}
                            {[
                                { label: "First Name", name: "firstName", type: "text", value: form.firstName },
                                { label: "Last Name", name: "lastName", type: "text", value: form.lastName },
                                { label: "Email (Read-Only)", name: "email", type: "email", value: form.email, disabled: true },
                                { label: "Phone", name: "phone", type: "tel", value: form.phone },
                                { label: "Street Address", name: "address", type: "text", value: form.address },
                                { label: "City/Region", name: "city", type: "text", value: form.city },
                            ].map(({ label, name, type, value, disabled: inputDisabled }) => (
                                <React.Fragment key={name}>
                                    {renderInputField(label, name, type, value, isEditing && !inputDisabled, handleChange)}
                                </React.Fragment>
                            ))}

                            {/* Bio Textarea - full width */}
                            <div className="md:col-span-2">
                                <label htmlFor="bio" className="block text-gray-700 font-medium mb-1">
                                    Professional Bio
                                </label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={form.bio}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    rows={4}
                                    placeholder="Tell us about your professional background and experience."
                                    className={`w-full rounded border px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 resize-none transition ${isEditing
                                        ? "border-gray-300 focus:ring-green-500"
                                        : "border-transparent bg-gray-100 cursor-not-allowed"
                                        }`}
                                />
                            </div>
                        </div>
                    )}

                    {/* Business Info Tab Content */}
                    {activeTab === "Business Info" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Business Name */}
                            {renderInputField("Business Name", "businessName", "text", form.businessName, isEditing, handleChange)}

                            {/* Years of Experience (YOE) */}
                            {renderInputField("Years of Experience (YOE)", "YOE", "number", form.YOE, isEditing, handleChange, { min: 0 })}

                            {/* Service Area */}
                            {renderInputField("Primary Service Area", "serviceArea", "text", form.serviceArea, isEditing, handleChange, {
                                placeholder: "E.g., Pokhara, Lakeside, Begnas",
                            })}

                            {/* Empty space for layout balance */}
                            <div></div>

                            {/* Specialties Multi-Select */}
                            <div className="md:col-span-2">
                                <MultiSelectTagInput
                                    label="Main Specialties (e.g., Plumbing, Electrical)"
                                    options={allSpecialities.map(s => ({ id: s.id, name: s.name }))} // Pass Specialty IDs/Names
                                    selectedValues={form.specialities} // Expects IDs
                                    onSelect={(id) => handleSpecialityChange(id, 'add')}
                                    onRemove={(id) => handleSpecialityChange(id, 'remove')}
                                    disabled={!isEditing}
                                    placeholder="Select your main trade(s)"
                                />
                            </div>

                            {/* Specializations Multi-Select - Depends on Specialties */}
                            <div className="md:col-span-2">
                                <MultiSelectTagInput
                                    label="Specific Expertise / Specializations"
                                    options={availableSpecializations} // Pass Specialization Names as IDs/Names
                                    selectedValues={form.specializations} // Expects Names
                                    onSelect={(name) => handleSpecializationChange(name, 'add')}
                                    onRemove={(name) => handleSpecializationChange(name, 'remove')}
                                    disabled={!isEditing || form.specialities.length === 0}
                                    placeholder={form.specialities.length === 0 ? "Select a main specialty first" : "Select your specific expertise"}
                                />
                            </div>
                            <p className="md:col-span-2 text-sm text-gray-500 mt-2">
                                Your Specializations are derived from your selected Main Specialties.
                            </p>
                        </div>
                    )}

                    {/* Certificates Tab Content - Placeholder */}
                    {activeTab === "Certificates" && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">Uploaded Documents</h3>
                                {isEditing && (
                                    <label className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 transition duration-200 text-sm font-semibold cursor-pointer shadow-sm">
                                        <Upload size={16} />
                                        Upload New
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            onChange={handleFileUpload}
                                        />
                                    </label>
                                )}
                            </div>

                            {form.certificates.length === 0 ? (
                                <div className="bg-gray-50 p-8 rounded-lg border border-dashed border-gray-300 text-center">
                                    <p className="text-gray-500">No certificates uploaded yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {form.certificates.map((cert) => (
                                        <div key={cert.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-gray-50 hover:bg-white hover:shadow-md transition duration-200">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-green-100 rounded-lg text-green-700 shrink-0">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate" title={cert.name}>{cert.name}</p>
                                                    <p className="text-xs text-gray-500">Uploaded: {cert.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                <a
                                                    href={cert.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                                    title="View Document"
                                                >
                                                    <Eye size={18} />
                                                </a>
                                                {isEditing && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveCertificate(cert.id)}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                                                        title="Delete Document"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Save Buttons (visible only when editing) */}
                    {isEditing && (
                        <div className="flex justify-end space-x-4 pt-6 mt-8 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-full bg-gray-300 px-6 py-2 font-semibold text-gray-800 hover:bg-gray-400 transition-all duration-200 shadow-md"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-full bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 transition-all duration-200 shadow-lg"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </ProviderDashboardLayout>
    );
}


const MultiSelectTagInput = ({ options, selectedValues, onSelect, onRemove, label, disabled, placeholder = "Select one or more items" }) => {
    const [isOpen, setIsOpen] = useState(false);

    //Convert selected IDs to names for display
    const selectedNames = useMemo(() => {
        return selectedValues.map(id => {
            const option = options.find(opt => opt.id === id);
            return option ? option.name : id;
        });
    }, [selectedValues, options]);

    const availableOptions = useMemo(() => { return options.filter(opt => !selectedValues.includes(opt.id)) }, [selectedValues, options]);

    const handleSelect = useCallback((id) => {
        onSelect(id);
    }, [onSelect])

    return (
        <div className="relative z-10">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className={`w-full min-h-11 bg-white border rounded-lg p-2 flex flex-wrap items-center shadow-sm transition ${disabled
                ? "bg-gray-100 cursor-not-allowed border-gray-200"
                : "border-gray-300 cursor-pointer focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500"
                }`}
                onClick={() => !disabled && setIsOpen(!isOpen)}>

                {selectedNames.length > 0 ? (
                    selectedNames.map((name, index) => (
                        <span key={index} className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium mr-2 mb-1 mt-1 px-2.5 py-1 rounded-full whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}>
                            {name}
                            {!disabled && (<RxCross2 size={12} className="ml-1 cursor-pointer hover:text-blue-900
                            "
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(selectedValues[index])
                                }} />)}


                        </span>
                    ))
                ) : (
                    <span className="text-gray-500 text-sm italic py-1">{placeholder}</span>
                )}
                <FiChevronsDown size={16} className={`ml-auto text-gray-500 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </div>

            {/* Dropdown Optiions */}
            {!disabled && isOpen && availableOptions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {availableOptions.map(option => (
                        <div key={option.id} className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition"
                            onClick={() => { handleSelect(option.id) }}>
                            {option.name}
                        </div>
                    ))}

                </div>
            )}
            {!disabled && isOpen && availableOptions.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-3 text-sm text-gray-500 text-center">
                    All specialties selected.
                </div>
            )}

        </div>
    )
}