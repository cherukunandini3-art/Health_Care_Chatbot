import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { FaHeartbeat, FaUser, FaSignOutAlt, FaFileAlt, FaComments } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaHeartbeat className="text-3xl text-primary-600" />
          <h1 className="text-xl font-bold text-gray-800">Healthcare Assistant</h1>
        </div>

        <div className="flex items-center gap-6">
          {user?.roles?.includes('ROLE_PATIENT') && (
            <>
              <Link
                to="/patient/chat"
                className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <FaComments />
                <span>Chat</span>
              </Link>
              <Link
                to="/patient/reports"
                className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <FaFileAlt />
                <span>Reports</span>
              </Link>
              <Link
                to="/patient/profile"
                className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <FaUser />
                <span>Profile</span>
              </Link>
            </>
          )}

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user?.username}</p>
              <p className="text-xs text-gray-500">
                {user?.roles?.join(', ').replace(/ROLE_/g, '')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <FaSignOutAlt size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
