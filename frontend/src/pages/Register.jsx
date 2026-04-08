import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
  FaHeartbeat, FaUser, FaUserMd, FaEnvelope,
  FaPhone, FaLock, FaIdCard, FaCheckCircle,
} from 'react-icons/fa';

const ROLES = [
  {
    key: 'ROLE_PATIENT',
    label: 'Patient',
    icon: FaUser,
    description: 'I want to consult doctors & manage my health',
    activeClass: 'border-primary-500 bg-primary-50 text-primary-700',
    checkClass: 'text-primary-600',
    btnClass: 'bg-primary-600 hover:bg-primary-700',
  },
  {
    key: 'ROLE_DOCTOR',
    label: 'Doctor',
    icon: FaUserMd,
    description: 'I am a healthcare professional',
    activeClass: 'border-blue-500 bg-blue-50 text-blue-700',
    checkClass: 'text-blue-600',
    btnClass: 'bg-blue-600 hover:bg-blue-700',
  },
];

const InputField = ({ icon: Icon, label, ...props }) => (
  <div>
    <label className="block text-gray-700 font-medium mb-1.5 text-sm">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />}
      <input
        {...props}
        className={`w-full ${Icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors`}
      />
    </div>
  </div>
);

const Register = () => {
  const [selectedRole, setSelectedRole] = useState('ROLE_PATIENT');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const activeRole = ROLES.find((r) => r.key === selectedRole);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...rest } = formData;
    const registrationData = { ...rest, roles: [selectedRole] };

    const result = await register(registrationData);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/login', { state: { message: 'Registration successful! Please login.' } }), 2000);
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-sm w-full">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h2>
          <p className="text-gray-500">Redirecting you to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4 py-10">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="bg-primary-100 p-3 rounded-full">
              <FaHeartbeat className="text-4xl text-primary-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Create Your Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the Healthcare Chat Assistant</p>
        </div>

        {/* Role Selector */}
        <div className="mb-6">
          <p className="text-gray-700 font-medium text-sm mb-3 text-center">I am registering as a…</p>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isActive = selectedRole === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => { setSelectedRole(role.key); setError(''); }}
                  className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                    isActive ? role.activeClass : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isActive && (
                    <FaCheckCircle className={`absolute top-2 right-2 text-sm ${role.checkClass}`} />
                  )}
                  <Icon className={`text-2xl ${isActive ? '' : 'text-gray-400'}`} />
                  <span className="font-semibold text-sm">{role.label}</span>
                  <span className={`text-xs text-center leading-tight ${isActive ? 'opacity-80' : 'text-gray-400'}`}>
                    {role.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              icon={FaIdCard}
              label="Full Name"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Your full name"
              autoComplete="name"
              required
            />
            <InputField
              icon={FaUser}
              label="Username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              autoComplete="username"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              icon={FaEnvelope}
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              autoComplete="email"
              required
            />
            <InputField
              icon={FaPhone}
              label="Phone Number"
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Optional"
              autoComplete="tel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              icon={FaLock}
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
              autoComplete="new-password"
              required
              minLength="6"
            />
            <InputField
              icon={FaLock}
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white font-semibold rounded-lg transition-all mt-2 disabled:opacity-60 ${activeRole.btnClass}`}
          >
            {loading
              ? 'Creating Account...'
              : `Register as ${activeRole.label}`}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-5 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
