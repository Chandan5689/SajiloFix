import React, { useEffect, useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import bookingsService from "../../../services/bookingsService";
import { useUserProfile } from "../../../context/UserProfileContext";

function StarRatingDisplay({ value = 0 }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1">
      {stars.map((n) => (
        <span key={n} className={n <= value ? "text-yellow-500" : "text-gray-300"}>★</span>
      ))}
    </div>
  );
}

export default function MyReviews() {
  const [activeMenuKey, setActiveMenuKey] = useState("my-reviews");
  const { userProfile: userData } = useUserProfile();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState("newest"); // newest | oldest | rating_desc | rating_asc
  const [viewMode, setViewMode] = useState("compact"); // compact | comfortable

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await bookingsService.getMyCustomerReviews({ page_size: 50 });
        const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        setReviews(list);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError(
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load your reviews"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const getSortedReviews = () => {
    const copy = [...reviews];
    return copy.sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      const aRating = typeof a.rating === "number" ? a.rating : parseFloat(a.rating || 0);
      const bRating = typeof b.rating === "number" ? b.rating : parseFloat(b.rating || 0);
      switch (sortOption) {
        case "newest":
          return bDate - aDate;
        case "oldest":
          return aDate - bDate;
        case "rating_desc":
          return bRating - aRating;
        case "rating_asc":
          return aRating - bRating;
        default:
          return 0;
      }
    });
  };

  const isCompact = viewMode === "compact";
  const cardPaddingClass = isCompact ? "p-3" : "p-6";
  const titleClass = isCompact ? "font-semibold text-base truncate" : "font-semibold text-lg";
  const subtitleClass = isCompact ? "text-gray-700 text-xs" : "text-gray-700 text-sm";
  const bodyTextClass = isCompact ? "text-gray-700 text-xs" : "text-gray-700 text-sm";
  const metaTextClass = isCompact ? "text-xs" : "text-sm";

  return (
    <DashboardLayout activeMenuKey={activeMenuKey} onMenuChange={setActiveMenuKey} userData={userData}>
      <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold">My Reviews</h2>
          <p className="text-gray-600 text-sm">See feedback you've submitted</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-gray-700 text-sm">Sort</label>
            <select
              id="sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-600"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="rating_desc">Rating: high → low</option>
              <option value="rating_asc">Rating: low → high</option>
            </select>
          </div>
          <div className="flex items-center gap-1" role="group" aria-label="View mode">
            <button
              type="button"
              onClick={() => setViewMode("compact")}
              className={`px-3 py-2 rounded-l border ${isCompact ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-300"}`}
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setViewMode("comfortable")}
              className={`px-3 py-2 rounded-r border ${!isCompact ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-300"}`}
            >
              Comfortable
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          {reviews.length > 0 ? (
            getSortedReviews().map((rev) => (
              <div key={rev.id} className={`bg-white ${cardPaddingClass} rounded-lg shadow border border-gray-100`}>
                <div className={`flex ${isCompact ? "items-center" : "items-start"} justify-between mb-2`}>
                  <div className={`${isCompact ? "min-w-0" : ""}`}>
                    <p className={titleClass}>{rev.title || "No title"}</p>
                    <p className={subtitleClass}>{rev.provider_name || rev.provider?.full_name || "Provider"}</p>
                  </div>
                  <StarRatingDisplay value={rev.rating} />
                </div>
                <p className={`${subtitleClass} ${isCompact ? "truncate" : ""} ${isCompact ? "mb-2" : "mb-3"}`}>
                  {rev.service_title || rev.booking?.service_title || "Service"}
                </p>
                {rev.comment && (
                  <p className={`${bodyTextClass} ${isCompact ? "truncate" : ""} ${isCompact ? "mb-2" : "mb-4"}`}>{rev.comment}</p>
                )}
                {rev.provider_response && (
                  <div className={`mt-3 ${isCompact ? "p-2" : "p-3"} bg-green-50 border border-green-200 rounded`}
                  >
                    <p className="text-sm font-semibold text-green-800 mb-1">Provider Response</p>
                    <p className={`${bodyTextClass} text-green-900`}>{rev.provider_response}</p>
                  </div>
                )}
                <div className={`flex items-center justify-between ${metaTextClass} text-gray-500`}>
                  <span>{rev.would_recommend ? "Recommended" : "Not recommended"}</span>
                  <span>
                    {rev.created_at
                      ? new Date(rev.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : ""}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center p-10 bg-white rounded-lg shadow-md text-gray-500">
              <p>You haven't submitted any reviews yet.</p>
              <p className="mt-2">You can leave a review from your completed bookings.</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
