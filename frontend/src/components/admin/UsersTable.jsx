import React, { useState, useMemo } from 'react';
import { adminAPI } from '../../services/api';
import {
  FaSearch, FaTrash, FaToggleOn, FaToggleOff,
  FaUserMd, FaUserInjured, FaShieldAlt, FaChevronLeft,
  FaChevronRight, FaUserPlus, FaTimes, FaCheck,
} from 'react-icons/fa';

const ROLE_COLORS = {
  ROLE_ADMIN:   { label: 'Admin',   bg: 'bg-red-100',    text: 'text-red-700',    icon: FaShieldAlt },
  ROLE_DOCTOR:  { label: 'Doctor',  bg: 'bg-violet-100', text: 'text-violet-700', icon: FaUserMd },
  ROLE_PATIENT: { label: 'Patient', bg: 'bg-blue-100',   text: 'text-blue-700',   icon: FaUserInjured },
};

const PAGE_SIZE = 10;

// Normalize role: could be a string "ROLE_ADMIN" or an object {id, name}
const getRoleName = (role) => (typeof role === 'string' ? role : role?.name);

const RoleBadge = ({ roles = [] }) => {
  const primary = getRoleName(roles[0]);
  if (!primary) return <span className="text-gray-300">—</span>;
  const cfg = ROLE_COLORS[primary] || { label: primary, bg: 'bg-gray-100', text: 'text-gray-700', icon: null };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {Icon && <Icon className="text-[10px]" />}
      {cfg.label}
    </span>
  );
};

const UsersTable = ({ users, onRefresh }) => {
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('ALL');
  const [page, setPage]                 = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Create Doctor modal
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [doctorForm, setDoctorForm]   = useState({ username: '', email: '', password: '', fullName: '', phoneNumber: '' });
  const [doctorMsg, setDoctorMsg]     = useState(null);
  const [doctorLoading, setDoctorLoading] = useState(false);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== 'ALL') {
      list = list.filter(u => u.roles?.some(r => getRoleName(r) === roleFilter));
    }
    const q = search.toLowerCase();
    if (q) {
      list = list.filter(u =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleToggle = async (userId) => {
    setActionLoading(userId + '-toggle');
    try {
      await adminAPI.toggleUserStatus(userId);
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete + '-delete');
    try {
      await adminAPI.deleteUser(confirmDelete);
      setConfirmDelete(null);
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setDoctorLoading(true);
    setDoctorMsg(null);
    try {
      const res = await adminAPI.createDoctor(doctorForm);
      if (res.data.success) {
        setDoctorMsg({ type: 'success', text: 'Doctor account created!' });
        setDoctorForm({ username: '', email: '', password: '', fullName: '', phoneNumber: '' });
        onRefresh();
      }
    } catch (err) {
      setDoctorMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create doctor' });
    } finally {
      setDoctorLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, username, email…"
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-64"
            />
          </div>
          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="ALL">All Roles</option>
            <option value="ROLE_ADMIN">Admin</option>
            <option value="ROLE_DOCTOR">Doctor</option>
            <option value="ROLE_PATIENT">Patient</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreateDoctor(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FaUserPlus />
          Add Doctor
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Name', 'Username', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">No users found</td>
                </tr>
              ) : pageData.map(user => {
                const isActive       = user.isActive ?? user.active;
                const isDeleting     = actionLoading === user.id + '-delete';
                const isToggling     = actionLoading === user.id + '-toggle';
                return (
                  <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(user.fullName || user.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[140px]">{user.fullName || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{user.username}</td>
                    <td className="px-5 py-3.5 text-gray-500 truncate max-w-[180px]">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <RoleBadge roles={user.roles} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(user.id)}
                          disabled={!!isToggling}
                          title={isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-green-500 hover:bg-green-50'
                          } disabled:opacity-40`}
                        >
                          {isToggling ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                          ) : isActive ? <FaToggleOn className="text-xl" /> : <FaToggleOff className="text-xl" />}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(user.id)}
                          disabled={!!isDeleting}
                          title="Delete user"
                          className="p-1.5 rounded-lg text-sm text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
          <p className="text-xs text-gray-400">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FaChevronLeft className="text-xs text-gray-500" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…'
                  ? <span key={`e${i}`} className="text-gray-300 text-xs px-1">…</span>
                  : (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium ${p === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                      {p}
                    </button>
                  )
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FaChevronRight className="text-xs text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-5">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <FaTrash className="text-red-500 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Delete User</h3>
              <p className="text-sm text-gray-500 mt-1">This action is permanent. All data will be lost.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                {actionLoading === confirmDelete + '-delete'
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <FaCheck />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Doctor Modal */}
      {showCreateDoctor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaUserMd className="text-violet-500" />
                Create Doctor Account
              </h3>
              <button onClick={() => { setShowCreateDoctor(false); setDoctorMsg(null); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <FaTimes className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreateDoctor} className="space-y-3">
              {[
                { name: 'fullName',    label: 'Full Name',     placeholder: 'Dr. Jane Smith', type: 'text' },
                { name: 'username',    label: 'Username',      placeholder: 'dr_jane', type: 'text' },
                { name: 'email',       label: 'Email',         placeholder: 'jane@clinic.com', type: 'email' },
                { name: 'phoneNumber', label: 'Phone Number',  placeholder: '+1-234-567-8901', type: 'text' },
                { name: 'password',    label: 'Password',      placeholder: '••••••••', type: 'password' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input
                    type={f.type} required placeholder={f.placeholder}
                    value={doctorForm[f.name]}
                    onChange={e => setDoctorForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
              ))}
              {doctorMsg && (
                <p className={`text-xs px-3 py-2 rounded-lg ${doctorMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {doctorMsg.text}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowCreateDoctor(false); setDoctorMsg(null); }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={doctorLoading}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 flex items-center justify-center gap-2 disabled:opacity-60">
                  {doctorLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaCheck />}
                  Create Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;
