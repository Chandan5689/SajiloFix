import React, { useEffect, useMemo, useState } from 'react';
import RatingOverview from './RatingOverview';
import ThisMonthStats from './ThisMonthStats';
import FilterReviews from './FilterReviews';
import ReviewList from './ReviewList';
import ProviderDashboardLayout from '../../../../layouts/ProviderDashboardLayout';
import bookingsService from '../../../../services/bookingsService';

const CustomerReviews = () => {
    const [activeMenu, setActiveMenu] = useState("reviews");
    const [activeFilter, setActiveFilter] = useState("all");
    const [reviews, setReviews] = useState([]); // full set for stats/counts
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await bookingsService.getProviderReviews();
                const list = Array.isArray(data) ? data : [];
                setReviews(list);
                setFilteredReviews(list);
            } catch (err) {
                console.error('Error fetching provider reviews:', err);
                setError(err.error || 'Failed to load reviews');
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    // Fetch filtered reviews from backend when filter changes
    useEffect(() => {
        const fetchFiltered = async () => {
            if (activeFilter === 'all') {
                setFilteredReviews(reviews);
                return;
            }
            try {
                setFilterLoading(true);
                const params = { rating: activeFilter };
                const data = await bookingsService.getProviderReviews(params);
                setFilteredReviews(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error filtering reviews:', err);
                setError(err.error || 'Failed to filter reviews');
            } finally {
                setFilterLoading(false);
            }
        };
        fetchFiltered();
    }, [activeFilter, reviews]);

    const filterCounts = useMemo(() => ({
        all: reviews.length,
        5: reviews.filter(r => parseInt(r.rating, 10) === 5).length,
        4: reviews.filter(r => parseInt(r.rating, 10) === 4).length,
        3: reviews.filter(r => parseInt(r.rating, 10) === 3).length,
        2: reviews.filter(r => parseInt(r.rating, 10) === 2).length,
        1: reviews.filter(r => parseInt(r.rating, 10) === 1).length
    }), [reviews]);


    return (
        <ProviderDashboardLayout activeMenuKey={activeMenu} onMenuChange={setActiveMenu}>

            {/* Header */}
            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
                <p className="text-gray-600 mt-1">Manage and respond to customer feedback</p>
            </div>

            {loading && (
                <div className="px-6">
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading reviews...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="px-6">
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 ">
                <div className="">
                    {/* Left Column */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 space-y-6 py-8">
                        <RatingOverview reviews={reviews} />
                        <ThisMonthStats reviews={reviews} />
                        <FilterReviews activeFilter={activeFilter} onFilterChange={setActiveFilter} filterCounts={filterCounts}/>
                    </div>

                    {/* Right Column */}
                    <div className="">
                        {!loading && !error && (
                            <ReviewList reviews={filteredReviews} loading={filterLoading} />
                        )}
                    </div>
                </div>
            </div>
        </ProviderDashboardLayout>

    );
};

export default CustomerReviews;