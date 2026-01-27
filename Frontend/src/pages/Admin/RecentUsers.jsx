import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { MdCheckCircle, MdCancel, MdArrowForward } from 'react-icons/md';

export default function RecentUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentUsers();
  }, []);

  const fetchRecentUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/recent-users/?limit=5');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching recent users:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
        <h2 className="text-xl font-bold text-gray-900">Recent Users</h2>
        <Link to="/admin/users" className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm">
          View All <MdArrowForward size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No users yet</div>
      ) : (
        <div className="divide-y divide-gray-200">
          {users.map((user) => (
            <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-linear-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {user.first_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.first_name || user.email.split('@')[0]}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                {user.is_active ? (
                  <span className="flex items-center gap-1 text-green-600 text-xs font-semibold ml-2 shrink-0">
                    <MdCheckCircle size={14} /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 text-xs font-semibold ml-2 shrink-0">
                    <MdCancel size={14} /> Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                  user.user_type === 'find' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {user.user_type === 'find' ? 'Customer' : 'Provider'}
                </span>
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
