import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ShieldCheck,
  Search,
  UserCheck,
  UserX,
  Phone,
  Calendar,
} from 'lucide-react';

export const AdminUsersPage = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers();
      if (res.data?.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load user list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await adminApi.updateUserStatus(id, status);
      if (res.data?.success) {
        toast.success(`User status updated to ${status}`);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System User Directory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Super Administrator console for user accounts, permissions, and security status.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
          {users.length} Registered Users
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner text="Retrieving users..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">User Name</th>
                  <th className="py-3.5 px-4">Mobile Number</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-6 text-right">Security Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{u.full_name}</td>
                    <td className="py-4 px-4 font-mono font-semibold text-slate-700">+91 {u.mobile_number}</td>
                    <td className="py-4 px-4">
                      <span className="capitalize font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={u.status === 'active' ? 'success' : u.status === 'suspended' ? 'danger' : 'warning'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5">
                      {u.status !== 'active' ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(u.id, 'active')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(u.id, 'suspended')}
                          className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-[11px]"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

