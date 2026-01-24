import React, { useEffect, useState } from 'react';
import { Save,Calendar, Clock, Settings, Zap } from 'lucide-react';
import ProviderDashboardLayout from '../../../../layouts/ProviderDashboardLayout';
import availabilityService from '../../../../services/availabilityService';
import { useToast } from '../../../../components/Toast';

// Helper to generate time options (every 30 mins)
const generateTimeOptions = () => {
    const times = [];

    // Start at 6:00 AM and end at 10:00 PM, every 30 minutes
    for (let h = 6; h <= 22; h++) {
        for (let m of [0, 30]) {
            const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
            const ampm = h < 12 ? 'AM' : 'PM';
            times.push(`${hour12}:${m === 0 ? '00' : '30'} ${ampm}`);
        }
    }

    return times;
};
const timeOptions = generateTimeOptions();

const Availability = () => {
    const [activeTab, setActiveTab] = useState('Weekly Schedule');
    const [activeMenu, setActiveMenu] = useState("availability");
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState('');
    // Initial State; will hydrate from backend when available
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

    const parseTimeToMinutes = (timeStr) => {
        // expects like "8:30 AM"
        const [time, period] = timeStr.split(' ');
        const [h, m] = time.split(':').map(Number);
        let hours24 = period === 'PM' ? (h % 12) + 12 : h % 12;
        return hours24 * 60 + (m || 0);
    };

    const validateSchedule = () => {
        for (const day of schedule) {
            if (!day.enabled) continue;
            const start = parseTimeToMinutes(day.startTime);
            const end = parseTimeToMinutes(day.endTime);
            const bStart = parseTimeToMinutes(day.breakStart);
            const bEnd = parseTimeToMinutes(day.breakEnd);

            if (start >= end) return `On ${day.day}, start time must be before end time.`;
            if (bStart < start || bEnd > end || bStart >= bEnd) return `On ${day.day}, break must be inside working hours and start before end.`;
        }
        return '';
    };

    const handleSave = async () => {
        const validationMsg = validateSchedule();
        if (validationMsg) {
            setValidationError(validationMsg);
            addToast(validationMsg, 'error');
            return;
        }
        setValidationError('');
        try {
            setSaving(true);
            const payload = {
                weekly_schedule: schedule.map(d => ({
                    day: d.day,
                    enabled: d.enabled,
                    start_time: d.startTime,
                    end_time: d.endTime,
                    break_start: d.breakStart,
                    break_end: d.breakEnd,
                })),
                settings,
            };
            await availabilityService.saveAvailability(payload);
            addToast('Availability saved successfully!', 'success');
        } catch (err) {
            console.error('Save error:', err);
            const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to save availability';
            setValidationError(errorMsg);
            addToast(errorMsg, 'error');
        } finally {
            setSaving(false);
        }
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
        handleSave(); // use same payload/save call
    };

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await availabilityService.getAvailability();
                if (data?.weekly_schedule) {
                    setSchedule(data.weekly_schedule.map(d => ({
                        day: d.day,
                        enabled: !!d.enabled,
                        startTime: d.start_time || '8:00 AM',
                        endTime: d.end_time || '5:00 PM',
                        breakStart: d.break_start || '12:00 PM',
                        breakEnd: d.break_end || '1:00 PM',
                    })));
                }
                if (data?.settings) {
                    setSettings(prev => ({ ...prev, ...data.settings }));
                }
            } catch (err) {
                addToast(err.error || err.message || 'Failed to load availability', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [addToast]);

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

                        {loading && (
                            <div className="space-y-6 animate-pulse">
                                {/* Loading skeleton for Weekly Schedule */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                                    <div className="h-6 bg-gray-200 rounded w-48"></div>
                                </div>
                                
                                {/* Loading skeleton for schedule items */}
                                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                    <div key={i} className="border rounded-lg border-gray-200 bg-white p-6">
                                        <div className="flex items-center mb-4">
                                            <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                            <div className="ml-3 h-4 bg-gray-200 rounded w-24"></div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                                                <div className="h-10 bg-gray-100 rounded"></div>
                                            </div>
                                            <div>
                                                <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                                                <div className="h-10 bg-gray-100 rounded"></div>
                                            </div>
                                            <div>
                                                <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                                                <div className="h-10 bg-gray-100 rounded"></div>
                                            </div>
                                            <div>
                                                <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                                                <div className="h-10 bg-gray-100 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Loading skeleton for save button */}
                                <div className="flex justify-end mt-8">
                                    <div className="h-10 bg-gray-200 rounded w-40"></div>
                                </div>
                            </div>
                        )}
                        
                        {!loading && validationError && (
                            <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">{validationError}</div>
                        )}

                        {/* Card Header */}
                        {!loading && activeTab === "Weekly Schedule" && (
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

                        {!loading && activeTab === 'Settings' && (
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