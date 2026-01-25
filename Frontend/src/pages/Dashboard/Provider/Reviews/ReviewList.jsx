import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import StarRating from './StarRating';
import { FaUser } from 'react-icons/fa';
import ActionButton from '../../../../components/ActionButton';
import bookingsService from '../../../../services/bookingsService';
import { providerResponseSchema } from '../../../../validations/userSchemas';

const ReviewResponseForm = ({ reviewId, onResponseSaved }) => {
    const [serverError, setServerError] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(providerResponseSchema),
        defaultValues: { response: '' },
        mode: 'onBlur',
    });

    const onSubmit = async (data) => {
        setServerError(null);
        try {
            await bookingsService.respondToReview(reviewId, data.response.trim());
            if (onResponseSaved) {
                onResponseSaved(reviewId, data.response.trim());
            }
            reset();
        } catch (err) {
            setServerError(err?.error || err?.message || 'Failed to submit response');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Respond to this review</label>
            <textarea
                {...register('response')}
                rows={3}
                placeholder="Thank you for your feedback..."
                className={`w-full p-2 border ${errors.response ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:border-green-600`}
                disabled={isSubmitting}
            />
            {errors.response && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {errors.response.message}
                </div>
            )}
            {serverError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {serverError}
                </div>
            )}
            <div className="flex justify-end">
                <ActionButton
                    type="submit"
                    label="Submit Response"
                    loadingLabel="Submitting..."
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    variant="primary"
                    size="sm"
                />
            </div>
        </form>
    );
};

const ReviewList = ({ reviews, loading = false, totalCount = null, onResponseSaved }) => {

    return (
        <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Customer Reviews</h2>
                <span className="text-sm text-gray-600">
                    Showing {reviews.length}{totalCount != null ? ` of ${totalCount}` : ''} reviews
                </span>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="text-center text-gray-600 py-6">Loading...</div>
                ) : reviews.length === 0 ? (
                    <div>
                        <p>No reviews found for this filter</p>
                    </div>
                ) : (
                    reviews.map((review) => {
                        const customerName = review.customer_name || review.customer?.full_name || review.customer?.name || 'Customer';
                        return (
                        <div key={review.id} className="border rounded-lg p-6 border-gray-200 pb-6 last:border-b-0 last:pb-0">
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                                <div className='flex'>

                                    <div className='w-8 h-8 bg-blue-500 flex items-center justify-center rounded-full'>
                                        <FaUser className='' />
                                    </div>
                                    <div className='ml-2'>
                                        <h3 className="font-semibold text-gray-900">{customerName}</h3>
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
                                <ReviewResponseForm
                                    reviewId={review.id}
                                    onResponseSaved={onResponseSaved}
                                />
                            )}
                        </div>
                        );
                    })
                )}

            </div>
        </div>
    );
};

export default ReviewList;