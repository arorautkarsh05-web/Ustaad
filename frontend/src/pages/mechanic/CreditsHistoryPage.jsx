import React, { useState, useEffect } from 'react';
import { mechanicApi } from '../../api/mechanic.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Coins,
  Award,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const CreditsHistoryPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [creditData, setCreditData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const res = await mechanicApi.getCredits();
      if (res.data?.success) {
        setCreditData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load credits history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Retrieving credits and ledger..." />;
  }

  const totalCredits = creditData?.total_credits || 0;
  const level = creditData?.level || 'beginner';
  const transactions = creditData?.transactions || [];

  // Calculate tier progress
  let nextThreshold = 100;
  let progressPercent = Math.min((totalCredits / 100) * 100, 100);
  let nextTierName = 'Professional';

  if (totalCredits >= 100 && totalCredits < 300) {
    nextThreshold = 300;
    progressPercent = Math.min(((totalCredits - 100) / 200) * 100, 100);
    nextTierName = 'Champion';
  } else if (totalCredits >= 300) {
    nextThreshold = 300;
    progressPercent = 100;
    nextTierName = 'Champion (Max Tier Achieved)';
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-eurogrip-950 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Award className="w-4 h-4" />
              <span>Rewards & Tier Progress</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Credits & Recognition</h1>
            <p className="mt-1 text-slate-300 text-sm max-w-xl">
              Earn credits by passing training modules, recording verified customer tyre passports, and maintaining
              workshop excellence.
            </p>
          </div>

          <div className="bg-amber-400/20 border border-amber-400/40 p-4 rounded-2xl flex items-center space-x-4">
            <Coins className="w-8 h-8 text-amber-400" />
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-300 block">TOTAL BALANCE</span>
              <span className="text-2xl font-black text-white">{totalCredits} Credits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Progression Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">CURRENT TIER</span>
            <h2 className="text-xl font-black text-slate-900 capitalize flex items-center space-x-2">
              <span>{level} Ustaad</span>
              <Badge variant={level === 'champion' ? 'gold' : level === 'professional' ? 'primary' : 'neutral'}>
                {level}
              </Badge>
            </h2>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400 block font-semibold">Next Milestone:</span>
            <span className="font-bold text-slate-800">{nextTierName}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-eurogrip-700 to-amber-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
            <span>Beginner (0 pts)</span>
            <span>Professional (100 pts)</span>
            <span>Champion (300+ pts)</span>
          </div>
        </div>
      </div>

      {/* Credit Transactions Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Credit Activity Ledger</h2>
            <p className="mt-0.5 text-xs text-slate-500">Official log of all points credited and debited</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{transactions.length} Transactions</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No credit transactions recorded yet. Complete courses or fitments to start earning.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-4">Activity</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 text-right">Points</th>
                  <th className="py-3.5 px-6 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isEarned = tx.transaction_type === 'earned';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 text-slate-500">
                        {new Date(tx.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 capitalize">
                        {tx.activity_type.replace('_', ' ')}
                      </td>
                      <td className="py-4 px-4 text-slate-600 max-w-xs truncate">{tx.description}</td>
                      <td className="py-4 px-4">
                        <Badge variant={isEarned ? 'success' : 'danger'}>{tx.transaction_type}</Badge>
                      </td>
                      <td className="py-4 px-4 text-right font-black font-mono">
                        <span className={isEarned ? 'text-emerald-600' : 'text-rose-600'}>
                          {isEarned ? `+${tx.credit_amount}` : `-${tx.credit_amount}`}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                        {tx.balance_after} pts
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

