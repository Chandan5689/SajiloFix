import { useParams, useNavigate } from "react-router-dom";
import { serviceProviders } from "./Service";
import { useState } from "react";

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const provider = serviceProviders.find((p) => p.id === Number(id));

  const [serviceType, setServiceType] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  if (!provider) {
    return (
      <div className="flex items-center justify-center bg-gray-50 p-10">
        <div className="text-center text-gray-700">
          <h2 className="text-2xl font-semibold mb-4">Provider Not Found</h2>
          <button
            onClick={() => navigate("/")}
            className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Booking submitted! (Form data handling can be added)");
  };

  // Format booking datetime for summary or show 'Not selected'
  const dateTimeSummary =
    preferredDate && preferredTime
      ? `${preferredDate} at ${preferredTime}`
      : "Not selected";

  return (
    <div className=" bg-gray-50 p-6 flex justify-center">
      <div className="bg-white rounded-md shadow-md max-w-3xl w-full p-6 ">
        {/* Header with provider info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <img
              src={provider.img}
              alt={provider.name}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <h2 className="text-xl font-semibold">Book {provider.name}</h2>
              <p className="text-blue-600">
                {provider.profession} &bull; ${provider.price}/hour
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-800 text-2xl font-bold leading-none"
            aria-label="Close booking form"
          >
            &times;
          </button>
        </div>

        {/* Booking form */}
        <form onSubmit={handleSubmit} className="space-y-6 text-gray-800">
          {/* Service Type */}
          <div>
            <label htmlFor="serviceType" className="block font-medium mb-1">
              Service Type *
            </label>
            <select
              id="serviceType"
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            >
              <option value="" disabled>
                Select a service
              </option>
              {provider.specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="preferredDate" className="block font-medium mb-1">
                Preferred Date *
              </label>
              <input
                id="preferredDate"
                type="date"
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="preferredTime" className="block font-medium mb-1">
                Preferred Time *
              </label>
              <select
                id="preferredTime"
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
              >
                <option value="" disabled>
                  Select time
                </option>
                <option value="08:00 AM">08:00 AM</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:00 PM">03:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
                <option value="05:00 PM">05:00 PM</option>
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <fieldset className=" pt-4">
            <legend className="font-semibold mb-4 text-gray-900 border-b border-gray-200">
              Contact Information
            </legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block font-medium mb-1">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block font-medium mb-1">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="block font-medium mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="address" className="block font-medium mb-1">
                  Service Address *
                </label>
                <input
                  id="address"
                  type="text"
                  required
                  placeholder="Where should the service be performed"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          {/* Service Description */}
          <div>
            <label htmlFor="description" className="block font-medium mb-1">
              Service Description
            </label>
            <textarea
              id="description"
              rows={4}
              maxLength={500}
              placeholder="Please describe what you need help with..."
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-xs text-gray-500 text-right mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {/* Booking Summary */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4 space-y-2 text-sm text-gray-700">
            <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
            <div className="flex justify-between">
              <span>Service:</span>
              <span>{serviceType || "Not selected"}</span>
            </div>
            <div className="flex justify-between">
              <span>Date &amp; Time:</span>
              <span>{dateTimeSummary}</span>
            </div>
            <div className="flex justify-between">
              <span>Rate:</span>
              <span className="text-blue-600 font-semibold">${provider.price}/hour</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-red-600 text-white rounded-md px-6 py-3 font-semibold hover:bg-red-700 transition duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white rounded-md px-6 py-3 font-semibold hover:bg-green-700 transition duration-200 cursor-pointer"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
