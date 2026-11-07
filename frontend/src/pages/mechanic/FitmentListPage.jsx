import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fitmentApi } from '../../api/fitment.api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../../components/common/Modal';
import {
  FileCheck2,
  Plus,
  Search,
  Filter,
  QrCode,
  Eye,
  Calendar,
  Disc,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const FitmentListPage = () => {
  const toast = useToast();
  const [fitments, setFitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // QR Modal
  const [selectedQR, setSelectedQR] = useState(null);

  const fetchFitments = async () => {
    try {
      setLoading(true);
      const res = await fitmentApi.getMyFitments({
        page,
        limit,
        status: statusFilter || undefined,
        tyre_brand: brandFilter || undefined,
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

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fitment Passports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Digitally certified tyre installations with QR tracking and customer warranty verification.
          </p>
        </div>

        <Link
          to="/fitments/create"
          className="inline-flex items-center space-x-2 bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm text-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Fitment Record</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter By:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
        >
          <option value="">All Verification Statuses</option>
          <option value="submitted">Submitted (Pending Customer)</option>
          <option value="customer_confirmed">Customer Confirmed (Level 1)</option>
          <option value="evidence_submitted">Evidence Submitted (Level 2)</option>
          <option value="verified">Verified Official</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={brandFilter}
          onChange={(e) => {
            setBrandFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
        >
          <option value="">All Brands</option>
          <option value="Eurogrip">Eurogrip</option>
          <option value="MRF">MRF</option>
          <option value="CEAT">CEAT</option>
          <option value="Apollo">Apollo</option>
          <option value="TVS">TVS</option>
          <option value="Michelin">Michelin</option>
        </select>
      </div>

      {/* Table Container */}
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
              description="Start recording tyre installations to earn credits and provide customers with verifiable digital warranty passports."
              action={
                <Link
                  to="/fitments/create"
                  className="inline-flex items-center space-x-2 bg-eurogrip-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Fitment</span>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Passport ID</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Tyre Particulars</th>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Verification Level</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fitments.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <Disc className={`w-3.5 h-3.5 ${f.tyre_brand === 'Eurogrip' ? 'text-eurogrip-700' : 'text-slate-400'}`} />
                        <span>{f.passport_id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {new Date(f.installation_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">{f.customer_name || 'Walk-in Customer'}</div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {f.customer_mobile ? `+91 ${f.customer_mobile}` : 'No phone'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-900">{f.tyre_brand}</span>
                      <span className="text-slate-500 ml-1 font-mono">{f.tyre_size}</span>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                        {f.axle_position} axle
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {f.vehicle_model || '—'}
                      <span className="block text-[10px] text-slate-400 capitalize">{f.vehicle_category}</span>
                    </td>
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
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedQR(f)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-eurogrip-700 transition-colors inline-block"
                        title="View QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/fitments/${f.passport_id}`}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-eurogrip-700 transition-colors inline-block"
                        title="View Fitment Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
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

      {/* QR Code Inspection Modal */}
      {selectedQR && (
        <Modal isOpen={!!selectedQR} onClose={() => setSelectedQR(null)} title="Tyre Fitment Passport QR">
          <div className="text-center p-4 space-y-4">
            <p className="text-xs text-slate-500">
              Scan with any mobile camera to view or verify this digital tyre installation passport.
            </p>
            <div className="bg-slate-50 p-6 rounded-2xl inline-block border border-slate-200">
              <QRCodeSVG
                value={`${window.location.origin}/passport/${selectedQR.passport_id}`}
                size={180}
                level="H"
              />
            </div>
            <div>
              <span className="font-mono font-bold text-sm text-slate-900 block">{selectedQR.passport_id}</span>
              <span className="text-xs text-slate-500">
                {selectedQR.tyre_brand} • {selectedQR.tyre_size} ({selectedQR.customer_name || 'Customer'})
              </span>
            </div>
            <div className="pt-2">
              <Link
                to={`/passport/${selectedQR.passport_id}`}
                target="_blank"
                className="text-xs font-bold text-eurogrip-700 hover:underline inline-flex items-center"
              >
                <span>Open Public Verification Page</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

