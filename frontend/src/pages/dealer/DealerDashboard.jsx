import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toolbankApi } from '../../api/toolbank.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import {
  Wrench,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const DealerDashboard = () => {
  const { user, profile } = useAuth();
  const toast = useToast();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status update modal
  const [selectedRes, setSelectedRes] = useState(null);
  const [targetStatus, setTargetStatus] = useState('approved');
  const [dealerNotes, setDealerNotes] = useState('');
  const [condition, setCondition] = useState('good');
  const [updating, setUpdating] = useState(false);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await toolbankApi.getDealerReservations();
      if (res.data?.success) {
        setReservations(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load dealer reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const openActionModal = (res, status) => {
    setSelectedRes(res);
    setTargetStatus(status);
    setDealerNotes('');
    setCondition('good');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedRes) return;

    try {
      setUpdating(true);
      const res = await toolbankApi.updateReservationStatus(selectedRes.id, {
        reservation_status: targetStatus,
        dealer_notes: dealerNotes || null,
        equipment_condition_on_return: targetStatus === 'returned' ? condition : undefined,
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Reservation marked as ${targetStatus}`);
        setSelectedRes(null);
        fetchReservations();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update reservation.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving dealer operations..." />;
  }

  const pending = reservations.filter((r) => r.reservation_status === 'pending');
  const approved = reservations.filter((r) => r.reservation_status === 'approved');
  const collected = reservations.filter((r) => r.reservation_status === 'collected');
  const returned = reservations.filter((r) => r.reservation_status === 'returned');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Building2 className="w-4 h-4" />
              <span>Authorized Eurogrip Dealership</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {profile?.dealer_name || user?.full_name || 'Dealer Command Desk'}
            </h1>
            <p className="mt-1 text-slate-300 text-sm max-w-xl">
              Manage ToolBank machinery reservations, verify mechanic loan pickups, and track returned shop equipment.
            </p>
          </div>

          <div className="text-right bg-white/10 p-3.5 rounded-2xl border border-white/10 text-xs">
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">REGION</span>
            <span className="font-bold text-white text-sm">{profile?.assigned_region || 'West Region'}</span>
            <span className="text-emerald-400 block text-[11px] font-semibold mt-0.5">Verified Depot</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Requests" value={pending.length} subtitle="Requires approval" color="amber" />
        <StatCard title="Ready for Collection" value={approved.length} subtitle="Approved for pickup" color="blue" />
        <StatCard title="Currently on Loan" value={collected.length} subtitle="Equipments in field" color="purple" />
        <StatCard title="Completed Returns" value={returned.length} subtitle="Equipment returned" color="emerald" />
      </div>

      {/* Pending Reservations Immediate Actions */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Active Loan Queue</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              ToolBank machinery requests from certified local mechanics
            </p>
          </div>
          <Link to="/dealer/reservations" className="text-xs font-bold text-eurogrip-700 hover:underline">
            Full History ({reservations.length})
          </Link>
        </div>

        {reservations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No active equipment reservations logged currently.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Mechanic & Shop</th>
                  <th className="py-3.5 px-4">Equipment Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.slice(0, 8).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{r.mechanic_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {r.shop_name} ({r.ustaad_id || 'UE-MH'})
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">+91 {r.mechanic_mobile}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800">{r.item_name}</td>
                    <td className="py-4 px-4 text-slate-500 capitalize">{r.category?.replace('_', ' ')}</td>
                    <td className="py-4 px-4 text-slate-600">
                      {new Date(r.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          r.reservation_status === 'collected'
                            ? 'success'
                            : r.reservation_status === 'approved'
                            ? 'primary'
                            : r.reservation_status === 'returned'
                            ? 'neutral'
                            : 'warning'
                        }
                      >
                        {r.reservation_status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5">
                      {r.reservation_status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => openActionModal(r, 'approved')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal(r, 'rejected')}
                            className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-[11px]"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {r.reservation_status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => openActionModal(r, 'collected')}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]"
                        >
                          Mark Collected
                        </button>
                      )}

                      {r.reservation_status === 'collected' && (
                        <button
                          type="button"
                          onClick={() => openActionModal(r, 'returned')}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px]"
                        >
                          Mark Returned
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

      {/* Action Dialog Modal */}
      {selectedRes && (
        <Modal
          isOpen={!!selectedRes}
          onClose={() => setSelectedRes(null)}
          title={`Update Status: ${targetStatus.toUpperCase()}`}
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 space-y-1.5">
              <p>
                <strong>Equipment:</strong> {selectedRes.item_name}
              </p>
              <p>
                <strong>Mechanic:</strong> {selectedRes.mechanic_name} ({selectedRes.shop_name})
              </p>
            </div>

            {targetStatus === 'returned' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Equipment Condition on Return</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="excellent">Excellent Condition</option>
                  <option value="good">Good Condition</option>
                  <option value="fair">Fair (Normal Wear)</option>
                  <option value="damaged">Damaged / Needs Service</option>
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dealer Remarks / Inspection Notes</label>
              <textarea
                rows={3}
                placeholder="e.g. Serial checked, accessories complete..."
                value={dealerNotes}
                onChange={(e) => setDealerNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedRes(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-5 py-2 rounded-xl shadow-xs disabled:opacity-50"
              >
                {updating ? 'Updating...' : `Confirm ${targetStatus}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

