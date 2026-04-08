import React, { useState, useEffect } from 'react';
import { patientAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { FaSave } from 'react-icons/fa';

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    age: '',
    weight: '',
    height: '',
    bloodType: '',
    allergies: '',
    chronicConditions: '',
    currentMedications: '',
    emergencyContact: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await patientAPI.getProfile();
      if (response.data.success) {
        const data = response.data.data;
        setProfile({
          age: data.age || '',
          weight: data.weight || '',
          height: data.height || '',
          bloodType: data.bloodType || '',
          allergies: data.allergies || '',
          chronicConditions: data.chronicConditions || '',
          currentMedications: data.currentMedications || '',
          emergencyContact: data.emergencyContact || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await patientAPI.updateProfile(profile);
      if (response.data.success) {
        alert('Profile updated successfully!');
      }
    } catch (error) {
      alert('Error updating profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Health Profile</h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            💡 <strong>Why complete your profile?</strong> Your health information helps our AI provide 
            more personalized and accurate health advice tailored to your specific needs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Age</label>
                <input
                  type="number"
                  name="age"
                  value={profile.age}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your age"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={profile.weight}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your weight"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  name="height"
                  value={profile.height}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your height"
                />
              </div>
            </div>
          </div>

          {/* Blood Type */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Blood Type</label>
            <select
              name="bloodType"
              value={profile.bloodType}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select blood type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          {/* Medical Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Medical Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Allergies (if any)
                </label>
                <textarea
                  name="allergies"
                  value={profile.allergies}
                  onChange={handleChange}
                  className="input-field"
                  rows="3"
                  placeholder="e.g., Penicillin, Peanuts, Latex..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Chronic Conditions
                </label>
                <textarea
                  name="chronicConditions"
                  value={profile.chronicConditions}
                  onChange={handleChange}
                  className="input-field"
                  rows="3"
                  placeholder="e.g., Diabetes, Hypertension, Asthma..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Current Medications
                </label>
                <textarea
                  name="currentMedications"
                  value={profile.currentMedications}
                  onChange={handleChange}
                  className="input-field"
                  rows="3"
                  placeholder="List your current medications and dosages..."
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Emergency Contact</h2>
            <input
              type="text"
              name="emergencyContact"
              value={profile.emergencyContact}
              onChange={handleChange}
              className="input-field"
              placeholder="Name and phone number of emergency contact"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-8 py-3 flex items-center gap-2"
            >
              <FaSave />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
