import React, { useState, useEffect } from 'react';

/**
 * CountdownTimer - Shows a live countdown to a deadline.
 * 
 * Props:
 *   deadline: ISO 8601 datetime string (e.g. "2026-02-25T14:00:00+05:45")
 *   label: Optional label text (default: "Response deadline")
 *   onExpired: Optional callback when countdown reaches zero
 *   compact: If true, renders a smaller inline version
 */
export default function CountdownTimer({ deadline, label = "Response deadline", onExpired, compact = false }) {
    const [remaining, setRemaining] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!deadline) return;

        const update = () => {
            const now = new Date();
            const end = new Date(deadline);
            const diff = end - now;

            if (diff <= 0) {
                setRemaining({ hours: 0, minutes: 0, seconds: 0 });
                setIsExpired(true);
                if (onExpired) onExpired();
                return false; // stop interval
            }

            const totalSeconds = Math.floor(diff / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            setRemaining({ hours, minutes, seconds });
            setIsExpired(false);
            return true; // keep going
        };

        // Initial update
        const shouldContinue = update();
        if (!shouldContinue) return;

        const interval = setInterval(() => {
            const shouldContinue = update();
            if (!shouldContinue) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [deadline, onExpired]);

    if (!deadline || remaining === null) return null;

    const pad = (n) => String(n).padStart(2, '0');

    // Determine urgency color
    const totalMinutes = remaining.hours * 60 + remaining.minutes;
    let colorClass;
    if (isExpired) {
        colorClass = "text-red-600 bg-red-50 border-red-200";
    } else if (totalMinutes < 30) {
        colorClass = "text-red-600 bg-red-50 border-red-200"; // urgent
    } else if (totalMinutes < 120) {
        colorClass = "text-orange-600 bg-orange-50 border-orange-200"; // warning
    } else {
        colorClass = "text-green-700 bg-green-50 border-green-200"; // plenty of time
    }

    if (compact) {
        return (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${colorClass}`}>
                {isExpired ? (
                    <span>⏰ Expired</span>
                ) : (
                    <span>⏱ {remaining.hours > 0 && `${remaining.hours}h `}{pad(remaining.minutes)}m {pad(remaining.seconds)}s</span>
                )}
            </span>
        );
    }

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${colorClass}`}>
            <span className="text-base">⏱</span>
            <div>
                <span className="font-medium">{label}: </span>
                {isExpired ? (
                    <span className="font-semibold">Expired — provider did not respond in time</span>
                ) : (
                    <span className="font-semibold tabular-nums">
                        {remaining.hours > 0 && `${remaining.hours}h `}
                        {pad(remaining.minutes)}m {pad(remaining.seconds)}s remaining
                    </span>
                )}
            </div>
        </div>
    );
}
