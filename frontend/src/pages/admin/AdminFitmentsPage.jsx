import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FileCheck2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Disc,
  Car,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const AdminFitmentsPage = () => {
  const toast = useToast();
  const [fitments, setFitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  const fetchFitments = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getFitments({
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
        brand: brandFilter || undefined,
      });

      if (res.data?.success) {
        setFitments(res.data.data);
        setTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      toast.error('Failed to load fitment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFitments();
  }, [page, statusFilter, brandFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFitments();
  };

  const handleVerify = async (id, newStatus) => {
    try {
      const res = await adminApi.verifyFitment(id, newStatus);
      if (res.data?.success) {
        toast.success(`Fitment record marked as ${newStatus}`);
        fetchFitments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification update failed.');
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fitment Audit & Verification</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review digital tyre passports, inspect uploaded dealer invoices, and approve warranty coverage.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
          {total} Total Passports
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto" />
            <input
              type="text"
              placeholder="Search by passport ID, vehicle, or customer mobile..."
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
          <option value="">All Verification Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="customer_confirmed">Customer Confirmed</option>
          <option value="evidence_submitted">Evidence Submitted</option>
          <option value="verified">Verified Official</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={brandFilter}
          onChange={(e) => {
            setBrandFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
        >
          <option value="">All Brands</option>
          <option value="Eurogrip">Eurogrip Only</option>
          <option value="MRF">MRF</option>
          <option value="CEAT">CEAT</option>
        </select>
      </div>

      {/* Fitments Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner text="Retrieving fitment records..." />
          </div>
        ) : fitments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FileCheck2}
              title="No Fitment Records Found"
              description="No fitments match the current filter or search criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Passport ID</th>
                  <th className="py-3.5 px-4">Installation Date</th>
                  <th className="py-3.5 px-4">Mechanic & Shop</th>
                  <th className="py-3.5 px-4">Tyre Specification</th>
                  <th className="py-3.5 px-4">Vehicle Model</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fitments.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      <div className="flex items-center space-x-1.5">
                        <Disc className={`w-3.5 h-3.5 ${f.tyre_brand === 'Eurogrip' ? 'text-eurogrip-700' : 'text-slate-400'}`} />
                        <span>{f.passport_id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {new Date(f.installation_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-900 block">{f.mechanic_name}</span>
                      <span className="text-[11px] text-slate-500">{f.shop_name} ({f.ustaad_id})</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-900">{f.tyre_brand}</span>
                      <span className="text-slate-500 ml-1 font-mono">{f.tyre_size}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-medium">{f.vehicle_model}</td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          f.verification_status === 'verified'
                            ? 'success'
                            : f.verification_status === 'customer_confirmed'
                            ? 'primary'
                            : f.verification_status === 'evidence_submitted'
                            ? 'purple'
                            : 'warning'
                        }
                      >
                        {f.verification_status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      {f.verification_status !== 'verified' ? (
                        <button
                          type="button"
                          onClick={() => handleVerify(f.id, 'verified')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVerify(f.id, 'rejected')}
                          className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-[11px]"
                        >
                          Reject
                        </button>
                      )}

                      <a
                        href={`/passport/${f.passport_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[11px] inline-flex items-center"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
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
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} records
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
    </div>
  );
};

