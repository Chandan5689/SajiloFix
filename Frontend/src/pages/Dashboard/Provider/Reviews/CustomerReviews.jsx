import React, { useState } from 'react';
import RatingOverview from './RatingOverview';
import ThisMonthStats from './ThisMonthStats';
import FilterReviews from './FilterReviews';
import ReviewList from './ReviewList';
import ProviderDashboardLayout from '../../../../layouts/ProviderDashboardLayout';

const CustomerReviews = () => {
    const [activeMenu, setActiveMenu] = useState("reviews");
    const [activeFilter, setActiveFilter] = useState("all");
    const reviews = [
        {
            id: 1,
            name: 'Sarah Johnson',
            rating: 5,
            date: '2024-01-15',
            content: 'Excellent work! John arrived on time and fixed our plumbing issue quickly. Very professional and cleaned up after himself. Would definitely recommend!',
            helpful: 12,
            service: 'Plumbing Repair'
        },
        {
            id: 2,
            name: 'Michael Chen',
            rating: 5,
            date: '2024-01-12',
            content: 'Outstanding electrical work! Fixed our faulty wiring and installed new light fixtures. Very knowledgeable and ensured everything was up to code. Will hire again for future projects.',
            helpful: 8,
            service: 'Electrical Services'
        },
        {
            id: 3,
            name: 'Emily Rodriguez',
            rating: 4,
            date: '2024-01-10',
            content: 'Great HVAC service! Technician was prompt and professional. Our heating system is working perfectly now. Only minor deduction because the appointment started 15 minutes late.',
            helpful: 5,
            service: 'HVAC Maintenance'
        },
        {
            id: 4,
            name: 'David Thompson',
            rating: 5,
            date: '2024-01-08',
            content: 'Absolutely fantastic roofing repair! Fixed our leak quickly and the quality of work is exceptional. The team was respectful of our property and cleaned up thoroughly.',
            helpful: 15,
            service: 'Roof Repair'
        },
        // Add more reviews here as needed
    ];


    const filteredReviews = activeFilter === 'all' ? reviews : reviews.filter(review => review.rating === parseInt(activeFilter));

    const filterCounts = {
        all: reviews.length,
        5: reviews.filter(review => review.rating === 5).length,
        4: reviews.filter(review => review.rating === 4).length,
        3: reviews.filter(review => review.rating === 3).length,
        2: reviews.filter(review => review.rating === 2).length,
        1: reviews.filter(review => review.rating === 1).length
    };


    return (
        <ProviderDashboardLayout activeMenuKey={activeMenu} onMenuChange={setActiveMenu}>

            {/* Header */}
            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
                <p className="text-gray-600 mt-1">Manage and respond to customer feedback</p>
            </div>

            <div className="grid grid-cols-1 ">
                <div className="">
                    {/* Left Column */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 space-y-6 py-8">
                        <RatingOverview />
                        <ThisMonthStats />
                        <FilterReviews activeFilter={activeFilter} onFilterChange={setActiveFilter} filterCounts={filterCounts}/>
                    </div>

                    {/* Right Column */}
                    <div className="">
                        <ReviewList reviews={filteredReviews} />
                    </div>
                </div>
            </div>
        </ProviderDashboardLayout>

    );
};

export default CustomerReviews;