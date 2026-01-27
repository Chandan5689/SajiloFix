import React, { useState } from 'react';
import { MdSettings, MdSave, MdRefresh } from 'react-icons/md';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    platform_name: 'SajiloFix',
    max_booking_per_day: 10,
    commission_rate: 10,
    notification_email: 'admin@sajilofix.com',
    maintenance_mode: false,
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setSettings({
      ...settings,
      [field]: value,
    });
    setSaved(false);
  };

  const handleSave = () => {
    // TODO: Send to backend API
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600 mt-2">Configure platform-wide settings and preferences</p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white">✓</div>
          <p className="text-green-700 font-semibold">Settings saved successfully!</p>
        </div>
      )}

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MdSettings className="text-green-600" size={24} /> General Settings
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Platform Name</label>
              <input
                type="text"
                value={settings.platform_name}
                onChange={(e) => handleChange('platform_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Booking Per Day</label>
              <input
                type="number"
                value={settings.max_booking_per_day}
                onChange={(e) => handleChange('max_booking_per_day', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Commission Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.commission_rate}
                onChange={(e) => handleChange('commission_rate', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notification Email</label>
              <input
                type="email"
                value={settings.notification_email}
                onChange={(e) => handleChange('notification_email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MdRefresh className="text-green-600" size={24} /> System Settings
          </h2>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded focus:outline-none"
                />
                <span className="text-gray-700 font-semibold">Maintenance Mode</span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-8">
                Enable this to temporarily disable the platform for all users
              </p>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">Database Status: <span className="text-green-600 font-semibold">Connected</span></p>
              <p className="text-sm text-gray-600 mb-4">API Status: <span className="text-green-600 font-semibold">Active</span></p>
              <p className="text-sm text-gray-600">Cache Status: <span className="text-green-600 font-semibold">Enabled</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md"
        >
          <MdSave size={20} /> Save Settings
        </button>
      </div>
    </div>
  );
}
