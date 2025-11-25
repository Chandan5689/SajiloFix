import React, { useState } from 'react';
import ProviderDashboardLayout from "../../../../layouts/ProviderDashboardLayout";
import { FaEdit } from 'react-icons/fa';

import { Modal } from '../../../../components/Modal';
import ServiceCard from './ServiceCard';
import EditServiceForm from './EditServiceForm';
import AddNewServiceModal from './AddNewServiceModal';

export default function ProviderMyServices() {
    const [activeMenu, setActiveMenu] = useState("my-services");
    const [isEditing, setIsEditing] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [serviceData, setServiceData] = useState([
        {
            id: 101,
            serviceName: "Emergency Pipe Burst Repair",
            category: "Plumbing",
            status: "Active",
            price: "250",
            duration: "3-5 hours",
            description: "Immediate response for severe pipe bursts and flooding issues, including temporary containment and repair.",
        },
        {
            id: 102,
            serviceName: "Standard Furnace Tune-Up",
            category: "HVAC",
            status: "Active",
            price: "110",
            duration: "1.5 hours",
            description: "Comprehensive annual maintenance for gas or electric furnaces, focusing on safety and efficiency checks.",
        },
        {
            id: 103,
            serviceName: "Drain Cleaning & Unclogging",
            category: "Plumbing",
            status: "Active",
            price: "135",
            duration: "1-2 hours",
            description: "Professional cleaning using hydro-jetting or snaking equipment for stubborn drain blockages in sinks, toilets, or showers.",
        },
        {
            id: 104,
            serviceName: "New Central AC Installation Quote",
            category: "HVAC",
            status: "Inactive",
            price: "0",
            duration: "1 hour",
            description: "On-site consultation and quote for replacing or installing a new central air conditioning system.",
        },
        {
            id: 105,
            serviceName: "Water Heater Replacement",
            category: "Plumbing",
            status: "Active",
            price: "500", // Base labor cost, excluding tank cost
            duration: "4-6 hours",
            description: "Removal of old water heater and installation of a new tankless or conventional unit.",
        },
    ])

    const handleUpdateService = (updatedService) => {
        setServiceData(prev => prev.map(s => (s.id === updatedService.id ? updatedService : s)));
        setIsEditing(null);
    }

    const handleAddService = (newService) => {
        setServiceData(prev => [...prev, newService]);
        setIsAddModalOpen(false); // Close modal after successful add
    };

    const toggleServiceStatus = (id, currentStatus) => {
        setServiceData(prev => 
            prev.map(s => {
                if (s.id === id) {
                    return {
                        ...s,
                        status: currentStatus === 'Active' ? 'Inactive' : 'Active'
                    };
                }
                return s;
            })
        );
    };

    return (
        <ProviderDashboardLayout activeMenuKey={activeMenu} onMenuChange={setActiveMenu}>
            <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold">My Services</h2>
                    <p className="text-gray-600 mt-1">
                        Manage your service offerings and pricing
                    </p>
                </div>
                <button className="bg-green-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-green-700 transition" onClick={() => setIsAddModalOpen(true)}>
                    Add New Service
                </button>
            </div>

            {/* main content -- services*/}
            <div className='grid gap-6 grid-cols-1 md:grid-cols-2'>
                {serviceData.length > 0 ?
                    (serviceData.map((service) => (
                        <ServiceCard key={service.id} service={service} onEdit={setIsEditing} onStatusToggle={toggleServiceStatus}/>
                    ))
                    ) :
                    (
                        <div className="text-center p-10 bg-white rounded-lg shadow-md text-gray-500">
                            No services listed so far. List some services.
                        </div>
                    )
                }
            </div>

            {isEditing && (
                <Modal isOpen={!!isEditing} onClose={() => setIsEditing(null)}
                    title="Edit Service">
                    <EditServiceForm service={isEditing} onSave={handleUpdateService}
                        onCancel={() => setIsEditing(null)} />
                </Modal>
            )}

            {isAddModalOpen && (
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Service">
                    <AddNewServiceModal onSave={{ handleAddService }}
                        onCancel={() => setIsAddModalOpen(false)} />

                </Modal>
            )}

        </ProviderDashboardLayout>
    )
}
