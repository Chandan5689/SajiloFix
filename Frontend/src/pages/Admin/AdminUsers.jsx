import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MdDelete, MdCheckCircle, MdCancel, MdVerified, MdSearch, MdRefresh } from 'react-icons/md';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page, search, filterType, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterType !== 'all') params.append('user_type', filterType);
      if (filterStatus !== 'all') params.append('is_active', filterStatus === 'active');
      params.append('page', page);

      const response = await api.get(`/admin/users/?${params}`);
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setUsers(response.data.data);
        setError(null);
      } else {
        setUsers([]);
        setError('No user data available');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    try {
      setActionLoading(`${userId}-${action}`);
      await api.post(`/admin/users/${userId}/${action}/`);
      fetchUsers();
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      alert(`Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Manage and monitor all users on the platform</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <MdSearch className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
          </div>

          {/* Filter by Type */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
          >
            <option value="all">All Types</option>
            <option value="find">Customers</option>
            <option value="offer">Providers</option>
          </select>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchUsers()}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <MdRefresh size={20} /> Refresh
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 text-center">
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-linear-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user.first_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900">{user.first_name || user.email.split('@')[0]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                      user.user_type === 'find' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {user.user_type === 'find' ? 'Customer' : 'Provider'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{user.phone_number || '-'}</td>
                  <td className="px-6 py-4">
                    {user.is_active ? (
                      <span className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                        <MdCheckCircle size={16} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 font-semibold text-sm">
                        <MdCancel size={16} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(user.id, user.is_active ? 'toggle_active' : 'toggle_active')}
                        disabled={actionLoading === `${user.id}-toggle_active`}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                          user.is_active
                            ? 'bg-red-100 hover:bg-red-200 text-red-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                      >
                        {actionLoading === `${user.id}-toggle_active` ? '...' : (user.is_active ? 'Deactivate' : 'Activate')}
                      </button>
                      {!user.is_verified && (
                        <button
                          onClick={() => handleAction(user.id, 'verify')}
                          disabled={actionLoading === `${user.id}-verify`}
                          className="px-3 py-1 rounded text-xs font-semibold bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors"
                        >
                          {actionLoading === `${user.id}-verify` ? '...' : <MdVerified className="inline mr-1" />}
                          {actionLoading === `${user.id}-verify` ? '...' : 'Verify'}
                        </button>
                      )}
                      {!user.is_staff && (
                        <button
                          onClick={() => handleAction(user.id, 'make_admin')}
                          disabled={actionLoading === `${user.id}-make_admin`}
                          className="px-3 py-1 rounded text-xs font-semibold bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors"
                        >
                          {actionLoading === `${user.id}-make_admin` ? '...' : 'Make Admin'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
