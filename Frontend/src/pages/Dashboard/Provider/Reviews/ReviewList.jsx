import React, { useState } from 'react';
import StarRating from './StarRating';
import { FaUser } from 'react-icons/fa';
import bookingsService from '../../../../services/bookingsService';

const ReviewList = ({ reviews, loading = false }) => {
    const [responding, setResponding] = useState({}); // { [id]: boolean }
    const [responses, setResponses] = useState({});   // { [id]: string }
    const [errors, setErrors] = useState({});         // { [id]: string }

    const handleChange = (id, value) => {
        setResponses(prev => ({ ...prev, [id]: value }));
    };

    const handleRespond = async (id) => {
        setErrors(prev => ({ ...prev, [id]: null }));
        setResponding(prev => ({ ...prev, [id]: true }));
        try {
            const text = (responses[id] || '').trim();
            if (!text) {
                setErrors(prev => ({ ...prev, [id]: 'Response cannot be empty.' }));
                return;
            }
            await bookingsService.respondToReview(id, text);
            // Optimistically update local review provider_response
            const idx = reviews.findIndex(r => r.id === id);
            if (idx !== -1) {
                reviews[idx].provider_response = text;
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, [id]: err.error || err.message || 'Failed to respond' }));
        } finally {
            setResponding(prev => ({ ...prev, [id]: false }));
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Customer Reviews</h2>
                <span className="text-sm text-gray-600">Showing {reviews.length} of {reviews.length} reviews</span>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="text-center text-gray-600 py-6">Loading...</div>
                ) : reviews.length === 0 ? (
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
                                        <h3 className="font-semibold text-gray-900">{review.customer_name || review.customer?.full_name || 'Customer'}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <StarRating rating={review.rating} />
                                            <span className="text-sm text-gray-500">{review.created_at ? new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</span>
                                        </div>
                                    </div>

                                </div>
                                <span className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 mt-3 sm:mt-0 rounded-full">
                                    {review.service_title || review.booking?.service_title || 'Service'}
                                </span>
                            </div>

                            <p className="text-gray-700 mt-3 mb-1 font-semibold">{review.title || 'No title'}</p>
                            {review.comment && (
                                <p className="text-gray-700 mb-4">{review.comment}</p>
                            )}

                            {/* Provider response UI */}
                            {review.provider_response ? (
                                <div className="mt-4 bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
                                    <p className="font-semibold mb-1">Your Response</p>
                                    <p>{review.provider_response}</p>
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Respond to this review</label>
                                    <textarea
                                        value={responses[review.id] || ''}
                                        onChange={(e) => handleChange(review.id, e.target.value)}
                                        rows={3}
                                        placeholder="Thank you for your feedback..."
                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-600"
                                    />
                                    {errors[review.id] && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                            {errors[review.id]}
                                        </div>
                                    )}
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleRespond(review.id)}
                                            disabled={!!responding[review.id]}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:bg-gray-300"
                                        >
                                            {responding[review.id] ? 'Submitting...' : 'Submit Response'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}

            </div>
        </div>
    );
};

export default ReviewList;