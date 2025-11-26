import React from 'react';
import StarRating from './StarRating';
import { FaUser } from 'react-icons/fa';

const ReviewList = ({ reviews }) => {


    return (
        <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Customer Reviews</h2>
                <span className="text-sm text-gray-600">Showing {reviews.length} of {reviews.length} reviews</span>
            </div>

            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <div>
                        <p>No reviews found for this filter</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-6 border-gray-200 pb-6 last:border-b-0 last:pb-0">
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                                <div className='flex'>

                                    <div className='w-8 h-8 bg-blue-500 flex items-center justify-center rounded-full'>
                                        <FaUser className='' />
                                    </div>
                                    <div className='ml-2'>
                                        <h3 className="font-semibold text-gray-900">{review.name}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <StarRating rating={review.rating} />
                                            <span className="text-sm text-gray-500">{review.date}</span>
                                        </div>
                                    </div>

                                </div>
                                <span className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 mt-3 sm:mt-0 rounded-full">
                                    {review.service}
                                </span>
                            </div>

                            <p className="text-gray-700 mt-3 mb-4">{review.content}</p>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900">
                                        <span>✔️</span>
                                        <span>{review.helpful} people found this helpful</span>
                                    </button>
                                </div>


                            </div>
                        </div>
                    ))
                )}

            </div>
        </div>
    );
};

export default ReviewList;