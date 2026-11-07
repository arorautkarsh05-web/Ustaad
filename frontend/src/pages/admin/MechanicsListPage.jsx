import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Coins,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const MechanicsListPage = () => {
  const toast = useToast();
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filters
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  // Credit adjustment modal
  const [creditModalMechanic, setCreditModalMechanic] = useState(null);
  const [creditAmount, setCreditAmount] = useState(25);
  const [txType, setTxType] = useState('earned');
  const [creditReason, setCreditReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchMechanics = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getMechanics({
        page,
        limit,
        search: search || undefined,
        state: stateFilter || undefined,
        verification_status: statusFilter || undefined,
        level: levelFilter || undefined,
      });

      if (res.data?.success) {
        setMechanics(res.data.data);
        setTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      toast.error('Failed to load mechanics directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanics();
  }, [page, stateFilter, statusFilter, levelFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMechanics();
  };

  const handleVerify = async (id, newStatus) => {
    try {
      const res = await adminApi.verifyMechanic(id, newStatus);
      if (res.data?.success) {
        toast.success(`Mechanic marked as ${newStatus}`);
        fetchMechanics();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification update failed.');
    }
  };

  const handleAdjustCredits = async (e) => {
    e.preventDefault();
    if (!creditModalMechanic) return;

    try {
      setAdjusting(true);
      const res = await adminApi.adjustCredits(creditModalMechanic.id, {
        credit_amount: parseInt(creditAmount, 10),
        transaction_type: txType,
        description: creditReason || 'Administrative balance adjustment',
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Credits adjusted successfully!');
        setCreditModalMechanic(null);
        fetchMechanics();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust credits.');
    } finally {
      setAdjusting(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mechanic Directory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Verify garage credentials, inspect stocking status, and adjust reward credit ledgers.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
          {total} Registered Mechanics
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto" />
            <input
              type="text"
              placeholder="Search by name, shop, mobile, or Ustaad ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-eurogrip-700 bg-slate-50"
            />
          </div>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
        >
          <option value="">All Verification</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={levelFilter}
          onChange={(e) => {
            setLevelFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
        >
          <option value="">All Tiers</option>
          <option value="beginner">Beginner</option>
          <option value="professional">Professional</option>
          <option value="champion">Champion</option>
        </select>
      </div>

      {/* Mechanics Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner text="Retrieving mechanics directory..." />
          </div>
        ) : mechanics.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No Mechanics Found"
              description="No registered mechanics match your search or filter criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Ustaad ID & Name</th>
                  <th className="py-3.5 px-4">Workshop & Location</th>
                  <th className="py-3.5 px-4">Stocking Status</th>
                  <th className="py-3.5 px-4">Level Tier</th>
                  <th className="py-3.5 px-4">Credits</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mechanics.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-xs text-slate-900 block">{m.ustaad_id}</span>
                      <span className="font-semibold text-slate-800 text-sm">{m.full_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono block">+91 {m.mobile_number}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-900 block">{m.shop_name}</span>
                      <span className="text-slate-500 text-[11px]">
                        {m.city}, {m.state} ({m.pincode})
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={m.stocking_status === 'stocks_eurogrip' ? 'success' : 'neutral'}>
                        {m.stocking_status?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={m.level === 'champion' ? 'gold' : m.level === 'professional' ? 'primary' : 'neutral'}>
                        {m.level}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 font-mono font-black text-amber-600">
                      {m.total_credits || 0} pts
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={m.verification_status === 'verified' ? 'success' : 'warning'}>
                        {m.verification_status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      {m.verification_status !== 'verified' ? (
                        <button
                          type="button"
                          onClick={() => handleVerify(m.id, 'verified')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                        >
                          Verify
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVerify(m.id, 'rejected')}
                          className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-[11px]"
                        >
                          Revoke
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setCreditModalMechanic(m)}
                        className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px]"
                      >
                        Adjust Credits
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} mechanics
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Credit Adjustment Modal */}
      {creditModalMechanic && (
        <Modal
          isOpen={!!creditModalMechanic}
          onClose={() => setCreditModalMechanic(null)}
          title={`Adjust Credits for ${creditModalMechanic.full_name}`}
        >
          <form onSubmit={handleAdjustCredits} className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 space-y-1">
              <p>
                <strong>Ustaad ID:</strong> {creditModalMechanic.ustaad_id}
              </p>
              <p>
                <strong>Current Balance:</strong> {creditModalMechanic.total_credits || 0} pts
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Type</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="earned">Credit Points (+)</option>
                  <option value="redeemed">Debit Points (-)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Point Amount</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason / Reference</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Workshop participation bonus, special promotional incentive..."
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setCreditModalMechanic(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjusting}
                className="bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-5 py-2 rounded-xl shadow-xs disabled:opacity-50"
              >
                {adjusting ? 'Saving...' : 'Confirm Balance Adjustment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

