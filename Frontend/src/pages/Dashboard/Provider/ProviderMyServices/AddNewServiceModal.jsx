import React, { useState } from "react";

export default function AddNewServiceModal({ onSave, onCancel }) {
    const categories = ['Plumbing', 'HVAC', 'Electrical', 'Landscaping', 'Cleaning'];
    const statusOptions = ['Active', 'Inactive'];
    const [formData, setFormData] = useState({
        serviceName: '',
        category: categories[0], // Default to first category
        status: 'Active',        // Default status
        price: '',
        duration: '',
        description: ''
    })

    const handleChange = (e) => {
        const {name,value} = e.target;
        setFormData(prev => ({...prev,[name]: name === 'price'? parseFloat(value) || '' : value}))
    };

    const handleSubmit = (e) => {
        e.preventDeafult();
        if(!formData.serviceName || !formData.price || formData.duration){
            console.error("Validation failed: Please fill in all required fields.")
            return;
        }
        // Generate a temporary ID (in a real app, the backend does this)
        // Also add mock data for bookings and rating, matching the ServiceCard needs
        const newService = {
            ...formData,id:Date.now(),
        };
        onSave(newService);
        
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                    <input type="text" name="serviceName" value={formData.serviceName} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="Enter the service name" />
                </div>
                <div className="flex gap-4">
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-green-500 bg-white focus:outline-none">
                            {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                        </select>
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="0" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input type="text" name="duration" value={formData.duration} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="(e.g) 2-3 hours, 1 day" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows="4" name="description" value={formData.description} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-green-500 resize-none focus:outline-none " placeholder="Describe your service in detail ...."></textarea>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={onCancel} className="px-6 py-2 border border-red-600 text-red-600 font-medium rounded-md hover:bg-red-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 cursor-pointer">Add Service</button>
            </div>
        </form>
    )
}