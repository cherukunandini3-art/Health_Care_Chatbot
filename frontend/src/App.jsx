import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';

// Normalize a role entry — can be a string "ROLE_ADMIN" or object {id, name}
const getRoleName = (r) => (typeof r === 'string' ? r : r?.name ?? '');

// Read user/token directly from localStorage (used as fallback below)
const getStorageAuth = () => {
  try {
    const token = localStorage.getItem('token');
    const user  = JSON.parse(localStorage.getItem('user'));
    return { token: !!token, user };
  } catch { return { token: false, user: null }; }
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Fall back to localStorage for the React-state race condition on fresh login
  // (navigate() can fire before the context re-render flushes)
  const storage = getStorageAuth();
  const authenticated = isAuthenticated || storage.token;

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const storageRoleOk = storage.user?.roles?.some(r => getRoleName(r) === requiredRole);
    const roleOk = hasRole(requiredRole) || storageRoleOk;
    if (!roleOk) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Patient Routes */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute requiredRole="ROLE_PATIENT">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute requiredRole="ROLE_PATIENT">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/chat"
        element={
          <ProtectedRoute requiredRole="ROLE_PATIENT">
            <PatientDashboard initialSection="chat" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/reports"
        element={
          <ProtectedRoute requiredRole="ROLE_PATIENT">
            <PatientDashboard initialSection="reports" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute requiredRole="ROLE_PATIENT">
            <PatientDashboard initialSection="profile" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/suite"
        element={
          <ProtectedRoute requiredRole="ROLE_PATIENT">
            <PatientDashboard initialSection="suite" />
          </ProtectedRoute>
        }
      />
      
      {/* Doctor Routes */}
      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute requiredRole="ROLE_DOCTOR">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ROLE_ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="ROLE_ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Fallback */}
      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
            <p className="text-gray-500 mb-4">You don't have permission to view this page.</p>
            <a href="/login" className="text-blue-600 underline">Back to Login</a>
          </div>
        </div>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
