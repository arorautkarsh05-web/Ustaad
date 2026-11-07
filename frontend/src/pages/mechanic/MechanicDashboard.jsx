import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mechanicApi } from '../../api/mechanic.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { UstaadIdCard } from '../../components/mechanic/UstaadIdCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FileCheck2,
  BookOpen,
  Wrench,
  Coins,
  Plus,
  ArrowRight,
  Award,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const MechanicDashboard = () => {
  const { user, profile } = useAuth();
  const toast = useToast();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await mechanicApi.getDashboard();
      if (res.data?.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading your Ustaad workspace..." />;
  }

  const stats = dashboardData?.stats || { totalFitments: 0, completedCourses: 0, activeReservations: 0 };
  const badges = dashboardData?.badges || [];
  const activities = dashboardData?.recentActivities || [];
  const fitments = dashboardData?.recentFitments || [];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-eurogrip-950 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Certified Partner Garage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Namaste, {user?.full_name || 'Ustaad'}!
            </h1>
            <p className="mt-1 text-slate-300 text-sm max-w-xl">
              Welcome back to your workshop command center. Track your tyre fitment passports, complete academy
              certifications, and borrow ToolBank equipment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/fitments/create"
              className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-md transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Fitment</span>
            </Link>

            <Link
              to="/profile"
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-all text-sm"
            >
              <span>View Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Tyre Fitments"
          value={stats.totalFitments}
          subtitle="Passports recorded"
          icon={FileCheck2}
          color="blue"
        />
        <StatCard
          title="Academy Courses"
          value={stats.completedCourses}
          subtitle="Modules certified"
          icon={BookOpen}
          color="amber"
        />
        <StatCard
          title="Active Tool Loans"
          value={stats.activeReservations}
          subtitle="Equipments in hand"
          icon={Wrench}
          color="emerald"
        />
        <StatCard
          title="Total Ustaad Credits"
          value={`${dashboardData?.profile?.total_credits || profile?.total_credits || 0}`}
          subtitle="Tier reward points"
          icon={Coins}
          color="purple"
        />
      </div>

      {/* Identity Card & Earned Badges Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Digital Identity Card */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center">
          <UstaadIdCard profile={dashboardData?.profile || profile} user={user} />
        </div>

        {/* Right: Achievement Badges */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Earned Achievement Badges</h3>
              </div>
              <Link to="/credits" className="text-xs font-bold text-eurogrip-700 hover:underline flex items-center">
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {badges.length === 0 ? (
              <EmptyState
                icon={Award}
                title="No Badges Earned Yet"
                description="Complete courses, record fitments, or reserve tools to unlock exclusive recognition badges!"
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-start space-x-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{b.badge_name}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{b.badge_description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Rank Tier Status: <strong className="text-slate-800 capitalize">{profile?.level || 'Beginner'}</strong></span>
            <span>Profile Completion: <strong className="text-emerald-600 font-bold">{profile?.profile_completion || 85}%</strong></span>
          </div>
        </div>
      </div>

      {/* Recent Fitments & Activity Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Fitments */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center">
              <FileCheck2 className="w-4 h-4 mr-2 text-eurogrip-700" />
              <span>Recent Fitment Passports</span>
            </h3>
            <Link to="/fitments" className="text-xs font-bold text-eurogrip-700 hover:underline">
              View All ({fitments.length})
            </Link>
          </div>

          {fitments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No fitments recorded yet. Create your first digital tyre passport!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {fitments.slice(0, 4).map((f) => (
                <div key={f.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 block">{f.passport_id}</span>
                    <span className="text-[11px] text-slate-500">
                      {f.tyre_brand} • {f.tyre_size} ({f.vehicle_model || 'Vehicle'})
                    </span>
                  </div>
                  <div className="text-right">
                    <Badge variant={f.verification_status === 'verified' ? 'success' : 'primary'}>
                      {f.verification_status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center">
              <Clock className="w-4 h-4 mr-2 text-slate-600" />
              <span>Activity History</span>
            </h3>
            <span className="text-xs text-slate-400">Latest workshop events</span>
          </div>

          {activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No recent workshop activity recorded.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activities.slice(0, 4).map((a) => (
                <div key={a.id} className="py-3 flex items-start justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800">{a.description}</p>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{a.activity_type}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 flex-shrink-0 ml-3">
                    {new Date(a.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

