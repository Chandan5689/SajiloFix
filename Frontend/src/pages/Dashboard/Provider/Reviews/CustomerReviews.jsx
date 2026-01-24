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
    const [reviews, setReviews] = useState([]); // full set for stats/counts (all filter)
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const pageSize = 20;

    // Helper to merge lists without duplicates
    const mergeReviews = (prev, next) => {
        const map = new Map();
        [...prev, ...next].forEach(r => {
            if (r?.id != null) map.set(r.id, r);
        });
        return Array.from(map.values());
    };

    const fetchReviews = async ({ targetPage = 1, append = false, filter = 'all' } = {}) => {
        const params = { page: targetPage, page_size: pageSize };
        if (filter !== 'all') params.rating = filter;

        if (append) setLoadingMore(true);
        else if (filter === 'all') setLoading(true);
        else setFilterLoading(true);

        try {
            setError(null);
            const data = await bookingsService.getProviderReviews(params);
            const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
            const nextHasMore = Boolean(data?.next);

            if (filter === 'all') {
                setReviews(prev => append ? mergeReviews(prev, list) : list);
                setFilteredReviews(prev => append ? mergeReviews(prev, list) : list);
            } else {
                setFilteredReviews(prev => append ? mergeReviews(prev, list) : list);
            }

            if (filter === 'all') setTotalCount(typeof data?.count === 'number' ? data.count : null);
            setHasMore(nextHasMore);
            setPage(targetPage);
        } catch (err) {
            console.error('Error fetching provider reviews:', err);
            setError(err.error || 'Failed to load reviews');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setFilterLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchReviews({ targetPage: 1, append: false, filter: 'all' });
    }, []);

    // Fetch when filter changes
    useEffect(() => {
        if (activeFilter === 'all') {
            setFilteredReviews(reviews);
            setHasMore(reviews.length < (totalCount || reviews.length));
            setPage(Math.ceil(reviews.length / pageSize) || 1);
            return;
        }
        fetchReviews({ targetPage: 1, append: false, filter: activeFilter });
    }, [activeFilter]);

    const handleLoadMore = () => {
        if (!hasMore || loadingMore) return;
        fetchReviews({ targetPage: page + 1, append: true, filter: activeFilter });
    };

    const filterCounts = useMemo(() => ({
        all: totalCount ?? reviews.length,
        5: reviews.filter(r => parseInt(r.rating, 10) === 5).length,
        4: reviews.filter(r => parseInt(r.rating, 10) === 4).length,
        3: reviews.filter(r => parseInt(r.rating, 10) === 3).length,
        2: reviews.filter(r => parseInt(r.rating, 10) === 2).length,
        1: reviews.filter(r => parseInt(r.rating, 10) === 1).length
    }), [reviews, totalCount]);

    const handleResponseSaved = (reviewId, responseText) => {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, provider_response: responseText } : r));
        setFilteredReviews(prev => prev.map(r => r.id === reviewId ? { ...r, provider_response: responseText } : r));
    };


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
                            <>
                                <ReviewList
                                    reviews={filteredReviews}
                                    loading={filterLoading}
                                    totalCount={activeFilter === 'all' ? totalCount : null}
                                    onResponseSaved={handleResponseSaved}
                                />
                                {hasMore && (
                                    <div className="mt-6 text-center">
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={loadingMore}
                                            className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-semibold hover:bg-gray-900 disabled:opacity-50"
                                        >
                                            {loadingMore ? 'Loading...' : 'Load More'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </ProviderDashboardLayout>

    );
};

export default CustomerReviews;