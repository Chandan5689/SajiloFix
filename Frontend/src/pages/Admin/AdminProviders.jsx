import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MdCheckCircle, MdCancel, MdVerified, MdSearch, MdRefresh, MdPerson, MdEmail, MdPhone, MdBusiness, MdChevronLeft, MdChevronRight, MdLocationOn, MdCalendarToday, MdBookmark, MdStar, MdWork, MdDescription } from 'react-icons/md';

export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone_number: '', business_name: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, [page, search, filterStatus]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('user_type', 'offer'); // Only providers
      if (filterStatus !== 'all') params.append('is_active', filterStatus === 'active');
      params.append('page', page);

      const response = await api.get(`/admin/users/?${params}`);
      
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setProviders(response.data.data);
        setTotalPages(response.data.total_pages || 1);
        setTotalCount(response.data.count || response.data.data.length);
        setError(null);
      } else {
        setProviders([]);
        setError('No provider data available');
      }
    } catch (err) {
      console.error('Error fetching providers:', err.response?.data || err.message);
      setError('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    try {
      setActionLoading(`${userId}-${action}`);
      await api.post(`/admin/users/${userId}/${action}/`);
      fetchProviders();
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      alert(`Failed to ${action} provider`);
    } finally {
      setActionLoading(null);
    }
  };

  const openModal = (user, mode = 'view') => {
    setSelectedUser(user);
    setModalMode(mode);
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      business_name: user.business_name || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSaving(false);
    setDeleting(false);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    try {
      setSaving(true);
      await api.put(`/admin/users/${selectedUser.id}/`, formData);
      closeModal();
      fetchProviders();
    } catch (err) {
      console.error('Error updating provider:', err.response?.data || err.message);
      alert('Failed to update provider');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    if (!window.confirm('Are you sure you want to delete this provider?')) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/users/${selectedUser.id}/`);
      closeModal();
      fetchProviders();
    } catch (err) {
      console.error('Error deleting provider:', err.response?.data || err.message);
      alert('Failed to delete provider');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Service Provider Management</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Manage and monitor all service providers on the platform</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative md:col-span-1">
            <MdSearch className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchProviders()}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors shadow-sm"
          >
            <MdRefresh size={20} /> Refresh
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 text-center">
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={fetchProviders}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading providers...</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <MdBusiness className="text-gray-300 text-6xl mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No service providers found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-linear-to-br from-green-50 to-emerald-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {providers.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-linear-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {provider.first_name?.charAt(0)?.toUpperCase() || provider.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{provider.first_name || provider.email.split('@')[0]}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MdEmail size={12} /> {provider.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MdBusiness size={14} />
                        <span>{provider.business_name || 'Not provided'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MdPhone size={14} />
                        <span>{provider.phone_number || 'Not provided'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {provider.is_active ? (
                        <span className="flex items-center gap-1 text-green-600 font-semibold text-sm bg-green-50 px-3 py-1 rounded-full w-fit">
                          <MdCheckCircle size={16} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 font-semibold text-sm bg-red-50 px-3 py-1 rounded-full w-fit">
                          <MdCancel size={16} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(provider.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(provider, 'view')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all shadow-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openModal(provider, 'edit')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 transition-all shadow-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleAction(provider.id, 'toggle_active')}
                          disabled={actionLoading === `${provider.id}-toggle_active`}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                            provider.is_active
                              ? 'bg-red-100 hover:bg-red-200 text-red-700 hover:shadow'
                              : 'bg-green-100 hover:bg-green-200 text-green-700 hover:shadow'
                          }`}
                        >
                          {actionLoading === `${provider.id}-toggle_active` ? 'Processing...' : (provider.is_active ? 'Deactivate' : 'Activate')}
                        </button>
                        {!provider.is_verified && (
                          <button
                            onClick={() => handleAction(provider.id, 'verify')}
                            disabled={actionLoading === `${provider.id}-verify`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 transition-all shadow-sm hover:shadow inline-flex items-center gap-1"
                          >
                            <MdVerified size={14} />
                            {actionLoading === `${provider.id}-verify` ? 'Verifying...' : 'Verify'}
                          </button>
                        )}
                        <button
                          onClick={() => openModal(provider, 'delete')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 transition-all shadow-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages} ({totalCount} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MdChevronLeft size={18} /> Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    page === pageNum
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next <MdChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-30 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {modalMode === 'view' ? 'Provider Profile' : modalMode === 'edit' ? 'Edit Provider' : 'Delete Provider'}
            </h3>

            {modalMode === 'delete' ? (
              <div className="space-y-4">
                <p className="text-gray-700">Are you sure you want to delete <span className="font-semibold">{selectedUser.email}</span>?</p>
                <div className="flex justify-end gap-3">
                  <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700">Cancel</button>
                  <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ) : modalMode === 'view' ? (
              <div className="space-y-5">
                {/* Profile Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  {selectedUser.profile_picture ? (
                    <img src={selectedUser.profile_picture} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-green-200" />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {selectedUser.first_name?.charAt(0)?.toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h4>
                    {selectedUser.business_name && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MdBusiness size={14} /> {selectedUser.business_name}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">{selectedUser.user_type_display || 'Service Provider'}</p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${selectedUser.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {selectedUser.is_active ? <MdCheckCircle size={14} /> : <MdCancel size={14} />}
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${selectedUser.is_verified ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    <MdVerified size={14} />
                    {selectedUser.is_verified ? 'Verified' : 'Not Verified'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${selectedUser.phone_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    <MdPhone size={14} />
                    {selectedUser.phone_verified ? 'Phone Verified' : 'Phone Not Verified'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${selectedUser.citizenship_verified ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                    <MdVerified size={14} />
                    {selectedUser.citizenship_verified ? 'Citizenship Verified' : 'Citizenship Not Verified'}
                  </span>
                  {selectedUser.registration_completed && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                      <MdCheckCircle size={14} /> Registration Complete
                    </span>
                  )}
                </div>

                {/* Activity Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <MdBookmark className="mx-auto text-green-600 mb-1" size={18} />
                    <p className="text-2xl font-bold text-green-700">{selectedUser.total_bookings || 0}</p>
                    <p className="text-xs text-green-600">Bookings</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <MdStar className="mx-auto text-yellow-600 mb-1" size={18} />
                    <p className="text-2xl font-bold text-yellow-700">{selectedUser.avg_rating || '—'}</p>
                    <p className="text-xs text-yellow-600">Avg Rating</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <MdWork className="mx-auto text-blue-600 mb-1" size={18} />
                    <p className="text-2xl font-bold text-blue-700">{selectedUser.years_of_experience || 0}</p>
                    <p className="text-xs text-blue-600">Yrs Exp.</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Contact Information</h5>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MdEmail className="text-gray-400" size={16} />
                      <span className="text-gray-600 break-all">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MdPhone className="text-gray-400" size={16} />
                      <span className="text-gray-600">{selectedUser.phone_number || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Business & Service Info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Business Details</h5>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MdBusiness className="text-gray-400" size={16} />
                      <span className="text-gray-500 min-w-[90px]">Business:</span>
                      <span className="text-gray-700">{selectedUser.business_name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MdLocationOn className="text-gray-400" size={16} />
                      <span className="text-gray-500 min-w-[90px]">Service Area:</span>
                      <span className="text-gray-700">{selectedUser.service_area || '—'}</span>
                    </div>
                    {selectedUser.bio && (
                      <div className="flex items-start gap-2 text-sm mt-1">
                        <MdDescription className="text-gray-400 mt-0.5" size={16} />
                        <span className="text-gray-500 min-w-[90px]">Bio:</span>
                        <span className="text-gray-700">{selectedUser.bio}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Info */}
                {(selectedUser.address || selectedUser.city || selectedUser.district || selectedUser.location) && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Location</h5>
                    <div className="space-y-2">
                      {selectedUser.location && (
                        <div className="flex items-start gap-2 text-sm">
                          <MdLocationOn className="text-gray-400 mt-0.5" size={16} />
                          <span className="text-gray-600">{selectedUser.location}</span>
                        </div>
                      )}
                      {(selectedUser.address || selectedUser.city || selectedUser.district) && (
                        <div className="flex items-start gap-2 text-sm">
                          <MdLocationOn className="text-gray-400 mt-0.5" size={16} />
                          <span className="text-gray-600">
                            {[selectedUser.address, selectedUser.city, selectedUser.district].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Member Since */}
                <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t border-gray-100">
                  <MdCalendarToday size={14} />
                  <span>Member since {new Date(selectedUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">Close</button>
                  <button onClick={() => setModalMode('edit')} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Edit</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                  <input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Business Name</label>
                  <input
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
