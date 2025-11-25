import React, { useState } from "react";

export default function EditServiceForm({service,onSave,onCancel}){
    const [formData, setFormData] = useState({...service});
        
        const handleChange = (e) => {
            const {name,value} = e.target;
            setFormData(prev => ({...prev, [name]:value}))
        }
    
        const handleSubmit = (e)=> {
            e.preventDefault();
            onSave(formData);
            window.alert("Service updated successfully.")
        }
    
        return(
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                        <input type="text" name="serviceName" value={formData.serviceName} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-green-500  focus:outline-none" />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-green-500 bg-white focus:outline-none">
                                <option>Plumbing</option>
                                <option>HVAC</option>
                                <option>Electrical</option>
                            </select>
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-green-500 focus:outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <input type="text" name="duration" value={formData.duration} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-green-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea rows="4" name="description" value={formData.description} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-green-500 resize-none focus:outline-none"></textarea>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                    <button type="button" onClick={onCancel} className="px-6 py-2 border border-red-600 text-red-600 font-medium rounded-md hover:bg-red-50 cursor-pointer">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 cursor-pointer">Update Service</button>
                </div>
            </form>
        )
    
}