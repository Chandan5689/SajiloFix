import React, { useEffect, useState } from "react";
import bookingsService from "../services/bookingsService";

/**
 * Display rating summary for a provider
 * Props:
 *  - providerId: optional; when present we fetch real reviews for that provider (current provider in dashboard)
 *  - fallbackRating / fallbackCount: optional numbers to avoid fetching (e.g., public listing data)
 *  - compact: shrinks typography
 */
export default function RatingBadge({ providerId, fallbackRating = null, fallbackCount = null, compact = false }) {
  const [stats, setStats] = useState(() => (
    fallbackRating !== null && fallbackCount !== null
      ? { avgRating: fallbackRating, reviewCount: fallbackCount }
      : null
  ));
  const [loading, setLoading] = useState(!(fallbackRating !== null && fallbackCount !== null));

  useEffect(() => {
    if (!providerId || (fallbackRating !== null && fallbackCount !== null)) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const resp = await bookingsService.getProviderReviews({ page_size: 50 });
        const reviews = Array.isArray(resp?.results) ? resp.results : (Array.isArray(resp) ? resp : []);
        const scoped = reviews.filter(r => parseInt(r.provider_id || r.provider, 10) === parseInt(providerId, 10) || !r.provider_id);
        const source = scoped.length > 0 ? scoped : reviews; // fallback to all if provider_id not sent
        if (Array.isArray(source) && source.length > 0) {
          const totalRating = source.reduce((sum, r) => sum + (parseInt(r.rating, 10) || 0), 0);
          const avgRating = (totalRating / source.length).toFixed(1);
          setStats({ avgRating: parseFloat(avgRating), reviewCount: source.length });
        } else {
          setStats({ avgRating: 0, reviewCount: 0 });
        }
      } catch (err) {
        console.error('Error fetching rating stats:', err);
        setStats({ avgRating: fallbackRating || 0, reviewCount: fallbackCount || 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [providerId, fallbackRating, fallbackCount]);

  if (loading) {
    return <div className="text-gray-400 text-sm">Loading...</div>;
  }

  if (!stats || stats.reviewCount === 0) {
    return <div className="text-gray-400 text-sm">No reviews yet</div>;
  }

  const StarDisplay = ({ rating }) => {
    const stars = [1, 2, 3, 4, 5];
    return (
      <div className="flex items-center gap-0.5">
        {stars.map((n) => (
          <span key={n} className={n <= Math.round(rating) ? "text-yellow-500" : "text-gray-300"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
      <StarDisplay rating={stats.avgRating} />
      <span className="font-semibold">{stats.avgRating}</span>
      <span className="text-gray-600">({stats.reviewCount})</span>
    </div>
  );
}
