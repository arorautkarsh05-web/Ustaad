import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toolbankApi } from '../../api/toolbank.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Wrench,
  Coins,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const ToolBankCatalogPage = () => {
  const { profile } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Reservation Modal state
  const [reserveModalItem, setReserveModalItem] = useState(null);
  const [mechanicNotes, setMechanicNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { label: 'All Equipment', value: '' },
    { label: 'Basic Tools', value: 'basic_tools' },
    { label: 'Advanced Machinery', value: 'advanced_equipment' },
    { label: 'Brand Visibility', value: 'brand_visibility' },
  ];

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await toolbankApi.getItems({ category: selectedCategory || undefined });
      if (res.data?.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load ToolBank equipment catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory]);

  const handleOpenReserve = (item) => {
    if (profile && profile.total_credits < item.credit_requirement) {
      toast.error(
        `Insufficient credits! You need ${item.credit_requirement} credits, but you have ${profile.total_credits}.`
      );
      return;
    }
    setReserveModalItem(item);
    setMechanicNotes('');
  };

  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    if (!reserveModalItem) return;

    try {
      setSubmitting(true);
      const res = await toolbankApi.createReservation({
        item_id: reserveModalItem.id,
        dealer_id: 1, // Default regional dealer
        mechanic_notes: mechanicNotes || null,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Equipment reservation submitted!');
        setReserveModalItem(null);
        fetchItems();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reserve equipment.');
    } finally {
      setSubmitting(false);
    }
  };

  const userCredits = profile?.total_credits || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-eurogrip-950 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Workshop Modernization Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">ToolBank Equipment Pool</h1>
            <p className="mt-1 text-slate-300 text-sm max-w-xl">
              Equip your workshop with industry-grade digital pressure gauges, tubeless kits, and dynamic wheel
              balancers. Borrow tools using your earned Ustaad credits.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/toolbank/my-reservations"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl border border-white/20 text-xs transition-colors flex items-center space-x-1.5"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>My Equipment Loans</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Category Pills & User Credit Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setSelectedCategory(c.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                selectedCategory === c.value
                  ? 'bg-eurogrip-700 text-white border-eurogrip-700 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
          <span>Available Credits:</span>
          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-mono">
            {userCredits} pts
          </span>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <LoadingSpinner text="Retrieving ToolBank equipment..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No Equipment Available"
          description="There are currently no items matching this category."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const hasEnoughCredits = userCredits >= item.credit_requirement;
            const isAvailable = item.available_quantity > 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6">
                  {/* Category & Access Type */}
                  <div className="flex items-center justify-between mb-3 text-[11px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">
                      {item.category.replace('_', ' ')}
                    </span>
                    <Badge variant={item.access_type === 'shared' ? 'purple' : 'primary'}>
                      {item.access_type}
                    </Badge>
                  </div>

                  {/* Icon illustration if image not provided */}
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 mb-4 border border-slate-200/60">
                    <Wrench className="w-6 h-6 text-eurogrip-700" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">{item.item_name}</h3>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>

                  {/* Metrics */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Required Credits:</span>
                      <span className="font-bold text-amber-600">{item.credit_requirement} pts</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Max Loan Period:</span>
                      <span className="font-semibold text-slate-700">
                        {item.max_reservation_days > 0 ? `${item.max_reservation_days} Days` : 'Permanent Item'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Inventory Status:</span>
                      <span
                        className={`font-semibold ${
                          isAvailable ? 'text-emerald-600' : 'text-rose-500'
                        }`}
                      >
                        {isAvailable ? `${item.available_quantity} available` : 'Reserved Out'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reservation Action */}
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={!isAvailable || !hasEnoughCredits}
                    onClick={() => handleOpenReserve(item)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                      !isAvailable
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : !hasEnoughCredits
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-eurogrip-700 text-white hover:bg-eurogrip-800 shadow-xs'
                    }`}
                  >
                    {!isAvailable
                      ? 'Currently Unavailable'
                      : !hasEnoughCredits
                      ? `Need ${item.credit_requirement - userCredits} More Credits`
                      : 'Reserve Equipment'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reservation Dialog Modal */}
      {reserveModalItem && (
        <Modal
          isOpen={!!reserveModalItem}
          onClose={() => setReserveModalItem(null)}
          title={`Reserve ${reserveModalItem.item_name}`}
        >
          <form onSubmit={handleConfirmReservation} className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Equipment Category:</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {reserveModalItem.category.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Max Reservation Duration:</span>
                <span className="font-semibold text-slate-900">
                  {reserveModalItem.max_reservation_days} Days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Credit Threshold:</span>
                <span className="font-bold text-amber-600">
                  {reserveModalItem.credit_requirement} Credits Required
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Workshop Notes / Planned Job Purpose
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Scheduled for tyre replacement batch this weekend..."
                value={mechanicNotes}
                onChange={(e) => setMechanicNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setReserveModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-5 py-2 rounded-xl shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Reserving...' : 'Submit Reservation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

