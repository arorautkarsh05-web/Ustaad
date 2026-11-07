import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend = null, className = '' }) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-eurogrip-700',
      border: 'border-blue-100',
      ring: 'group-hover:border-blue-300',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      ring: 'group-hover:border-amber-300',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      ring: 'group-hover:border-emerald-300',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      ring: 'group-hover:border-purple-300',
    },
    slate: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      ring: 'group-hover:border-slate-300',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${scheme.bg} flex items-center justify-center ${scheme.text} transition-transform group-hover:scale-105`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{value ?? '—'}</div>
        <div className="flex items-center justify-between mt-1 text-xs">
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
          {trend && (
            <span
              className={`font-medium ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

