import { useState } from "react";
import { FaLocationDot } from "react-icons/fa6";
import {FaSearch,} from 'react-icons/fa'
import ServiceProviderCard from "../../layouts/ServiceProviderCard";
const categories = [
  "All Services",
  "Plumbing",
  "Cleaning",
  "Electrical",
  "Painting",
  "Carpentry",
  "AC Repair",
];

export const serviceProviders = [
  {
    id: 1,
    name: "John Smith",
    profession: "Plumbing",
    rating: 4.9,
    reviews: 127,
    price: 45,
    experience: 8,
    availability: "Available Today",
    specialties: ["Pipe Repair", "Installation", "Emergency Service"],
    img: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 2,
    name: "Mike Rodriguez",
    profession: "Electrical",
    rating: 4.9,
    reviews: 156,
    price: 55,
    experience: 12,
    availability: "Available Today",
    specialties: ["Wiring", "Panel Upgrades", "Troubleshooting"],
    img: "https://randomuser.me/api/portraits/men/65.jpg",
  },
  {
    id: 3,
    name: "Amanda Wilson",
    profession: "AC Repair",
    rating: 4.9,
    reviews: 112,
    price: 60,
    experience: 9,
    availability: "Available Tomorrow",
    specialties: ["AC Repair", "Maintenance", "Installation"],
    img: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  // Add 3 more providers (total 6) to match 6 providers shown in screenshot
  {
    id: 4,
    name: "Sarah Johnson",
    profession: "Cleaning",
    rating: 4.8,
    reviews: 98,
    price: 30,
    experience: 7,
    availability: "Available Today",
    specialties: ["Deep Cleaning", "Carpet Cleaning"],
    img: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    id: 5,
    name: "David Lee",
    profession: "Painting",
    rating: 4.7,
    reviews: 110,
    price: 40,
    experience: 11,
    availability: "Available Tomorrow",
    specialties: ["Interior Painting", "Exterior Painting"],
    img: "https://randomuser.me/api/portraits/men/85.jpg",
  },
  {
    id: 6,
    name: "Mike Brown",
    profession: "Carpentry",
    rating: 4.9,
    reviews: 123,
    price: 50,
    experience: 10,
    availability: "Available Today",
    specialties: ["Furniture", "Custom Woodwork"],
    img: "https://randomuser.me/api/portraits/men/72.jpg",
  },
];


export default function Service() {
  const [selectedCategory, setSelectedCategory] = useState("All Services");
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [sortBy, setSortBy] = useState("Rating");

  // Filter providers by category and search input
  let filteredProviders = serviceProviders.filter((provider) => {
    const matchesCategory =
      selectedCategory === "All Services" || provider.profession === selectedCategory;
    const matchesSearch =
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.profession.toLowerCase().includes(searchTerm.toLowerCase());
    // For demo, location filter is not applied, since no location data available.
    return matchesCategory && matchesSearch;
  });

  // Sort by rating descending only, as shown in UI
  if (sortBy === "Rating") {
    filteredProviders = filteredProviders.sort(
      (a, b) => b.rating - a.rating
    );
  }
  if (sortBy === "Price") {
    filteredProviders = filteredProviders.sort(
      (a, b) => a.price - b.price
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Find Service Providers
        </h1>
        <p className="text-gray-600 mt-1">
          Browse and book verified professionals in your area
        </p>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white max-w-7xl mx-auto rounded-md shadow px-6 py-5 mb-6 flex flex-col md:flex-row  md:space-x-4 space-y-4 md:space-y-0">

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 w-full'>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <div className="w-5 h-5 flex items-center-safe justify-center-safe">
                <FaSearch className=" text-green-500" />
              </div>

            </div>
            <input
              type="text"
              placeholder="Search services or providers..."
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 md:grow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <div className="w-5 h-5 flex items-center-safe justify-center-safe">
                <FaLocationDot className=" text-green-500" />
              </div>

            </div>
            <input
              type="text"
              placeholder="Enter location..."
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              value={locationTerm}
              onChange={(e) => setLocationTerm(e.target.value)}
            />
          </div>


          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-md pl-4 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="Rating">Sort by Rating</option>
              <option value="Price">Sort by Price</option>
              {/* Add other sorting options if you want */}
            </select>
          </div>
        </div>


      </div>

      {/* Categories filters */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-1 rounded-full text-sm border ${selectedCategory === cat
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              } transition`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Showing X service providers */}
      <div className="max-w-7xl mx-auto mb-6 text-gray-700 text-sm">
        Showing {filteredProviders.length} service providers
      </div>

      {/* Cards grid */}
      <div className="max-w-7xl mx-auto grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredProviders.map((provider) => (
          <ServiceProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </div>
  );
}
