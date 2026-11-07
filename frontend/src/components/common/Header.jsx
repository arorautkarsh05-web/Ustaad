import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Coins, User, LogOut, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const Header = ({ onOpenSidebar, pageTitle = 'Dashboard' }) => {
  const { user, profile, isMechanic, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">{pageTitle}</h1>
      </div>

      {/* Right: Credits, Notifications, Profile Dropdown */}
      <div className="flex items-center space-x-3">
        {/* Mechanic Quick Credits Pill */}
        {isMechanic && (
          <Link
            to="/credits"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-semibold hover:bg-amber-100 transition-colors shadow-2xs"
          >
            <Coins className="w-4 h-4 text-amber-600" />
            <span>{profile?.total_credits || 0} Credits</span>
          </Link>
        )}

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-eurogrip-700 text-white font-bold text-xs flex items-center justify-center uppercase">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 max-w-[120px] truncate">
              {user?.full_name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 py-1.5 z-50 text-xs">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">{user?.full_name}</p>
                <p className="text-slate-500 truncate">{user?.mobile_number}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium text-[10px] uppercase">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>

              {isMechanic && (
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-slate-50"
                >
                  <User className="w-4 h-4 mr-2.5 text-slate-400" />
                  <span>My Ustaad Profile</span>
                </Link>
              )}

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center px-4 py-2.5 text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4 mr-2.5 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

