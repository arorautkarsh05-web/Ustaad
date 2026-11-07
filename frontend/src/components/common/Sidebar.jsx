import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Award,
  BookOpen,
  Wrench,
  Coins,
  ShieldCheck,
  BarChart3,
  Users,
  Layers,
  LogOut,
  X,
  FileCheck2,
  CalendarCheck,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, profile, role, isMechanic, isDealer, isAdmin, isSuperAdmin, logout } = useAuth();

  const mechanicNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'My Ustaad ID', path: '/profile', icon: User },
    { label: 'Fitment Passport', path: '/fitments', icon: FileCheck2 },
    { label: 'Ustaad Academy', path: '/academy', icon: BookOpen },
    { label: 'ToolBank Hub', path: '/toolbank', icon: Wrench },
    { label: 'Credits & Badges', path: '/credits', icon: Coins },
  ];

  const dealerNav = [
    { label: 'Dealer Dashboard', path: '/dealer', icon: LayoutDashboard, exact: true },
    { label: 'ToolBank Approvals', path: '/dealer/reservations', icon: CalendarCheck },
  ];

  const adminNav = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Mechanic Directory', path: '/admin/mechanics', icon: Users },
    { label: 'Fitment Verification', path: '/admin/fitments', icon: FileCheck2 },
    { label: 'Academy Courses', path: '/admin/courses', icon: BookOpen },
    { label: 'ToolBank Inventory', path: '/admin/toolbank', icon: Wrench },
    { label: 'Analytics & Reports', path: '/admin/analytics', icon: BarChart3 },
    ...(isSuperAdmin ? [{ label: 'User Management', path: '/admin/users', icon: ShieldCheck }] : []),
  ];

  const navItems = isMechanic ? mechanicNav : isDealer ? dealerNav : isAdmin ? adminNav : [];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-eurogrip-700 flex items-center justify-center font-black text-white text-base tracking-tighter shadow-sm">
                EG
              </div>
              <div>
                <span className="text-sm font-extrabold tracking-wider text-white uppercase block leading-tight">
                  EUROGRIP
                </span>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block leading-tight">
                  USTAAD NETWORK
                </span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Role Card */}
          <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-eurogrip-600/30 border border-eurogrip-500/40 text-eurogrip-300 font-bold flex items-center justify-center text-sm uppercase">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate text-sm leading-tight">{user?.full_name}</p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] font-medium truncate">
                    {role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {isMechanic && profile?.ustaad_id && (
              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">{profile.ustaad_id}</span>
                <span className="font-bold text-amber-400 flex items-center">
                  <Coins className="w-3.5 h-3.5 mr-1" />
                  {profile.total_credits || 0} pts
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={Boolean(item.exact || item.path === '/admin' || item.path === '/dealer' || item.path === '/dashboard')}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-eurogrip-700 text-white shadow-sm shadow-eurogrip-900/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`
                }
              >
                <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

