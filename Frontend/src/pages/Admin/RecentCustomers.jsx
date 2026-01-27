import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { MdCheckCircle, MdCancel, MdArrowForward, MdPerson } from 'react-icons/md';

export default function RecentCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentCustomers();
  }, []);

  const fetchRecentCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/recent-users/?limit=5&user_type=find');
      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching recent customers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <h2 className="text-lg font-bold text-gray-900">Recent Customers</h2>
        <Link to="/admin/customers" className="flex items-center gap-1.5 text-green-600 hover:text-green-700 font-semibold text-sm transition-colors">
          View All <MdArrowForward size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="p-8 text-center">
          <MdPerson className="text-gray-300 text-5xl mx-auto mb-3" />
          <p className="text-gray-500">No customers yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {customers.map((customer) => (
            <div key={customer.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                  {customer.first_name?.charAt(0)?.toUpperCase() || customer.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{customer.first_name || customer.email.split('@')[0]}</p>
                  <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                </div>
                {customer.is_active ? (
                  <span className="flex items-center gap-1 text-green-600 text-xs font-semibold shrink-0">
                    <MdCheckCircle size={14} /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 text-xs font-semibold shrink-0">
                    <MdCancel size={14} /> Inactive
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 ml-13">
                Joined {new Date(customer.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
