import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth.api';
import { ShieldCheck, ArrowRight, RotateCw, AlertCircle, ArrowLeft } from 'lucide-react';

export const VerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, getDashboardPath } = useAuth();
  const toast = useToast();

  const state = location.state || {};
  const { mobile_number, purpose = 'login', full_name, role = 'mechanic' } = state;
  const [currentDevOtp, setCurrentDevOtp] = useState(state.devOtp || null);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!mobile_number) {
      navigate('/login', { replace: true });
    }
  }, [mobile_number, navigate]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    let timer = null;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleInputChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await authApi.verifyOtp({
        mobile_number,
        otp: fullOtp,
        purpose,
        full_name,
        role,
      });

      if (res.data?.success && res.data.data) {
        toast.success(res.data.message || 'Login successful!');
        login(res.data.data);
        const destination = getDashboardPath(res.data.data.user.role);
        navigate(destination, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP code. Please verify and try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setErrorMessage('');
    try {
      const res = await authApi.sendOtp({ mobile_number, purpose });
      toast.success('A new OTP has been sent to your mobile.');
      if (res.data?.devOtp) {
        setCurrentDevOtp(res.data.devOtp);
      }
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/login" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to mobile entry</span>
        </Link>
        <div className="w-12 h-12 bg-eurogrip-100 text-eurogrip-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-eurogrip-200">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verify Security Code</h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Enter the 6-digit verification code sent to <br />
          <span className="font-mono font-bold text-slate-900">+91 {mobile_number}</span>
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

          {currentDevOtp && (
            <div className="mb-5 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <span className="text-base">📱</span>
                <span className="truncate">
                  SMS Code: <strong className="font-mono text-sm tracking-wider font-black text-eurogrip-700">{currentDevOtp}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOtp(currentDevOtp.split(''));
                  inputRefs.current[5]?.focus();
                }}
                className="px-2.5 py-1 rounded-lg bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold text-[11px] shadow-2xs ml-2 flex-shrink-0"
              >
                Auto-fill
              </button>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            {/* 6 Digit Input Boxes */}
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 focus:border-eurogrip-700 bg-slate-50 transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full flex items-center justify-center space-x-2 bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Resend Actions */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Didn't receive code?</span>
            {countdown > 0 ? (
              <span className="text-slate-400 font-medium">Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-bold text-eurogrip-700 hover:underline flex items-center space-x-1"
              >
                <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>Resend OTP</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

