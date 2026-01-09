import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FaLocationDot } from "react-icons/fa6";
import { FaSearch } from 'react-icons/fa'
import ServiceProviderCard from "../../layouts/ServiceProviderCard";
import providersService from "../../services/providersService";
import specialitiesService from "../../services/specialitiesService";
import locationsService from "../../services/locationsService";
import { nepaliCities, nepaliDistricts } from "../../constants/nepaliLocations";

export default function Service() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState(["All Services"]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || "All Services");
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
  const [city, setCity] = useState(searchParams.get('city') || "");
  const [district, setDistrict] = useState(searchParams.get('district') || "");
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || "Rating");
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topRated, setTopRated] = useState(searchParams.get('topRated') === 'true');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProviders, setTotalProviders] = useState(null);
  
  // Location states
  const [availableCities, setAvailableCities] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState({});
  const [useSearchMode, setUseSearchMode] = useState(true);
  const [citySearch, setCitySearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  
  const itemsPerPage = 12;
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';
  const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '/');

  const buildFilters = () => {
    const filters = {};
    if (selectedCategory && selectedCategory !== 'All Services') {
      filters.specialization = selectedCategory;
    }
    if (searchTerm) {
      filters.q = searchTerm;
    }
    if (city) {
      filters.city = city;
    }
    if (district) {
      filters.district = district;
    }
    if (topRated) {
      filters.min_rating = 4.5;
    }
    return filters;
  };

  // Helper to reset all filters
  const resetFilters = () => {
    setSelectedCategory("All Services");
    setSearchTerm("");
    setCity("");
    setDistrict("");
    setCitySearch("");
    setDistrictSearch("");
    setShowCityDropdown(false);
    setShowDistrictDropdown(false);
    setSortBy("Rating");
    setTopRated(false);
    setPage(1);
    setProviders([]);
    setSearchParams(new URLSearchParams()); // Clear URL params
  };

  // Helper to update URL search params
  const updateSearchParams = (params) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === "" || value === "All Services") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams);
  };

  // Sync each filter to URL
  useEffect(() => {
    updateSearchParams({ category: selectedCategory });
  }, [selectedCategory]);

  useEffect(() => {
    updateSearchParams({ q: searchTerm });
  }, [searchTerm]);

  useEffect(() => {
    updateSearchParams({ city });
  }, [city]);

  useEffect(() => {
    updateSearchParams({ district });
  }, [district]);

  useEffect(() => {
    updateSearchParams({ sort: sortBy });
  }, [sortBy]);

  useEffect(() => {
    updateSearchParams({ topRated: topRated ? 'true' : null });
  }, [topRated]);

  // Fetch providers on component mount
  useEffect(() => {
    fetchProviders(buildFilters(), 1, false);
  }, []);

  // Fetch categories (specialities) from backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await specialitiesService.getSpecialities();
        if (mounted && Array.isArray(list)) {
          setCategories(["All Services", ...list.map(s => s.name)]);
        }
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch locations from backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await locationsService.getLocations();
        if (mounted) {
          const dynamicCities = data.cities || [];
          const dynamicDistricts = data.districts || {};
          // Merge static + dynamic cities
          const mergedCities = Array.from(new Set([...
            dynamicCities,
            ...nepaliCities
          ])).sort();
          // Merge districts per city (union of arrays)
          const mergedDistricts = {};
          mergedCities.forEach(cityName => {
            const staticDs = nepaliDistricts[cityName] || [];
            const dynamicDs = dynamicDistricts[cityName] || [];
            mergedDistricts[cityName] = Array.from(new Set([
              ...staticDs,
              ...dynamicDs
            ])).sort();
          });
          setAvailableCities(mergedCities);
          setAvailableDistricts(mergedDistricts);
        }
      } catch (e) {
        console.error("Failed to load locations", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const fetchProviders = async (filters = {}, pageArg = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);
      const pagedFilters = {
        ...filters,
        page: pageArg,
        page_size: itemsPerPage,
      };
      setTotalProviders(null);
      const data = await providersService.getProviders(pagedFilters);
      const list = Array.isArray(data) ? data : (data.results || []);
      const totalCount = Array.isArray(data) ? null : (data.count ?? null);
      if (totalCount !== null) {
        setTotalProviders(totalCount);
      }
      
      // Convert provider data to format compatible with ServiceProviderCard
      const formattedProviders = list.map(provider => ({
        id: provider.id,
        name: provider.full_name || 
          [provider.first_name, provider.middle_name, provider.last_name].filter(Boolean).join(' ').trim() || 
          'Service Provider',
        profession: provider.specializations?.[0] || 'Service Provider',
        primarySpecialization: provider.specializations?.[0] || null,
        serviceCategory: provider.speciality?.[0] || null,
        rating: provider.average_rating,
        reviews: provider.review_count,
        price: provider.starting_price != null ? Number(provider.starting_price) : null,
        priceType: provider.starting_price_type || null,
        experience: provider.years_of_experience || 0,
        serviceCount: provider.service_count || 0,
        servicePreview: provider.services_preview || [],
        priceRangeMin: provider.price_range_min != null ? Number(provider.price_range_min) : null,
        priceRangeMax: provider.price_range_max != null ? Number(provider.price_range_max) : null,
        availability: provider.availability_status || "Schedule on request",
        specialties: provider.specializations || [],
        img: (() => {
          if (provider.profile_picture) {
            if (String(provider.profile_picture).startsWith('http')) return provider.profile_picture;
            const path = String(provider.profile_picture).startsWith('/') ? String(provider.profile_picture).slice(1) : String(provider.profile_picture);
            return API_ORIGIN + path;
          }
          return "https://randomuser.me/api/portraits/men/32.jpg";
        })(),
        city: provider.city,
        district: provider.district,
        bio: provider.bio,
      }));
      
      // Pagination: set initial providers or append for "Load More"
      if (append) {
        setProviders(prev => [...prev, ...formattedProviders]);
      } else {
        setProviders(formattedProviders);
      }
      
      // Determine if there are more results
      const hasNext = Array.isArray(data) ? (formattedProviders.length >= itemsPerPage) : Boolean(data.next);
      setHasMore(hasNext);
    } catch (err) {
      console.error("Error fetching providers:", err);
      setError("Failed to load providers");
    } finally {
      setLoading(false);
    }
  };

  // Debounced server-side fetch when filters change (reset to page 1)
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const filters = buildFilters();
      setPage(1); // Reset to first page on filter change
      fetchProviders(filters, 1, false);
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [selectedCategory, searchTerm, city, district, topRated]);

  // Server-side filtering already applied; keep light client filters for safety
  let filteredProviders = providers.filter((provider) => {
    const matchesCategory =
      selectedCategory === "All Services" || 
      provider.specialties.some(spec => 
        spec.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      provider.name.toLowerCase().includes(term) ||
      provider.profession.toLowerCase().includes(term) ||
      provider.primarySpecialization?.toLowerCase().includes(term);
    const matchesLocation =
      (!city || provider.city?.toLowerCase().includes(city.toLowerCase())) &&
      (!district || provider.district?.toLowerCase().includes(district.toLowerCase()));
    return matchesCategory && matchesSearch && matchesLocation;
  });

  // Keep UI-sort deterministic on current page results
  if (sortBy === "Rating") {
    filteredProviders = filteredProviders.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
  if (sortBy === "Price") {
    filteredProviders = filteredProviders.sort((a, b) => {
      const av = a.price != null ? a.price : Number.MAX_SAFE_INTEGER;
      const bv = b.price != null ? b.price : Number.MAX_SAFE_INTEGER;
      return av - bv;
    });
  }
  if (sortBy === "Reviews") {
    filteredProviders = filteredProviders.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
  }
  if (sortBy === "Experience") {
    filteredProviders = filteredProviders.sort((a, b) => (b.experience ?? 0) - (a.experience ?? 0));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Find Your Right Pro
        </h1>
        <p className="text-gray-600 mt-1">
          Compare services, pricing, and reviews before you book.
        </p>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white max-w-7xl mx-auto rounded-2xl shadow px-6 py-5 mb-6 border border-gray-100">
        <div className="flex flex-col gap-4">
          {/* Row 1: Search + Clear */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <FaSearch className="text-green-500" />
              </div>
              <input
                type="text"
                placeholder="Search providers or services..."
                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
           
          </div>

          {/* Row 2: Location (search-mode toggle simplified) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <FaLocationDot className="text-green-500" />
              </div>
              {useSearchMode ? (
                <input
                  type="text"
                  placeholder="Search City..."
                  className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setShowCityDropdown(true);
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                />
              ) : (
                <select
                  className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setDistrict("");
                    setCitySearch(e.target.value);
                    setDistrictSearch("");
                  }}
                >
                  <option value="">Select City</option>
                  {availableCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
              {showCityDropdown && useSearchMode && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {availableCities
                    .filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
                    .map(c => (
                      <div
                        key={c}
                        onMouseDown={() => {
                          setCity(c);
                          setCitySearch(c);
                          setShowCityDropdown(false);
                          setDistrict("");
                          setDistrictSearch("");
                        }}
                        className="px-4 py-2 hover:bg-green-100 cursor-pointer text-sm"
                      >
                        {c}
                      </div>
                    ))}
                  {availableCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).length === 0 && (
                    <div className="px-4 py-2 text-gray-500 text-sm">No cities found</div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <FaLocationDot className="text-green-500" />
              </div>
              {useSearchMode ? (
                <input
                  type="text"
                  placeholder="Search District..."
                  disabled={!city}
                  className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={districtSearch}
                  onChange={(e) => {
                    setDistrictSearch(e.target.value);
                    setShowDistrictDropdown(true);
                  }}
                  onFocus={() => setShowDistrictDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDistrictDropdown(false), 200)}
                />
              ) : (
                <select
                  disabled={!city}
                  className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setDistrictSearch(e.target.value);
                  }}
                >
                  <option value="">Select District</option>
                  {(availableDistricts[city] || []).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
              {showDistrictDropdown && useSearchMode && city && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {(availableDistricts[city] || [])
                    .filter(d => d.toLowerCase().includes(districtSearch.toLowerCase()))
                    .map(d => (
                      <div
                        key={d}
                        onMouseDown={() => {
                          setDistrict(d);
                          setDistrictSearch(d);
                          setShowDistrictDropdown(false);
                        }}
                        className="px-4 py-2 hover:bg-green-100 cursor-pointer text-sm"
                      >
                        {d}
                      </div>
                    ))}
                  {(availableDistricts[city] || []).filter(d => d.toLowerCase().includes(districtSearch.toLowerCase())).length === 0 && (
                    <div className="px-4 py-2 text-gray-500 text-sm">No districts found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Category chips */}
          <div className="flex flex-wrap gap-2">
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

          {/* Row 4: Sort + toggles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:items-center">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-md pl-4 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="Rating">Sort by Rating</option>
                <option value="Reviews">Sort by Reviews</option>
                <option value="Experience">Sort by Experience</option>
                <option value="Price">Sort by Price</option>
              </select>
            </div>
            <div className="flex items-center">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={topRated}
                  onChange={(e) => setTopRated(e.target.checked)}
                />
                Top Rated (4.5+)
              </label>
            </div>
            <div className="flex items-center">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={useSearchMode}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setUseSearchMode(enabled);
                    if (enabled) {
                      setCitySearch(city || "");
                      setDistrictSearch(district || "");
                    }
                  }}
                />
                Type-to-search locations
              </label>
            </div>

             <button
              onClick={resetFilters}
              className="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition md:w-auto w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Categories filters */}
      {/* <div className="max-w-7xl mx-auto mb-6 flex flex-wrap gap-2">
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
      </div> */}

      {/* Showing X service providers */}
      <div className="max-w-7xl mx-auto mb-6 text-gray-700 text-sm">
        {loading ? (
          <span>Loading providers...</span>
        ) : error ? (
          <span className="text-red-600">{error}</span>
        ) : (
          <span>
            Showing {filteredProviders.length}
            {totalProviders != null ? ` of ${totalProviders}` : ''} service providers
          </span>
        )}
      </div>

      {/* Cards grid */}
      <div className="max-w-7xl mx-auto grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex justify-center mb-3">
                <div className="w-20 h-20 rounded-full bg-gray-200" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/5 mx-auto mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/5 mx-auto mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-4/5" />
                <div className="h-3 bg-gray-200 rounded w-3/5" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-full text-center py-12">
            <div className="text-red-600">{error}</div>
            <button 
              onClick={fetchProviders}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-600">No providers found matching your criteria</div>
          </div>
        ) : (
          filteredProviders.map((provider) => (
            <ServiceProviderCard key={provider.id} provider={provider} />
          ))
        )}
      </div>

      {/* Load More button */}
      {hasMore && !loading && filteredProviders.length > 0 && (
        <div className="max-w-7xl mx-auto mt-8 text-center">
          <button
            onClick={() => {
              const filters = buildFilters();
              const nextPage = page + 1;
              setPage(nextPage);
              fetchProviders(filters, nextPage, true);
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
