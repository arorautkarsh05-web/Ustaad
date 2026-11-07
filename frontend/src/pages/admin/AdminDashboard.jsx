import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../context/ToastContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Users,
  FileCheck2,
  BookOpen,
  Wrench,
  Coins,
  Download,
  TrendingUp,
  MapPin,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const AdminDashboard = () => {
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [regTrends, setRegTrends] = useState([]);
  const [fitmentTrends, setFitmentTrends] = useState([]);
  const [stateStats, setStateStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [ovRes, regRes, fitRes, stateRes] = await Promise.all([
        adminApi.getDashboardOverview(),
        adminApi.getRegistrationTrends(),
        adminApi.getFitmentTrends(),
        adminApi.getStateWiseStats(),
      ]);

      if (ovRes.data?.success) setOverview(ovRes.data.data);
      if (regRes.data?.success) setRegTrends(regRes.data.data);
      if (fitRes.data?.success) setFitmentTrends(fitRes.data.data);
      if (stateRes.data?.success) setStateStats(stateRes.data.data);
    } catch (err) {
      toast.error('Failed to load administrative overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleExportMechanics = async () => {
    try {
      const res = await adminApi.exportMechanics();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mechanics_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Mechanics CSV exported successfully');
    } catch (err) {
      toast.error('Failed to export mechanics CSV.');
    }
  };

  const handleExportFitments = async () => {
    try {
      const res = await adminApi.exportFitments();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fitments_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Fitments CSV exported successfully');
    } catch (err) {
      toast.error('Failed to export fitments CSV.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Aggregating network intelligence..." />;
  }

  const mStats = overview?.mechanics || {};
  const fStats = overview?.fitments || {};
  const cStats = overview?.courses || {};
  const tStats = overview?.toolbank || {};
  const crStats = overview?.credits || {};

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-eurogrip-950 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>National Operations Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Eurogrip Network Administration
            </h1>
            <p className="mt-1 text-slate-300 text-sm max-w-xl">
              Holistic control center for mechanic verification, regional tyre fitment volumes, ToolBank equipment
              distribution, and technical training progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportMechanics}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl border border-white/20 text-xs transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Mechanics CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportFitments}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl border border-white/20 text-xs transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Fitments CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mechanics"
          value={mStats.total || 0}
          subtitle={`${mStats.verified || 0} verified accounts`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Tyre Fitments"
          value={fStats.total || 0}
          subtitle={`${fStats.eurogrip || 0} Eurogrip fitments`}
          icon={FileCheck2}
          color="emerald"
        />
        <StatCard
          title="Course Enrollments"
          value={cStats.total_enrollments || 0}
          subtitle={`${cStats.completions || 0} certified pass`}
          icon={BookOpen}
          color="amber"
        />
        <StatCard
          title="ToolBank Loans"
          value={tStats.total_reservations || 0}
          subtitle={`${tStats.pending || 0} pending approvals`}
          icon={Wrench}
          color="purple"
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-xs">
          <span className="text-slate-400 block text-[11px] font-semibold">Champion Mechanics</span>
          <span className="text-xl font-bold text-amber-500 mt-1 block">{mStats.champions || 0}</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-xs">
          <span className="text-slate-400 block text-[11px] font-semibold">Stocking Eurogrip</span>
          <span className="text-xl font-bold text-emerald-600 mt-1 block">{mStats.stocking_eurogrip || 0}</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-xs">
          <span className="text-slate-400 block text-[11px] font-semibold">Total Credits Awarded</span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">{crStats.total_earned || 0} pts</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-xs">
          <span className="text-slate-400 block text-[11px] font-semibold">New Last 30 Days</span>
          <span className="text-xl font-bold text-blue-600 mt-1 block">+{mStats.new_last_30_days || 0}</span>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fitment Trends */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Tyre Fitment Trends</h2>
              <p className="text-xs text-slate-500">Monthly fitment registrations vs Eurogrip brand share</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fitmentTrends.length > 0 ? fitmentTrends : [{ month: '2024-01', total: 3, eurogrip: 2 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="total" name="Total Fitments" stroke="#3b82f6" fill="#eff6ff" />
                <Area type="monotone" dataKey="eurogrip" name="Eurogrip Tyres" stroke="#10b981" fill="#ecfdf5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State-wise Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">State-wise Mechanic Distribution</h2>
              <p className="text-xs text-slate-500">Registered workshops across regional territories</p>
            </div>
            <MapPin className="w-5 h-5 text-eurogrip-700" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateStats.length > 0 ? stateStats : [{ state: 'Maharashtra', count: 1, verified: 1 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="state" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="count" name="Total Mechanics" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="verified" name="Verified Workshops" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

