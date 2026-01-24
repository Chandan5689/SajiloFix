import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { FaEnvelope, FaPhoneAlt } from 'react-icons/fa'
import { FaLocationDot } from 'react-icons/fa6'
import { contactFormSchema } from '../../validations/userSchemas'

function Contact() {
    const [serverError, setServerError] = useState(null)
    const [serverSuccess, setServerSuccess] = useState(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: yupResolver(contactFormSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            subject: '',
            message: ''
        },
        mode: 'onBlur'
    })

    const onSubmit = async (data) => {
        setServerError(null)
        setServerSuccess(null)
        try {
            // TODO: replace with real API call, e.g., publicService.sendContactMessage(data)
            await new Promise((resolve) => setTimeout(resolve, 600))
            setServerSuccess('Message sent successfully! We will get back to you soon.')
            reset()
        } catch (err) {
            setServerError(err?.error || err?.message || 'Failed to send message')
        }
    }

    return (
        <section className='bg-gray-50 '>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 font-['Poppins,sans-serif']" >
                        Contact Us
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Have questions or need help? We're here to assist you.
                    </p>
                </div>
                <div className="grid lg:grid-cols-2 gap-12">
                    <div className="bg-white rounded-2xl p-8 shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
                            {serverError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{serverError}</div>
                            )}
                            {serverSuccess && (
                                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{serverSuccess}</div>
                            )}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        placeholder="John"
                                        {...register('firstName')}
                                        className={`w-full px-4 py-3 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm outline-none`}
                                        disabled={isSubmitting}
                                    />
                                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        placeholder="Doe"
                                        {...register('lastName')}
                                        className={`w-full px-4 py-3 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm outline-none`}
                                        disabled={isSubmitting}
                                    />
                                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    {...register('email')}
                                    className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm outline-none`}
                                    disabled={isSubmitting}
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                <input
                                    type="text"
                                    placeholder="How can we help you?"
                                    {...register('subject')}
                                    className={`w-full px-4 py-3 border ${errors.subject ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm outline-none`}
                                    disabled={isSubmitting}
                                />
                                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                <textarea
                                    rows={6}
                                    placeholder="Tell us more..."
                                    {...register('message')}
                                    className={`w-full px-4 py-3 border ${errors.message ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none outline-none`}
                                    disabled={isSubmitting}
                                ></textarea>
                                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-green-600 text-white py-3 font-semibold hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                    <div>
                        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                            <div className="space-y-6">
                                <div className="flex items-center">
                                    <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                                        <FaPhoneAlt className="text-blue-600 text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Phone</h3>
                                        <p className="text-gray-600">+1 (555) 123-4567</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                                        <FaEnvelope className="text-green-600 text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                                        <p className="text-gray-600">support@sajilofix.com</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                                        <FaLocationDot className="text-purple-600 text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                                        <p className="text-gray-600">Simalchour-8,Pokhara,Nepal</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
     

    </section >
  )
}

export default Contact