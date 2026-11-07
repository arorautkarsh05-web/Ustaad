import React, { useState, useEffect } from 'react';
import { mechanicApi } from '../../api/mechanic.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UstaadIdCard } from '../../components/mechanic/UstaadIdCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import {
  User,
  MapPin,
  Wrench,
  ShieldCheck,
  Save,
  Award,
  Sparkles,
  Phone,
  Building2,
  Calendar,
} from 'lucide-react';

export const MechanicProfile = () => {
  const { user, profile: authProfile, updateProfileState } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);

  // Form fields
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [shopCategory, setShopCategory] = useState('motorcycle_repair');
  const [experienceYears, setExperienceYears] = useState(5);
  const [stockingStatus, setStockingStatus] = useState('does_not_stock');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await mechanicApi.getProfile();
      if (res.data?.success && res.data.data) {
        const p = res.data.data.profile;
        setProfile(p);
        setBadges(res.data.data.badges || []);
        if (p) {
          setShopName(p.shop_name || '');
          setShopAddress(p.shop_address || '');
          setCity(p.city || '');
          setState(p.state || 'Maharashtra');
          setPincode(p.pincode || '');
          setShopCategory(p.shop_category || 'motorcycle_repair');
          setExperienceYears(p.experience_years || 0);
          setStockingStatus(p.stocking_status || 'does_not_stock');
        }
      }
    } catch (err) {
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        shop_name: shopName,
        shop_address: shopAddress,
        city,
        state,
        pincode,
        shop_category: shopCategory,
        experience_years: parseInt(experienceYears, 10),
        stocking_status: stockingStatus,
      };

      let res;
      if (!profile) {
        res = await mechanicApi.createProfile(data);
      } else {
        res = await mechanicApi.updateProfile(data);
      }

      if (res.data?.success) {
        toast.success(res.data.message || 'Profile saved successfully!');
        if (res.data.data) {
          setProfile(res.data.data);
          updateProfileState(res.data.data);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving Ustaad credentials..." />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ustaad Master Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your verified workshop credentials, digital identity card, and brand certification status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Digital Identity Card & Badges */}
        <div className="lg:col-span-1 space-y-6">
          <UstaadIdCard profile={profile || authProfile} user={user} />

          {/* Badges Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center mb-4">
              <Award className="w-4 h-4 mr-2 text-amber-500" />
              <span>Earned Recognition ({badges.length})</span>
            </h3>

            {badges.length === 0 ? (
              <p className="text-xs text-slate-400">Complete certifications to unlock badges.</p>
            ) : (
              <div className="space-y-2.5">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center space-x-3 text-xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{b.badge_name}</p>
                      <p className="text-[11px] text-slate-500">{b.badge_description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Profile Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Account Info (Read-only) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                  <User className="w-3.5 h-3.5 mr-1.5 text-eurogrip-700" />
                  <span>Primary Account Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      disabled
                      value={user?.full_name || ''}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number</label>
                    <input
                      type="text"
                      disabled
                      value={user?.mobile_number ? `+91 ${user.mobile_number}` : ''}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Workshop Details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                  <Building2 className="w-3.5 h-3.5 mr-1.5 text-eurogrip-700" />
                  <span>Garage & Workshop Particulars</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Shop / Garage Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Auto Works"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Shop Address</label>
                    <textarea
                      rows={2}
                      placeholder="Near Bus Stand, Station Road..."
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-sm font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-medium bg-white"
                      >
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Bihar">Bihar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-mono font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Service & Stocking Preferences */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                  <Wrench className="w-3.5 h-3.5 mr-1.5 text-eurogrip-700" />
                  <span>Trade Experience & Eurogrip Stocking</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Category</label>
                    <select
                      value={shopCategory}
                      onChange={(e) => setShopCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-medium bg-white"
                    >
                      <option value="motorcycle_repair">Motorcycle Repair</option>
                      <option value="puncture_shop">Puncture Specialist</option>
                      <option value="multi_service">Multi-brand Service</option>
                      <option value="other">General Garage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Eurogrip Stocking</label>
                    <select
                      value={stockingStatus}
                      onChange={(e) => setStockingStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-eurogrip-700 text-xs font-medium bg-white"
                    >
                      <option value="stocks_eurogrip">Currently Stocking</option>
                      <option value="planning_to_stock">Planning to Stock</option>
                      <option value="does_not_stock">Does Not Stock Yet</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center space-x-2 bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Update Workshop Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

