import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth.api';
import { Phone, ArrowRight, ShieldCheck, UserCheck, Wrench, Sparkles, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, getDashboardPath } = useAuth();
  const toast = useToast();

  const [mobileNumber, setMobileNumber] = useState(searchParams.get('mobile') || '');
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || 'mechanic');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDashboardPath(), { replace: true });
    }
  }, [isAuthenticated, navigate, getDashboardPath]);

  const hasShownExpired = React.useRef(false);

  useEffect(() => {
    if (searchParams.get('expired') && !hasShownExpired.current) {
      hasShownExpired.current = true;
      toast.warning('Your session has expired. Please log in again.');
      // Remove query param cleanly from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }

    if (isRegistering && !fullName.trim()) {
      setErrorMessage('Full name is required for registration.');
      return;
    }

    setLoading(true);
    try {
      const purpose = isRegistering ? 'registration' : 'login';
      const res = await authApi.sendOtp({ mobile_number: mobileNumber, purpose });

      if (res.data?.success) {
        toast.success(res.data.devOtp ? `OTP Sent! Code: ${res.data.devOtp}` : 'OTP sent successfully!');
        navigate('/verify-otp', {
          state: {
            mobile_number: mobileNumber,
            purpose,
            full_name: fullName.trim() || undefined,
            role: selectedRole,
            devOtp: res.data.devOtp,
          },
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please check your network and try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (mobile, role) => {
    setMobileNumber(mobile);
    setSelectedRole(role);
    setIsRegistering(false);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-eurogrip-700 flex items-center justify-center font-black text-white text-lg shadow-sm">
            EG
          </div>
          <div className="text-left">
            <span className="text-base font-black tracking-wider text-slate-900 uppercase block leading-tight">
              EUROGRIP
            </span>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest block leading-tight">
              USTAAD NETWORK
            </span>
          </div>
        </Link>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {isRegistering ? 'Create Your Ustaad Account' : 'Sign in to Ustaad Network'}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Secure, OTP-authenticated access for mechanics, dealers, and staff
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-3xl shadow-xl border border-slate-200/80">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name / Workshop Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 focus:border-eurogrip-700 text-sm font-medium transition-all"
                />
              </div>
            )}

            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('mechanic')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      selectedRole === 'mechanic'
                        ? 'bg-eurogrip-50 border-eurogrip-700 text-eurogrip-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Mechanic / Garage
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('customer')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      selectedRole === 'customer'
                        ? 'bg-eurogrip-50 border-eurogrip-700 text-eurogrip-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Vehicle Owner
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-13 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 focus:border-eurogrip-700 text-sm font-mono tracking-wider font-semibold transition-all"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">We will send a 6-digit verification code via SMS.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center space-x-2 bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Sending Code...' : 'Send Verification OTP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs">
            {isRegistering ? (
              <p className="text-slate-600">
                Already registered with Ustaad Network?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="font-bold text-eurogrip-700 hover:underline"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-slate-600">
                New mechanic joining Eurogrip?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="font-bold text-eurogrip-700 hover:underline"
                >
                  Register here
                </button>
              </p>
            )}
          </div>

          {/* One-Click Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
              Fast Demo Accounts (Click to fill)
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <button
                type="button"
                onClick={() => setDemoAccount('7777777777', 'mechanic')}
                className="p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-900 text-xs font-semibold transition-colors"
              >
                <Wrench className="w-3.5 h-3.5 mx-auto mb-1 text-eurogrip-700" />
                <span>Mechanic</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('8888888888', 'dealer')}
                className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900 text-xs font-semibold transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-700" />
                <span>Dealer</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('9999999999', 'super_admin')}
                className="p-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 text-purple-900 text-xs font-semibold transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-1 text-purple-700" />
                <span>Super Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

