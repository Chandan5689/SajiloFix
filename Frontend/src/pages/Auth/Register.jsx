import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '../../context/FirebaseAuthContext';
import { sendEmailVerification, reload } from 'firebase/auth';
import { auth } from '../../config/firebase';
import api from '../../api/axios';
import PhoneVerification from './PhoneVerification';
import { X, Upload, FileText, Eye, Trash2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register: firebaseRegister, user: firebaseUser, checkEmailVerification } = useFirebaseAuth();
  const [activeStep, setActiveStep] = useState('find');
  const [registrationStep, setRegistrationStep] = useState(1); // 1: Basic info, 2: Email verification, 3: Phone verification
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [specialities, setSpecialities] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [profilePreview, setProfilePreview] = useState(null);
  const [certificates, setCertificates] = useState([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    user_type: 'find',
    business_name: '',
    years_of_experience: '',
    service_area: '',
    address: '',
    city: '',
    bio: '',
    profile_picture: null,
    specialities: [],
    specializations: []
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch specialities and specializations
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching specialities...');
        const [specialitiesRes, specializationsRes] = await Promise.all([
          api.get('/auth/specialities/'),
          api.get('/auth/specializations/')
        ]);

        console.log('Specialities received:', specialitiesRes.data);
        console.log('Specializations received:', specializationsRes.data);

        setSpecialities(specialitiesRes.data);
        setSpecializations(specializationsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        console.error('Error response:', err.response);
        setError('Failed to load specialities. Please refresh the page.');
      }
    };
    fetchData();
  }, []);

  const handleStepChange = (step) => {
    setActiveStep(step);
    setFormData({ ...formData, user_type: step });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors({ ...fieldErrors, profile_picture: 'File size must be less than 5MB' });
        return;
      }

      if (!file.type.startsWith('image/')) {
        setFieldErrors({ ...fieldErrors, profile_picture: 'Only image files are allowed' });
        return;
      }

      setFormData({ ...formData, profile_picture: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);

      if (fieldErrors.profile_picture) {
        setFieldErrors({ ...fieldErrors, profile_picture: '' });
      }
    }
  };

  const handleCertificateUpload = (e) => {
    const files = Array.from(e.target.files);

    // Validate files
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      // Check file size (max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name} is too large (max 10MB)`);
        return;
      }

      // Check file type (pdf, images, doc, docx)
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name} has invalid format`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setFieldErrors({ ...fieldErrors, certificates: errors.join(', ') });
      return;
    }

    // Add valid files to certificates
    const newCertificates = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      file: file,
      preview: URL.createObjectURL(file)
    }));

    setCertificates([...certificates, ...newCertificates]);

    // Clear error
    if (fieldErrors.certificates) {
      setFieldErrors({ ...fieldErrors, certificates: '' });
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemoveCertificate = (id) => {
    setCertificates(certificates.filter(cert => cert.id !== id));
  };

  const handleSpecialityToggle = (specialityId) => {
    setFormData(prev => {
      const newSpecialities = prev.specialities.includes(specialityId)
        ? prev.specialities.filter(id => id !== specialityId)
        : [...prev.specialities, specialityId];
      return { ...prev, specialities: newSpecialities };
    });
  };

  const handleSpecializationToggle = (specializationId) => {
    setFormData(prev => {
      const newSpecializations = prev.specializations.includes(specializationId)
        ? prev.specializations.filter(id => id !== specializationId)
        : [...prev.specializations, specializationId];
      return { ...prev, specializations: newSpecializations };
    });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.first_name.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    // Phone number validation - exactly 10 digits starting with 98 or 97
    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (!/^(98|97)\d{8}$/.test(formData.phone_number)) {
      errors.phone_number = 'Phone number must be exactly 10 digits starting with 98 or 97 (e.g., 9812345678)';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirm_password) {
      errors.confirm_password = 'Please confirm password';
    } else if (formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }

    if (formData.user_type === 'offer') {
      if (formData.specialities.length === 0) {
        errors.specialities = 'Please select at least one speciality';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();

      // Append all text fields
      Object.keys(formData).forEach(key => {
        if (key === 'profile_picture') {
          if (formData.profile_picture) {
            submitData.append('profile_picture', formData.profile_picture);
          }
        } else if (key === 'specialities') {
          if (formData.user_type === 'offer' && formData.specialities.length > 0) {
            formData.specialities.forEach((id, index) => {
              submitData.append(`specialities[${index}]`, id);
            });
          }
        } else if (key === 'specializations') {
          // Only add specializations for service providers
          if (formData.user_type === 'offer' && formData.specializations.length > 0) {
            formData.specializations.forEach((id, index) => {
              submitData.append(`specializations[${index}]`, id);
            });
          }
        } else if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      if (formData.user_type === 'offer' && certificates.length > 0) {
        certificates.forEach((cert, index) => {
          submitData.append(`certificates[${index}]`, cert.file);
        });
      };

      console.log('FormData contents:');
      for (let pair of submitData.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }

      // Create Firebase account
      await firebaseRegister(formData.email, formData.password, formData.first_name, formData.last_name);
      
      // Store form data in localStorage for later use in phone verification
      localStorage.setItem('pendingRegistration', JSON.stringify({
        ...formData,
        certificates: certificates.map(cert => ({ name: cert.name, file: null })) // Don't store File objects
      }));

      setSuccessMessage('Account created! Please check your email and click the verification link.');
      setRegistrationStep(2); // Move to email verification step

    } catch (err) {
      console.error('Registration error:', err);

      if (err.email) {
        setFieldErrors({ ...fieldErrors, email: err.email[0] });
      }
      if (err.password) {
        setFieldErrors({ ...fieldErrors, password: err.password[0] });
      }
      if (err.phone_number) {
        setFieldErrors({ ...fieldErrors, phone_number: err.phone_number[0] });
      }
      if (err.profile_picture) {
        setFieldErrors({ ...fieldErrors, profile_picture: err.profile_picture[0] });
      }
      if (err.specialities) {
        setFieldErrors({ ...fieldErrors, specialities: err.specialities[0] || err.specialities });
      }

      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSpecializations = () => {
    if (formData.specialities.length === 0) return [];
    return specializations.filter(spec =>
      formData.specialities.includes(spec.speciality)
    );
  };

  // Check email verification status periodically when on step 2
  useEffect(() => {
    if (registrationStep === 2 && firebaseUser) {
      const checkInterval = setInterval(async () => {
        try {
          // Reload user to get latest emailVerified status
          await reload(firebaseUser);
          if (firebaseUser.emailVerified) {
            clearInterval(checkInterval);
            setRegistrationStep(3); // Move to phone verification
          }
        } catch (err) {
          console.error('Error checking email verification:', err);
        }
      }, 2000); // Check every 2 seconds

      return () => clearInterval(checkInterval);
    }
  }, [registrationStep, firebaseUser]);

  const handleResendEmailVerification = async () => {
    if (firebaseUser) {
      try {
        await sendEmailVerification(firebaseUser);
        setSuccessMessage('Verification email sent! Please check your inbox.');
      } catch (err) {
        setError('Failed to resend verification email. Please try again.');
      }
    }
  };

  const handlePhoneVerified = async () => {
    // Get pending registration data
    const pendingData = JSON.parse(localStorage.getItem('pendingRegistration') || '{}');
    
    try {
      const idToken = await firebaseUser.getIdToken();
      
      // Update user type and location
      await api.post(
        'auth/update-user-type/',
        {
          user_type: activeStep,
          location: location || pendingData.location || '',
          ...(activeStep === 'offer' && {
            business_name: pendingData.business_name || '',
            years_of_experience: pendingData.years_of_experience || 0,
            service_area: pendingData.service_area || '',
            city: pendingData.city || '',
            address: pendingData.address || '',
            bio: pendingData.bio || '',
            specialities: pendingData.specialities || [],
            specializations: pendingData.specializations || [],
          }),
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      // Clear pending registration
      localStorage.removeItem('pendingRegistration');

      // Redirect based on user type
      if (activeStep === 'offer') {
        navigate('/complete-provider-profile');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Error completing registration:', err);
      setError(err.response?.data?.error || 'Failed to complete registration');
    }
  };

  // Step 3: Phone Verification
  if (registrationStep === 3) {
    return (
      <PhoneVerification 
        userType={activeStep} 
        location={location || formData.location || ''} 
        onComplete={handlePhoneVerified} 
      />
    );
  }

  // Step 2: Email Verification Waiting
  if (registrationStep === 2) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📧</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h2>
            <p className="text-gray-600">
              We sent a verification link to
            </p>
            <p className="font-semibold text-gray-900 mt-1">{formData.email}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Steps:</strong>
              </p>
              <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Come back here - we'll automatically detect when you've verified</li>
              </ol>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Waiting for email verification...
              </p>
              <div className="flex justify-center">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResendEmailVerification}
              className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Resend Verification Email
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('pendingRegistration');
                navigate('/login');
              }}
              className="w-full text-gray-600 hover:text-gray-700 text-sm"
            >
              Cancel and go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Join SajiloFix</h2>
          <p className="text-gray-600">Create your account and get started</p>
        </div>

        {/* User Type Selection */}
        <div className="flex gap-4 mb-8">
          <button
            type="button"
            onClick={() => handleStepChange('find')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${activeStep === 'find'
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <div className="text-2xl mb-2">🔍</div>
            Find Services
          </button>
          <button
            type="button"
            onClick={() => handleStepChange('offer')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${activeStep === 'offer'
              ? 'bg-green-600 text-white shadow-lg scale-105'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <div className="text-2xl mb-2">🛠️</div>
            Offer Services
          </button>
        </div>

        {/* Messages */}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300">
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-gray-400">👤</span>
                )}
              </div>
              <label
                htmlFor="profile_picture"
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              <input
                type="file"
                id="profile_picture"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">Upload profile picture</p>
            {fieldErrors.profile_picture && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.profile_picture}</p>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border ${fieldErrors.first_name ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="John"
              />
              {fieldErrors.first_name && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border ${fieldErrors.last_name ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Doe"
              />
              {fieldErrors.last_name && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.last_name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="john@example.com"
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
            <input
              type="text"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Kathmandu"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *  (10 digits)</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border ${fieldErrors.phone_number ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="+977 98XXXXXXXX"
            />
            <p className="mt-1 text-xs text-gray-500">Enter 10 digits starting with 98 or 97</p>
            {fieldErrors.phone_number && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.phone_number}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="••••••••"
              />
              {fieldErrors.password && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border ${fieldErrors.confirm_password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="••••••••"
              />
              {fieldErrors.confirm_password && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.confirm_password}</p>
              )}
            </div>
          </div>

          {/* Service Provider Fields */}
          {activeStep === 'offer' && (
            <>
              <div className="border-t pt-6 mt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Your Business Name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                      <input
                        type="number"
                        name="years_of_experience"
                        value={formData.years_of_experience}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Kathmandu"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Area</label>
                    <input
                      type="text"
                      name="service_area"
                      value={formData.service_area}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 20"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use whole kilometers, e.g., 10 or 20</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Your Address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio / Description</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell us about yourself and your services..."
                    />
                  </div>

                  {/* Specialities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialities * (Select at least one)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {specialities.map(speciality => (
                        <button
                          key={speciality.id}
                          type="button"
                          onClick={() => handleSpecialityToggle(speciality.id)}
                          className={`p-3 rounded-lg border-2 transition-all ${formData.specialities.includes(speciality.id)
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                          {speciality.name}
                        </button>
                      ))}
                    </div>
                    {fieldErrors.specialities && (
                      <p className="text-red-500 text-sm mt-2">{fieldErrors.specialities}</p>
                    )}
                  </div>

                  {/* Specializations */}
                  {formData.specialities.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specializations (Select relevant ones)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-4 border border-gray-200 rounded-lg">
                        {getFilteredSpecializations().map(specialization => (
                          <button
                            key={specialization.id}
                            type="button"
                            onClick={() => handleSpecializationToggle(specialization.id)}
                            className={`p-2 text-sm rounded-lg border transition-all text-left ${formData.specializations.includes(specialization.id)
                              ? 'border-green-600 bg-green-50 text-green-700'
                              : 'border-gray-300 hover:border-gray-400'
                              }`}
                          >
                            {specialization.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certificates Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certificates / Documents (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label
                            htmlFor="certificates"
                            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                          >
                            Upload Certificates
                          </label>
                          <input
                            type="file"
                            id="certificates"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={handleCertificateUpload}
                            className="hidden"
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          PDF, JPG, PNG, DOC, DOCX up to 10MB each
                        </p>
                      </div>
                    </div>
                    {fieldErrors.certificates && (
                      <p className="text-red-500 text-sm mt-2">{fieldErrors.certificates}</p>
                    )}

                    {/* Uploaded Certificates List */}
                    {certificates.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {certificates.map(cert => (
                          <div
                            key={cert.id}
                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <FileText className="h-8 w-8 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(cert.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCertificate(cert.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all ${loading
              ? 'bg-gray-400 cursor-not-allowed'
              : activeStep === 'find'
                ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Log In
              </Link>
            </p>
          </div>
        </form>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Register;