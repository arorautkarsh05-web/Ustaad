import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, Award, MapPin, Wrench, Sparkles } from 'lucide-react';

export const UstaadIdCard = ({ profile, user }) => {
  const isChampion = profile?.level === 'champion';
  const isProfessional = profile?.level === 'professional';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-eurogrip-950 p-6 sm:p-7 text-white shadow-xl border border-slate-700/80 max-w-md w-full">
      {/* Decorative Automotive Watermark */}
      <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-eurogrip-600/10 blur-2xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      {/* Top Bar: Brand & Verified Pill */}
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-5">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-eurogrip-700 flex items-center justify-center font-black text-white text-sm shadow-inner">
            EG
          </div>
          <div>
            <div className="text-xs font-black tracking-widest uppercase text-white leading-tight">EUROGRIP</div>
            <div className="text-[9px] font-bold text-amber-400 tracking-wider uppercase leading-tight">
              CERTIFIED USTAAD
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="capitalize">{profile?.verification_status || 'Verified'}</span>
        </div>
      </div>

      {/* Main Info */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Master Technician</p>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{user?.full_name || 'Ustaad'}</h2>
          <p className="text-sm font-medium text-amber-300 flex items-center pt-0.5">
            <Wrench className="w-3.5 h-3.5 mr-1 text-amber-400" />
            {profile?.shop_name || 'Independent Garage'}
          </p>
          <p className="text-xs text-slate-300 flex items-center pt-0.5">
            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
            {profile?.city || 'Pune'}, {profile?.state || 'Maharashtra'}
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-white p-2 rounded-xl shadow-md border border-slate-200/20 flex-shrink-0">
          <QRCodeSVG
            value={`https://eurogrip.ustaad/verify/${profile?.ustaad_id || 'DEMO'}`}
            size={72}
            level="M"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="mt-6 pt-4 border-t border-slate-700/80 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">USTAAD ID</span>
          <span className="font-mono font-bold text-sm text-white tracking-wider">
            {profile?.ustaad_id || 'UE-MH-00001'}
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">LEVEL TIER</span>
          <span
            className={`font-black text-xs uppercase px-2 py-0.5 rounded-md inline-flex items-center space-x-1 ${
              isChampion
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : isProfessional
                ? 'bg-blue-400/20 text-blue-300 border border-blue-400/40'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            <span>{profile?.level || 'Beginner'}</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">CREDITS</span>
          <span className="font-bold text-sm text-amber-400">{profile?.total_credits || 0} pts</span>
        </div>
      </div>
    </div>
  );
};

