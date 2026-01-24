import React from 'react';
import { MdWarning, MdError, MdCheckCircle, MdAccessTime, MdCalendarToday } from 'react-icons/md';

export default function BookingConflictWarning({ conflictData, onSelectAlternativeTime, onSelectAlternativeDate, isPastSlot = false }) {
  if (!conflictData) return null;

  const { valid, conflicts, warnings, suggestions } = conflictData;

  // If no issues, show success
  if (!isPastSlot && valid && (!warnings || warnings.length === 0)) {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-700">
          <MdCheckCircle className="text-xl" />
          <span className="font-medium">This time slot is available!</span>
        </div>
      </div>
    );
  }

  const combinedConflicts = [...(conflicts || [])];
  if (isPastSlot) {
    combinedConflicts.unshift({
      type: 'past_time',
      severity: 'critical',
      message: 'Selected time is in the past (Nepal time). Please pick a future slot.',
    });
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Critical Conflicts */}
      {combinedConflicts && combinedConflicts.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <MdError className="text-red-600 text-xl mt-1 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-2">Booking Conflict</h3>
              {combinedConflicts.map((conflict, idx) => (
                <div key={idx} className="mb-3 last:mb-0">
                  <p className="text-red-700 text-sm mb-2">{conflict.message}</p>
                  {conflict.conflicting_bookings && conflict.conflicting_bookings.length > 0 && (
                    <div className="bg-red-100 rounded p-2 text-sm text-red-800">
                      <p className="font-medium mb-1">Conflicting bookings:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {conflict.conflicting_bookings.map((booking, i) => (
                          <li key={i}>
                            {booking.customer} - {booking.service}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <MdWarning className="text-yellow-600 text-xl mt-1 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-2">Warning</h3>
              {warnings.map((warning, idx) => (
                <div key={idx} className="mb-3 last:mb-0">
                  <p className="text-yellow-700 text-sm mb-2">{warning.message}</p>
                  {warning.bookings && warning.bookings.length > 0 && (
                    <div className="bg-yellow-100 rounded p-2 text-sm text-yellow-800">
                      <p className="font-medium mb-1">Existing bookings:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {warning.bookings.map((booking, i) => (
                          <li key={i}>
                            {booking.service} - {booking.status} ({booking.date})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alternative Time Slots */}
      {suggestions?.alternative_times && suggestions.alternative_times.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <MdAccessTime className="text-blue-600 text-xl mt-1 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800 mb-3">Available Time Slots (Same Day)</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {suggestions.alternative_times.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectAlternativeTime && onSelectAlternativeTime(slot.time)}
                    className={`px-3 py-2 rounded text-sm font-medium transition ${
                      slot.available
                        ? 'bg-blue-200 text-blue-800 hover:bg-blue-300 cursor-pointer'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!slot.available}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alternative Dates */}
      {suggestions?.alternative_dates && suggestions.alternative_dates.length > 0 && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-start gap-3">
            <MdCalendarToday className="text-indigo-600 text-xl mt-1 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-800 mb-3">Alternative Dates</h3>
              <div className="space-y-2">
                {suggestions.alternative_dates.map((alt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectAlternativeDate && onSelectAlternativeDate(alt.date)}
                    className="w-full text-left p-3 rounded bg-indigo-100 hover:bg-indigo-200 transition text-indigo-900 text-sm"
                  >
                    <div className="font-medium">{alt.day_name}, {alt.date}</div>
                    <div className="text-indigo-700 text-xs">
                      {alt.available_slots_count} available time slot(s)
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
