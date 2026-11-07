import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Download,
  TrendingUp,
  MapPin,
  Users,
  FileCheck2,
} from 'lucide-react';

export const AdminAnalyticsPage = () => {
  const toast = useToast();
  const [regTrends, setRegTrends] = useState([]);
  const [fitmentTrends, setFitmentTrends] = useState([]);
  const [stateStats, setStateStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [regRes, fitRes, stateRes] = await Promise.all([
        adminApi.getRegistrationTrends(),
        adminApi.getFitmentTrends(),
        adminApi.getStateWiseStats(),
      ]);

      if (regRes.data?.success) setRegTrends(regRes.data.data);
      if (fitRes.data?.success) setFitmentTrends(fitRes.data.data);
      if (stateRes.data?.success) setStateStats(stateRes.data.data);
    } catch (err) {
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
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
      toast.success('Mechanics CSV downloaded');
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
      toast.success('Fitments CSV downloaded');
    } catch (err) {
      toast.error('Failed to export fitments CSV.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Computing network trends and graphs..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ecosystem Analytics & Trends</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time visualisations for territory expansion, fitment market share, and mechanic engagement.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportMechanics}
            className="bg-white border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex items-center space-x-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Mechanics</span>
          </button>
          <button
            type="button"
            onClick={handleExportFitments}
            className="bg-white border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex items-center space-x-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Fitments</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Velocity */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Mechanic Onboarding Velocity</h2>
              <p className="text-xs text-slate-500">Monthly new registered garages joining network</p>
            </div>
            <Users className="w-5 h-5 text-eurogrip-700" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={regTrends.length > 0 ? regTrends : [{ month: '2024-01', count: 1 }]}>
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
                <Line
                  type="monotone"
                  dataKey="count"
                  name="New Mechanics"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fitments Growth */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Fitment Volume Trajectory</h2>
              <p className="text-xs text-slate-500">Total passports vs Eurogrip verified installations</p>
            </div>
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
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
                <Area type="monotone" dataKey="total" name="Total Market" stroke="#64748b" fill="#f8fafc" />
                <Area type="monotone" dataKey="eurogrip" name="Eurogrip Brand" stroke="#10b981" fill="#ecfdf5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State-wise Density Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Geographic Regional Density</h2>
              <p className="text-xs text-slate-500">Distribution of registered workshops and verification levels across states</p>
            </div>
            <MapPin className="w-5 h-5 text-amber-500" />
          </div>

          <div className="h-72 w-full">
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
                <Bar dataKey="count" name="Total Mechanics" fill="#0055b8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="verified" name="Verified Certified Garages" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

