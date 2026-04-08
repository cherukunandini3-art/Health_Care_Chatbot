import React from 'react';
import { FaHeartbeat, FaRobot, FaShieldAlt, FaUserMd, FaFileMedical, FaCalendarCheck, FaLock } from 'react-icons/fa';

const features = [
  {
    icon: <FaRobot className="text-blue-500 text-3xl" />,
    title: 'AI Symptom Checker',
    desc: 'Instant symptom analysis powered by advanced AI.',
  },
  {
    icon: <FaFileMedical className="text-green-500 text-3xl" />,
    title: 'Medical Report OCR Analysis',
    desc: 'Upload and interpret medical reports with OCR.',
  },
  {
    icon: <FaHeartbeat className="text-red-500 text-3xl" />,
    title: 'Emergency Detection',
    desc: 'AI flags urgent cases for immediate attention.',
  },
  {
    icon: <FaUserMd className="text-blue-400 text-3xl" />,
    title: 'Doctor Dashboard',
    desc: 'Doctors manage patient chats and reports securely.',
  },
  {
    icon: <FaShieldAlt className="text-green-400 text-3xl" />,
    title: 'Secure Health Profile',
    desc: 'Encrypted health data and role-based access.',
  },
  {
    icon: <FaCalendarCheck className="text-blue-300 text-3xl" />,
    title: 'Appointment Booking',
    desc: 'Book appointments with healthcare professionals.',
  },
];

const steps = [
  { step: 'Describe Symptoms', desc: 'Share your symptoms or upload reports.' },
  { step: 'AI Analysis', desc: 'AI reviews and interprets your input.' },
  { step: 'Get Guidance', desc: 'Receive actionable health advice.' },
  { step: 'Book Appointment', desc: 'Connect with a doctor if needed.' },
];

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center gap-2">
            <FaHeartbeat className="text-blue-500 text-2xl" />
            <span className="font-bold text-xl text-blue-700">MediAI</span>
          </div>
          <div className="hidden md:flex gap-8 text-gray-700 font-medium">
            <a href="#" className="hover:text-blue-600 transition">Home</a>
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#about" className="hover:text-blue-600 transition">About</a>
            <a href="/login" className="hover:text-blue-600 transition">Login</a>
            <a href="/register" className="hover:text-blue-600 transition">Register</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto py-16 px-6 gap-12">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-6">AI-Powered Healthcare Assistance Anytime</h1>
          <p className="text-lg text-gray-600 mb-8">Get instant symptom analysis, medical report interpretation, and emergency detection—all powered by advanced AI.</p>
          <div className="flex gap-4 mb-8">
            <a href="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition">Get Started</a>
            <a href="#features" className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg shadow transition">Learn More</a>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <img
            src="/doc.png"
            alt="AI-Powered Doctor"
            className="w-full max-w-md h-auto object-cover rounded-3xl shadow-2xl"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-blue-800 mb-8 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center hover:shadow-xl transition group">
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold text-blue-700 mb-2 group-hover:text-blue-900 transition">{f.title}</h3>
                <p className="text-gray-600 text-center">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white" id="about">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-blue-800 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="bg-blue-100 rounded-xl p-6 flex flex-col items-center shadow-md">
                <span className="text-2xl font-bold text-blue-700 mb-2">Step {i+1}</span>
                <h4 className="text-lg font-semibold text-blue-800 mb-1">{s.step}</h4>
                <p className="text-gray-600 text-center">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 bg-green-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-green-800 mb-8 text-center">Security & Privacy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center">
              <FaLock className="text-green-500 text-3xl mb-4" />
              <h3 className="text-xl font-semibold text-green-700 mb-2">Encrypted Data</h3>
              <p className="text-gray-600 text-center">All health data is encrypted and securely stored.</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center">
              <FaShieldAlt className="text-green-400 text-3xl mb-4" />
              <h3 className="text-xl font-semibold text-green-700 mb-2">Role-Based Access</h3>
              <p className="text-gray-600 text-center">Only authorized users can access sensitive information.</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center">
              <FaUserMd className="text-green-300 text-3xl mb-4" />
              <h3 className="text-xl font-semibold text-green-700 mb-2">Privacy Focused</h3>
              <p className="text-gray-600 text-center">Your privacy is our top priority—no data sharing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Section */}
      <section className="py-16 bg-blue-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <h2 className="text-3xl font-bold text-blue-800 mb-6 text-center">Start Your Health Journey Today</h2>
          <a href="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg shadow transition text-lg">Register</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-600 text-sm">
            <p>Contact: support@mediai.com</p>
            <p>Privacy Policy | Disclaimer</p>
          </div>
          <div className="text-gray-500 text-xs">&copy; {new Date().getFullYear()} MediAI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
