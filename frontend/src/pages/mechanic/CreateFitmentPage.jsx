import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fitmentApi } from '../../api/fitment.api';
import { useToast } from '../../context/ToastContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  FileCheck2,
  ArrowLeft,
  CheckCircle2,
  Disc,
  Car,
  User,
  Calendar,
  Save,
  QrCode,
  Share2,
  Copy,
  Wrench,
} from 'lucide-react';

export const CreateFitmentPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [createdPassport, setCreatedPassport] = useState(null);

  // Form Fields
  const [tyreBrand, setTyreBrand] = useState('Eurogrip');
  const [tyreModel, setTyreModel] = useState('Protorq EX');
  const [tyreSize, setTyreSize] = useState('90/90-17');
  const [axlePosition, setAxlePosition] = useState('rear');
  const [vehicleCategory, setVehicleCategory] = useState('motorcycle');
  const [vehicleModel, setVehicleModel] = useState('Honda CB Shine');
  const [installationDate, setInstallationDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [dealerInvoiceRef, setDealerInvoiceRef] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tyreBrand || !tyreSize) {
      toast.error('Please enter tyre brand and size');
      return;
    }

    if (customerMobile && !/^[6-9]\d{9}$/.test(customerMobile)) {
      toast.error('Customer mobile must be a valid 10-digit number');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        tyre_brand: tyreBrand,
        tyre_model: tyreModel,
        tyre_size: tyreSize,
        axle_position: axlePosition,
        vehicle_category: vehicleCategory,
        vehicle_model: vehicleModel,
        installation_date: installationDate,
        customer_name: customerName || null,
        customer_mobile: customerMobile || null,
        dealer_invoice_ref: dealerInvoiceRef || null,
        notes: notes || null,
      };

      const res = await fitmentApi.createFitment(payload);
      if (res.data?.success && res.data.data) {
        toast.success('+5 Credits awarded! Passport created successfully.');
        setCreatedPassport(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create fitment passport.');
    } finally {
      setLoading(false);
    }
  };

  const copyCustomerLink = () => {
    if (!createdPassport) return;
    const link = `${window.location.origin}/passport/${createdPassport.passport_id}`;
    navigator.clipboard.writeText(link);
    toast.success('Customer verification link copied to clipboard!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/fitments"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back to Fitment Passports</span>
        </Link>
      </div>

      {createdPassport ? (
        /* Success Screen */
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">
              +5 REWARD CREDITS EARNED
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tyre Passport Registered!</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Your digital fitment certificate has been created. The customer has been sent an OTP for mobile
              confirmation.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 inline-block">
            <QRCodeSVG
              value={`${window.location.origin}/passport/${createdPassport.passport_id}`}
              size={180}
              level="H"
            />
            <div className="mt-3 font-mono font-black text-base text-slate-900">
              {createdPassport.passport_id}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={copyCustomerLink}
              className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Customer Link</span>
            </button>

            <Link
              to={`/passport/${createdPassport.passport_id}`}
              target="_blank"
              className="inline-flex items-center space-x-2 bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>View Public Passport</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setCreatedPassport(null);
                setCustomerName('');
                setCustomerMobile('');
                setDealerInvoiceRef('');
                setNotes('');
              }}
              className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
            >
              <span>Record Another Fitment</span>
            </button>
          </div>
        </div>
      ) : (
        /* Create Form */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="border-b border-slate-100 pb-5 mb-6">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Record Tyre Installation</h1>
            <p className="mt-1 text-xs text-slate-500">
              Generate a digital passport for customer warranty tracking. Earns 5 Ustaad credits instantly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tyre Specs */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                <Disc className="w-3.5 h-3.5 mr-1.5 text-eurogrip-700" />
                <span>Tyre Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tyre Brand *</label>
                  <select
                    value={tyreBrand}
                    onChange={(e) => setTyreBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-semibold bg-white"
                  >
                    <option value="Eurogrip">Eurogrip (Official)</option>
                    <option value="MRF">MRF</option>
                    <option value="CEAT">CEAT</option>
                    <option value="Apollo">Apollo</option>
                    <option value="TVS">TVS Tyres</option>
                    <option value="Michelin">Michelin</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tyre Pattern / Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Protorq EX, Blaze BA S2"
                    value={tyreModel}
                    onChange={(e) => setTyreModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tyre Size *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 90/90-17, 90/100-10"
                    value={tyreSize}
                    onChange={(e) => setTyreSize(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Axle Placement *</label>
                  <select
                    value={axlePosition}
                    onChange={(e) => setAxlePosition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-medium bg-white"
                  >
                    <option value="rear">Rear Wheel</option>
                    <option value="front">Front Wheel</option>
                    <option value="both">Both (Pair Replacement)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                <Car className="w-3.5 h-3.5 mr-1.5 text-eurogrip-700" />
                <span>Vehicle Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={vehicleCategory}
                    onChange={(e) => setVehicleCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-medium bg-white"
                  >
                    <option value="motorcycle">Motorcycle</option>
                    <option value="scooter">Scooter</option>
                    <option value="moped">Moped</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Make & Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Honda CB Shine, Activa 6G"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                <User className="w-3.5 h-3.5 mr-1.5 text-eurogrip-700" />
                <span>Customer & Invoice (Optional for Confirmation)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Kumar"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Mobile Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Installation Date</label>
                  <input
                    type="date"
                    required
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dealer Invoice Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2024-890"
                    value={dealerInvoiceRef}
                    onChange={(e) => setDealerInvoiceRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <Link
                to="/fitments"
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center space-x-2 bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Creating Passport...' : 'Issue Fitment Passport'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

