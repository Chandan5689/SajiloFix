import React, { useState } from 'react';
import { Save,Calendar, Clock, Settings, Zap } from 'lucide-react';
import ProviderDashboardLayout from '../../../../layouts/ProviderDashboardLayout';

// Helper to generate time options (every 30 mins)
const generateTimeOptions = () => {
    const times = [];

    // Start at 8 AM (08:00) and end at 6 PM (18:00)
    for (let i = 8; i <= 18; i++) {
        const hour12 = i === 0 ? 12 : i > 12 ? i - 12 : i;  // Convert 24h → 12h format
        const ampm = i < 12 ? 'AM' : 'PM';

        // Add only the “:00” minute
        times.push(`${hour12}:00 ${ampm}`);
    }

    return times;
};
const timeOptions = generateTimeOptions();

const Availability = () => {
    const [activeTab, setActiveTab] = useState('Weekly Schedule');
    const [activeMenu, setActiveMenu] = useState("availability");
    // Initial State mimicking the image (Mon/Thu unavailable, Tue/Wed/Fri available)
    const [schedule, setSchedule] = useState([
        { day: 'Monday', enabled: false, startTime: '9:00 AM', endTime: '5:00 PM', breakStart: '12:00 PM', breakEnd: '1:00 PM' },
        { day: 'Tuesday', enabled: true, startTime: '8:00 AM', endTime: '5:00 PM', breakStart: '12:00 PM', breakEnd: '1:00 PM' },
        { day: 'Wednesday', enabled: true, startTime: '8:00 AM', endTime: '5:00 PM', breakStart: '12:00 PM', breakEnd: '1:00 PM' },
        { day: 'Thursday', enabled: false, startTime: '9:00 AM', endTime: '5:00 PM', breakStart: '12:00 PM', breakEnd: '1:00 PM' },
        { day: 'Friday', enabled: true, startTime: '8:00 AM', endTime: '5:00 PM', breakStart: '12:00 PM', breakEnd: '1:00 PM' },
        { day: 'Saturday', enabled: false, startTime: '10:00 AM', endTime: '2:00 PM', breakStart: '12:00 PM', breakEnd: '12:30 PM' },
        { day: 'Sunday', enabled: false, startTime: '10:00 AM', endTime: '2:00 PM', breakStart: '12:00 PM', breakEnd: '12:30 PM' },
    ]);

    // Toggle Day Availability
    const toggleDay = (index) => {
        const newSchedule = [...schedule];
        newSchedule[index].enabled = !newSchedule[index].enabled;
        setSchedule(newSchedule);
    };

    // Handle Time Changes
    const handleTimeChange = (index, field, value) => {
        const newSchedule = [...schedule];
        newSchedule[index][field] = value;
        setSchedule(newSchedule);
    };

    const handleSave = () => {
        console.log("Saving Schedule:", schedule);
        alert("Schedule Saved Successfully!");
    };

    const [settings, setSettings] = useState({
        emergencyAvailability: true,
        advanceBooking: '30 days',
        bufferTime: '15 minutes',
        sessionDuration: '30 minutes',
    });

    const handleSettingChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveSettings = () => {
        console.log("Saving Settings:", settings);
        // Using a custom modal style message instead of alert()
        alert("Availability Settings Saved!");
    };

    return (
        <ProviderDashboardLayout activeMenuKey={activeMenu} onMenuChange={setActiveMenu}>
            <div className="min-h-screen bg-gray-50 p-6 sm:p-10 font-sans text-gray-900">
                <div className="max-w-5xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Availability Management</h1>
                        <p className="text-gray-500 mt-1">Set your working hours and manage your schedule</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl w-fit mb-8 shadow-inner">
                        {['Weekly Schedule', 'Settings'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 flex items-center gap-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === tab
                                    ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-200'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {tab === 'Weekly Schedule' && <Clock size={16} />}
                                {tab === 'Settings' && <Settings size={16} />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Card */}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">

                        {/* Card Header */}
                        {activeTab === "Weekly Schedule" && (
                            <form action="">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                                    <h2 className="text-xl font-bold text-gray-800">Weekly Schedule</h2>

                                </div>

                                {/* Schedule List */}
                                <div className="space-y-6">
                                    {schedule.map((daySchedule, index) => (
                                        <div
                                            key={daySchedule.day}
                                            className='border rounded-lg transition-all duration-300 border-gray-200 bg-white p-6'
                                        >
                                            {/* Day Checkbox Row */}
                                            <div className={`flex items-center ${daySchedule.enabled ? 'mb-6' : 'w-full'}`}>
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id={`day-${index}`}
                                                        type="checkbox"
                                                        checked={daySchedule.enabled}
                                                        onChange={() => toggleDay(index)}
                                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer transition"
                                                    />
                                                </div>
                                                <label htmlFor={`day-${index}`} className="ml-3 text-base font-medium text-gray-700 cursor-pointer select-none">
                                                    {daySchedule.day}
                                                </label>

                                                {/* "Unavailable" text for unchecked items */}
                                                {!daySchedule.enabled && (
                                                    <span className="ml-auto  text-sm text-red-600 font-medium">Unavailable</span>
                                                )}
                                            </div>

                                            {/* Time Inputs (Only visible if enabled) */}
                                            {daySchedule.enabled && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    {/* Start Time */}
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Time</label>
                                                        <div className="relative">
                                                            <select
                                                                value={daySchedule.startTime}
                                                                onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                                                                className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm bg-white border"
                                                            >
                                                                {timeOptions.map((time) => (
                                                                    <option key={time} value={time}>{time}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* End Time */}
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End Time</label>
                                                        <div className="relative">
                                                            <select
                                                                value={daySchedule.endTime}
                                                                onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                                                                className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm bg-white border"
                                                            >
                                                                {timeOptions.map((time) => (
                                                                    <option key={time} value={time}>{time}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Break Start */}
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Break Start</label>
                                                        <div className="relative">
                                                            <select
                                                                value={daySchedule.breakStart}
                                                                onChange={(e) => handleTimeChange(index, 'breakStart', e.target.value)}
                                                                className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm bg-white border"
                                                            >
                                                                {timeOptions.map((time) => (
                                                                    <option key={time} value={time}>{time}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Break End */}
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Break End</label>
                                                        <div className="relative">
                                                            <select
                                                                value={daySchedule.breakEnd}
                                                                onChange={(e) => handleTimeChange(index, 'breakEnd', e.target.value)}
                                                                className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm bg-white border"
                                                            >
                                                                {timeOptions.map((time) => (
                                                                    <option key={time} value={time}>{time}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className='flex justify-end mt-8'>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-sm"
                                    >
                                        <Save size={18} />
                                        Save Schedule
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'Settings' && (
                            <div className="space-y-8 max-w-3xl animate-in fade-in duration-500">
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Booking Rules and Preferences</h2>

                                {/* Session Duration Dropdown */}
                                <div className="border-b border-gray-100 pb-6">
                                    <label className=" text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                        <Calendar size={18} className="text-blue-500" /> Default Session Duration
                                    </label>
                                    <select
                                        name="sessionDuration"
                                        value={settings.sessionDuration}
                                        onChange={handleSettingChange}
                                        className="block w-full max-w-md rounded-lg border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    >
                                        {['30 minutes', '45 minutes', '1 hour', '1 hour 30 minutes', '2 hours'].map(duration => (
                                            <option key={duration} value={duration}>{duration}</option>
                                        ))}
                                    </select>
                                    <p className="mt-1.5 text-xs text-gray-500">The standard length for most appointments.</p>
                                </div>

                                {/* Buffer Time Dropdown */}
                                <div className="border-b border-gray-100 pb-6">
                                    <label className=" text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                        <Clock size={18} className="text-blue-500" /> Buffer Time Between Appointments
                                    </label>
                                    <select
                                        name="bufferTime"
                                        value={settings.bufferTime}
                                        onChange={handleSettingChange}
                                        className="block w-full max-w-md rounded-lg border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    >
                                        {['No buffer', '15 minutes', '30 minutes', '45 minutes', '1 hour'].map(buffer => (
                                            <option key={buffer} value={buffer}>{buffer}</option>
                                        ))}
                                    </select>
                                    <p className="mt-1.5 text-xs text-gray-500">Time needed for preparation or travel between back-to-back bookings.</p>
                                </div>

                                {/* Advance Booking Dropdown */}
                                <div className="border-b border-gray-100 pb-6">
                                    <label className=" text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                        <Calendar size={18} className="text-blue-500" /> Maximum Advance Booking
                                    </label>
                                    <select
                                        name="advanceBooking"
                                        value={settings.advanceBooking}
                                        onChange={handleSettingChange}
                                        className="block w-full max-w-md rounded-lg border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    >
                                        {['7 days', '14 days', '30 days', '60 days', '90 days'].map(days => (
                                            <option key={days} value={days}>{days}</option>
                                        ))}
                                    </select>
                                    <p className="mt-1.5 text-xs text-gray-500">How far into the future customers can book an appointment.</p>
                                </div>

                                {/* Emergency Availability Toggle */}
                                <div className="flex items-center justify-between pt-2">
                                    <div>
                                        <label htmlFor="emergencyAvailability" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                            <Zap size={18} className="text-red-500" /> Emergency/Last-Minute Bookings
                                        </label>
                                        <p className="text-sm text-gray-500 mt-1">Allow bookings that fall outside defined business hours (requires manual confirmation).</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id="emergencyAvailability"
                                            name="emergencyAvailability"
                                            checked={settings.emergencyAvailability}
                                            onChange={handleSettingChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {/* Save Button */}
                                <div className="pt-8">
                                    <button
                                        onClick={handleSaveSettings}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-500/50 hover:shadow-blue-600/60"
                                    >
                                        <Save size={18} />
                                        Save Settings
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>




                </div>
            </div>
        </ProviderDashboardLayout>

    );
};

export default Availability;