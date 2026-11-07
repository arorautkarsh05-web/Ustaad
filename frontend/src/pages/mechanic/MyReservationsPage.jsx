import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toolbankApi } from '../../api/toolbank.api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Wrench,
  ArrowLeft,
  Calendar,
  XCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
} from 'lucide-react';

export const MyReservationsPage = () => {
  const toast = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await toolbankApi.getMyReservations();
      if (res.data?.success) {
        setReservations(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load your reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this equipment reservation?')) return;

    try {
      const res = await toolbankApi.cancelReservation(id);
      if (res.data?.success) {
        toast.success('Reservation cancelled successfully');
        fetchReservations();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/toolbank"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back to Equipment Catalog</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">My ToolBank Reservations</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Track status of borrowed workshop machinery, collection schedules, and return dates.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
            {reservations.length} Total Loans
          </span>
        </div>

        {loading ? (
          <div className="p-12">
            <LoadingSpinner text="Retrieving loan history..." />
          </div>
        ) : reservations.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Wrench}
              title="No Reservations Yet"
              description="Browse the ToolBank catalog and reserve digital pressure gauges and tyre equipment for your shop."
              action={
                <Link
                  to="/toolbank"
                  className="inline-flex items-center space-x-1.5 bg-eurogrip-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  <span>Browse Equipment</span>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Equipment</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Assigned Dealer</th>
                  <th className="py-3.5 px-4">Reservation Date</th>
                  <th className="py-3.5 px-4">Expected Return</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((r) => {
                  const canCancel = ['pending', 'approved'].includes(r.reservation_status);
                  const statusVariant =
                    r.reservation_status === 'collected'
                      ? 'success'
                      : r.reservation_status === 'approved'
                      ? 'primary'
                      : r.reservation_status === 'returned'
                      ? 'neutral'
                      : r.reservation_status === 'cancelled' || r.reservation_status === 'rejected'
                      ? 'danger'
                      : 'warning';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">{r.item_name}</td>
                      <td className="py-4 px-4 text-slate-500 capitalize">{r.category?.replace('_', ' ')}</td>
                      <td className="py-4 px-4 text-slate-700 font-medium">
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.dealer_name || 'Regional Depot'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {new Date(r.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {r.expected_return_date
                          ? new Date(r.expected_return_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Indefinite'}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={statusVariant}>{r.reservation_status}</Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancel(r.id)}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-[11px] transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

