import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fitmentApi } from '../../api/fitment.api';
import { useToast } from '../../context/ToastContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Car,
  Disc,
  Wrench,
  AlertCircle,
  FileCheck2,
  Send,
  Loader2,
  MapPin,
  Clock,
  ArrowRight,
  Search,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const CustomerPassportPage = () => {
  const { passportId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [fitment, setFitment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchId, setSearchId] = useState('');

  // Customer Confirmation state
  const [customerMobile, setCustomerMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const fetchFitment = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fitmentApi.getFitment(passportId);
      if (res.data?.success) {
        setFitment(res.data.data);
        if (res.data.data.customer_mobile) {
          setCustomerMobile(res.data.data.customer_mobile);
        }
      } else {
        setError(res.data?.message || 'Fitment passport not found.');
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg === 'Authentication required') {
        // If an old token caused 401, inform gracefully
        setError('This fitment record requires authorization or does not exist.');
      } else {
        setError(msg || 'Fitment passport record not found in national registry.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (passportId) {
      fetchFitment();
    }
  }, [passportId]);

  const handleSendOtp = async () => {
    if (!customerMobile || !/^[6-9]\d{9}$/.test(customerMobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setConfirming(true);
      await fitmentApi.resendCustomerOtp(passportId);
      setOtpSent(true);
      toast.success('Confirmation OTP dispatched to registered mobile number!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch OTP.');
    } finally {
      setConfirming(false);
    }
  };

  const handleConfirmPassport = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit confirmation OTP');
      return;
    }

    try {
      setConfirming(true);
      const res = await fitmentApi.verifyCustomerOtp({
        passport_id: passportId,
        customer_mobile: customerMobile,
        otp: otpCode,
      });

      if (res.data?.success) {
        toast.success('Tyre fitment confirmed! Manufacturer warranty is now active.');
        fetchFitment();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired confirmation code.');
    } finally {
      setConfirming(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/passport/${searchId.trim().toUpperCase()}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-eurogrip-400 mb-4" />
        <p className="text-sm font-medium tracking-wide">Validating Digital Fitment Passport with TVS Eurogrip Registry...</p>
      </div>
    );
  }

  if (error || !fitment) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
        {/* Header */}
        <header className="max-w-xl mx-auto w-full pt-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-eurogrip-700 flex items-center justify-center font-black text-white text-base shadow-sm">
              EG
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-white uppercase block leading-tight">
                EUROGRIP
              </span>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block leading-tight">
                USTAAD NETWORK
              </span>
            </div>
          </Link>
          <Link
            to="/login"
            className="text-xs font-bold text-eurogrip-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
          >
            Portal Login
          </Link>
        </header>

        {/* Error Body */}
        <div className="max-w-xl mx-auto w-full py-12 text-center">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Passport Not Found</h2>
          <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {error || 'No registered tyre installation record corresponds to this passport identifier.'}
          </p>

          {/* Quick Search */}
          <form onSubmit={handleManualSearch} className="mt-8 max-w-sm mx-auto flex gap-2">
            <input
              type="text"
              placeholder="e.g. FP-2024-001"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-eurogrip-500"
            />
            <button
              type="submit"
              className="bg-eurogrip-700 hover:bg-eurogrip-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Verify</span>
            </button>
          </form>

          {/* Sample Passport Link */}
          <div className="mt-6">
            <Link
              to="/passport/FP-2024-001"
              className="inline-flex items-center space-x-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>View Verified Sample Record (FP-2024-001)</span>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-900">
            <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              ← Return to Eurogrip Network Home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="max-w-xl mx-auto w-full text-center text-xs text-slate-600 pb-4">
          Eurogrip Certified Tyre Verification Registry • Secure SSL Encrypted
        </footer>
      </div>
    );
  }

  const isConfirmed = fitment.verification_status !== 'submitted';
  const isVerified = fitment.verification_status === 'verified';
  const customerPhoneDisplay = fitment.customer_mobile_masked || (fitment.customer_mobile ? `******${fitment.customer_mobile.slice(-4)}` : 'Customer Mobile Verified');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-eurogrip-700 flex items-center justify-center font-black text-white text-base shadow-sm">
              EG
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-white uppercase block leading-tight">
                EUROGRIP
              </span>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block leading-tight">
                USTAAD NETWORK
              </span>
            </div>
          </Link>
          <Link
            to="/login"
            className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-900 transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Main Passport Card */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          {/* Passport Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 sm:p-7 border-b border-slate-800 relative">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="uppercase tracking-wider">
                  {isVerified ? 'Manufacturer Verified' : isConfirmed ? 'Customer Confirmed' : 'Awaiting OTP Confirmation'}
                </span>
              </span>

              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                {fitment.verification_level ? `Level ${fitment.verification_level} Trust` : 'Level 1 Trust'}
              </span>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Digital Fitment Passport</p>
                <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                  {fitment.passport_id}
                </h1>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Fitted on {new Date(fitment.installation_date || fitment.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </p>
              </div>

              {/* Scannable Live QR Code with Laser Animation */}
              <div className="relative bg-white p-2.5 rounded-2xl shadow-lg border-2 border-slate-700/80 overflow-hidden flex-shrink-0">
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-scan-beam pointer-events-none" />
                <QRCodeSVG value={window.location.href} size={76} level="M" />
              </div>
            </div>
          </div>

          {/* Customer Confirmation Action Card (If not confirmed yet) */}
          {!isConfirmed && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 p-5 sm:p-6">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white">Customer Confirmation Required</h3>
                  <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
                    Verify this tyre installation to activate official manufacturer warranty tracking and ensure zero counterfeit disputes.
                  </p>
                </div>
              </div>

              {!otpSent ? (
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <input
                    type="tel"
                    placeholder="Enter registered mobile"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-950 font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={confirming}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
                  >
                    {confirming ? 'Dispatching...' : 'Send SMS OTP'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConfirmPassport} className="mt-4 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-950 font-mono text-center tracking-widest font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="submit"
                    disabled={confirming}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
                  >
                    {confirming ? 'Validating...' : 'Verify OTP'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Specifications & Fitment Body */}
          <div className="p-6 sm:p-7 space-y-6">
            {/* Tyre Specs Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                <Disc className="w-3.5 h-3.5 mr-1.5 text-eurogrip-400" />
                <span>Installed Tyre Specification</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Tyre Brand</span>
                  <span className="font-bold text-white text-sm">{fitment.tyre_brand}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Pattern / Model</span>
                  <span className="font-bold text-amber-400 text-sm">{fitment.tyre_model || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Tyre Size</span>
                  <span className="font-bold text-white font-mono text-sm">{fitment.tyre_size}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Axle Placement</span>
                  <span className="font-bold text-white capitalize text-sm">{fitment.axle_position}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Info Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                <Car className="w-3.5 h-3.5 mr-1.5 text-eurogrip-400" />
                <span>Vehicle Details</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Vehicle Category</span>
                  <span className="font-bold text-white capitalize">{fitment.vehicle_category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Vehicle Model</span>
                  <span className="font-bold text-white">{fitment.vehicle_model || 'Standard Two-Wheeler'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Customer Name</span>
                  <span className="font-bold text-white">{fitment.customer_name || 'Vehicle Owner'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Customer Mobile</span>
                  <span className="font-bold text-slate-300 font-mono">
                    {customerPhoneDisplay}
                  </span>
                </div>
              </div>
            </div>

            {/* Installer Workshop Details */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                <Wrench className="w-3.5 h-3.5 mr-1.5 text-eurogrip-400" />
                <span>Certified Installation Workshop</span>
              </h3>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 text-xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{fitment.shop_name || 'Authorized Ustaad Garage'}</h4>
                  <p className="text-slate-400 text-xs mt-0.5">Certified Technician: {fitment.mechanic_name || 'Master Ustaad'}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                    <span className="text-amber-400 font-mono font-bold">
                      ID: {fitment.ustaad_id || 'UE-MH-00001'}
                    </span>
                    {fitment.shop_location && (
                      <span className="text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{fitment.shop_location}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-eurogrip-500/10 border border-eurogrip-500/30 text-eurogrip-400 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Safety & Maintenance Guidelines */}
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-1.5">
              <span className="font-bold text-blue-300 block">TVS Eurogrip Manufacturer Care Protocol:</span>
              <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
                <li>Verify cold inflation pressure fortnightly according to OEM specifications.</li>
                <li>Monitor Tread Wear Indicator (TWI) markers before long-distance highway travel.</li>
                <li>Ensure metallic or rubber valve caps are firmly seated to prevent dust ingress.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Link Back */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            ← Return to Eurogrip Ustaad Network
          </Link>
        </div>
      </div>
    </div>
  );
};


