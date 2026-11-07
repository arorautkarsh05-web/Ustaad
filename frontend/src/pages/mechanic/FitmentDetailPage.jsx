import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fitmentApi } from '../../api/fitment.api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { QRCodeSVG } from 'qrcode.react';
import {
  FileCheck2,
  ArrowLeft,
  Disc,
  Car,
  Calendar,
  Upload,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
} from 'lucide-react';

export const FitmentDetailPage = () => {
  const { passportId } = useParams();
  const toast = useToast();

  const [fitment, setFitment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Evidence upload
  const [evidenceType, setEvidenceType] = useState('invoice');
  const [evidenceRef, setEvidenceRef] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resending, setResending] = useState(false);

  const fetchFitment = async () => {
    try {
      setLoading(true);
      const res = await fitmentApi.getFitment(passportId);
      if (res.data?.success) {
        setFitment(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load fitment details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFitment();
  }, [passportId]);

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select an invoice or tyre serial photo to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('evidence_type', evidenceType);
      if (evidenceRef) formData.append('evidence_reference', evidenceRef);

      const res = await fitmentApi.uploadEvidence(passportId, formData);
      if (res.data?.success) {
        toast.success('Evidence uploaded successfully!');
        setSelectedFile(null);
        setEvidenceRef('');
        fetchFitment();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload evidence.');
    } finally {
      setUploading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResending(true);
      const res = await fitmentApi.resendCustomerOtp(passportId);
      if (res.data?.success) {
        toast.success('Customer confirmation OTP resent successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend customer OTP.');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving fitment passport..." />;
  }

  if (!fitment) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Fitment passport not found.</p>
        <Link to="/fitments" className="mt-4 inline-block text-xs font-bold text-eurogrip-700">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/fitments"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back to Fitment Passports</span>
        </Link>

        <Link
          to={`/passport/${fitment.passport_id}`}
          target="_blank"
          className="inline-flex items-center text-xs font-bold text-eurogrip-700 hover:underline"
        >
          <span>Open Customer View</span>
          <ExternalLink className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Passport Identification
            </span>
            <h1 className="text-2xl font-black font-mono text-slate-900 tracking-tight">{fitment.passport_id}</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Badge
              variant={
                fitment.verification_status === 'verified'
                  ? 'success'
                  : fitment.verification_status === 'customer_confirmed'
                  ? 'primary'
                  : fitment.verification_status === 'evidence_submitted'
                  ? 'purple'
                  : 'warning'
              }
            >
              {fitment.verification_status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Specifications */}
          <div className="md:col-span-2 space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
                <Disc className="w-3.5 h-3.5 mr-1 text-eurogrip-700" />
                <span>Tyre Specifications</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Brand</span>
                  <span className="font-bold text-slate-900 text-sm">{fitment.tyre_brand}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Model / Pattern</span>
                  <span className="font-bold text-slate-900">{fitment.tyre_model || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Size</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{fitment.tyre_size}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Axle</span>
                  <span className="font-bold text-slate-900 capitalize">{fitment.axle_position}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
                <Car className="w-3.5 h-3.5 mr-1 text-eurogrip-700" />
                <span>Vehicle & Customer Particulars</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Vehicle</span>
                  <span className="font-bold text-slate-900">
                    {fitment.vehicle_model} ({fitment.vehicle_category})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Installation Date</span>
                  <span className="font-bold text-slate-900">
                    {new Date(fitment.installation_date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Customer Name</span>
                  <span className="font-bold text-slate-900">{fitment.customer_name || 'Walk-in'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mobile</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {fitment.customer_mobile ? `+91 ${fitment.customer_mobile}` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Confirmation Action */}
            {fitment.verification_status === 'submitted' && fitment.customer_mobile && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 block">Customer confirmation pending</span>
                  <span className="text-amber-700 text-[11px]">
                    Customer has not entered their OTP to confirm tyre fitment yet.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center space-x-1"
                >
                  <Send className="w-3 h-3" />
                  <span>{resending ? 'Sending...' : 'Resend OTP'}</span>
                </button>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
            <QRCodeSVG value={`${window.location.origin}/passport/${fitment.passport_id}`} size={140} level="M" />
            <span className="mt-3 font-mono text-xs font-bold text-slate-800">{fitment.passport_id}</span>
            <p className="mt-1 text-[11px] text-slate-400 max-w-xs">
              Vehicle owner can scan anytime to verify installation status.
            </p>
          </div>
        </div>
      </div>

      {/* Supporting Evidence Upload & List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center">
            <Upload className="w-4 h-4 mr-2 text-eurogrip-700" />
            <span>Fitment Supporting Evidence (Level 2 Verification)</span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Upload dealer tax invoice, warranty registration slip, or tyre barcode photo to upgrade verification status.
          </p>
        </div>

        {/* Existing Evidence List */}
        {fitment.evidence && fitment.evidence.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 block">Uploaded Evidence Files:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fitment.evidence.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-eurogrip-700 flex-shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-slate-800 capitalize truncate">{ev.evidence_type.replace('_', ' ')}</p>
                      <p className="text-[10px] text-slate-400">{ev.evidence_reference || 'Supporting document'}</p>
                    </div>
                  </div>
                  <Badge variant={ev.review_status === 'approved' ? 'success' : 'warning'}>
                    {ev.review_status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleUploadEvidence} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Evidence Type</label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="invoice">Dealer Invoice / Bill</option>
                <option value="photo">Installed Tyre Photo</option>
                <option value="serial_number">Tyre Barcode / Serial</option>
                <option value="dealer_confirmation">Dealer Stamp Document</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Document Reference / Notes</label>
              <input
                type="text"
                placeholder="e.g. Bill #8901"
                value={evidenceRef}
                onChange={(e) => setEvidenceRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
              </input>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">File (JPEG, PNG, PDF up to 5MB)</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full px-2 py-1.5 text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-eurogrip-50 file:text-eurogrip-700 hover:file:bg-eurogrip-100 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="inline-flex items-center space-x-1.5 bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading...' : 'Submit Evidence'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

