import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  Wrench,
  Award,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  QrCode,
  Users,
  Coins,
  Disc,
  Car,
  ExternalLink,
  Shield,
  FileCheck2,
  Check,
  ArrowUpRight,
  Layers,
  Sparkles,
} from 'lucide-react';

export const LandingPage = () => {
  const { isAuthenticated, getDashboardPath } = useAuth();

  // Core 4 Pillars
  const pillars = [
    {
      title: 'Digital Fitment Passport',
      desc: 'Log tyre replacements in 45 seconds. Customers confirm via SMS OTP, generating an immutable, tamper-evident QR passport that eliminates warranty disputes.',
      icon: QrCode,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      path: isAuthenticated ? '/fitments' : '/passport/FP-2024-001',
      badge: 'Tamper-Evident QR',
      actionText: isAuthenticated ? 'Open Fitments Portal' : 'Inspect Live Passport',
    },
    {
      title: 'Ustaad Academy',
      desc: 'Master modern motorcycle radial dynamics, tubeless repair techniques, and size calculations through accredited TVS Eurogrip video modules.',
      icon: BookOpen,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      path: isAuthenticated ? '/academy' : '#academy',
      badge: '6 Certified Courses',
      actionText: isAuthenticated ? 'Launch Academy' : 'Explore Curriculum',
    },
    {
      title: 'ToolBank Hub',
      desc: 'Access precision dynamic wheel balancers, pneumatic tyre changers, and calibrated gauges from authorized dealer depots using earned credits.',
      icon: Wrench,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      path: isAuthenticated ? '/toolbank' : '#toolbank',
      badge: 'Zero-CapEx Machinery',
      actionText: isAuthenticated ? 'Manage Reservations' : 'Browse Equipment Pool',
    },
    {
      title: 'Tiered Ustaad Recognition',
      desc: 'Ascend from Beginner to Champion level. Unlock official TVS Eurogrip workshop display signboards, branded technician uniforms, and priority stock.',
      icon: Award,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      path: isAuthenticated ? '/credits' : '#tiers',
      badge: 'Official Credentials',
      actionText: isAuthenticated ? 'View Credit Ledger' : 'View Milestone Rewards',
    },
  ];

  // How It Works Steps
  const workflowSteps = [
    {
      step: '01',
      title: 'Fitment & Tyre Spec Capture',
      desc: 'Technician mounts tyre and logs vehicle model, tyre size, pattern, and axle placement in 45 seconds.',
      icon: Disc,
    },
    {
      step: '02',
      title: 'Two-Sided Customer SMS OTP',
      desc: 'Customer receives verification code on their mobile. Zero reward credits are issued until customer confirms.',
      icon: ShieldCheck,
    },
    {
      step: '03',
      title: 'Digital Passport & ToolBank Credits',
      desc: 'Instant QR passport activated for warranty. Mechanic receives +5 equipment credits atomically in their ledger.',
      icon: QrCode,
    },
  ];

  // ToolBank Equipment Pool Preview
  const toolbankPreview = [
    {
      name: 'Dynamic Wheel Balancer',
      category: 'Advanced Machinery',
      credits: '60 pts',
      period: '2-Day Dealer Loan',
      benefit: 'Eliminates high-speed motorcycle handlebar wobble',
      status: 'Available at Dealer Depots',
    },
    {
      name: 'Professional Tyre Changer',
      category: 'Advanced Machinery',
      credits: '50 pts',
      period: '3-Day Dealer Loan',
      benefit: 'Bead-safe mounting without alloy wheel scratches',
      status: 'Available at Dealer Depots',
    },
    {
      name: 'Calibrated Digital Gauge',
      category: 'Precision Tool',
      credits: '20 pts',
      period: 'Individual Tool',
      benefit: 'Accurate 0.5 PSI cold pressure calibration',
      status: 'In Stock',
    },
    {
      name: 'TVS Eurogrip Workshop Board',
      category: 'Brand Visibility',
      credits: '40 pts',
      period: 'Permanent Workshop Signage',
      benefit: 'Official TVS Eurogrip Authorized Workshop accreditation',
      status: 'Reward Milestone',
    },
  ];

  // Workshop Tier Progression
  const tiers = [
    {
      level: 'Beginner',
      range: '0 – 99 Credits',
      badge: 'Starter Tier',
      perks: [
        'Digital Ustaad Identification Card',
        'Academy Level 1 Course Access',
        'Basic ToolBank Equipment Access',
        'Standard Fitment Passport Generation',
      ],
      color: 'border-slate-700 bg-slate-900/60',
    },
    {
      level: 'Professional',
      range: '100 – 299 Credits',
      badge: 'Pro Mechanic',
      perks: [
        'Advanced Radial & Sizing Modules',
        'Wheel Balancer & Tyre Changer Loans',
        'Eurogrip Branded Technician Uniform',
        'Priority Technical Support Desk',
      ],
      color: 'border-eurogrip-700/60 bg-eurogrip-950/40 ring-1 ring-eurogrip-600/30',
      highlighted: true,
    },
    {
      level: 'Champion',
      range: '300+ Credits',
      badge: 'Elite Partner',
      perks: [
        'Authorized Eurogrip Workshop Board (3ft x 2ft)',
        'Full Shared Machinery Pool Access',
        'Regional Dealer Priority Stock Allocation',
        'Annual Eurogrip Ustaad Summit Invitation',
      ],
      color: 'border-amber-500/40 bg-amber-950/20 ring-1 ring-amber-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-eurogrip-600 selection:text-white">
      {/* Background Ambience & Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,85,184,0.28),rgba(2,6,23,0))]" />
        <div className="absolute top-[450px] right-0 w-[550px] h-[550px] bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-[850px] left-0 w-[550px] h-[550px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation Header */}
      <header className="h-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-eurogrip-700 flex items-center justify-center font-black text-white text-lg tracking-tighter shadow-md shadow-eurogrip-900/50">
            EG
          </div>
          <div>
            <span className="text-base font-black tracking-wider text-white uppercase block leading-tight">
              EUROGRIP
            </span>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block leading-tight">
              USTAAD NETWORK
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#passport" className="hover:text-white transition-colors">Fitment Passport</a>
          <a href="#toolbank" className="hover:text-white transition-colors">ToolBank</a>
          <a href="#academy" className="hover:text-white transition-colors">Academy</a>
          <a href="#tiers" className="hover:text-white transition-colors">Tiers & Perks</a>
        </nav>

        <div className="flex items-center space-x-3">
          <Link
            to="/passport/FP-2024-001"
            className="hidden sm:inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-slate-900"
          >
            <span>Live Sample QR</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1 text-slate-500" />
          </Link>

          {isAuthenticated ? (
            <Link
              to={getDashboardPath()}
              className="inline-flex items-center space-x-2 bg-eurogrip-700 hover:bg-eurogrip-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-eurogrip-900/40 transition-all text-xs sm:text-sm active:scale-95"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 bg-eurogrip-700 hover:bg-eurogrip-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-eurogrip-900/40 transition-all text-xs sm:text-sm active:scale-95"
            >
              <span>Ustaad Portal Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </header>

      {/* SECTION 1: HERO SECTION */}
      <section className="relative z-10 pt-12 pb-20 sm:pt-20 sm:pb-28 px-6 sm:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Product Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">Official Partner Program</span>
              <span className="text-slate-500">|</span>
              <span>TVS Eurogrip Two-Wheeler Tyres</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
              The Operating System for Certified Two-Wheeler Workshops.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
              Issue tamper-evident digital tyre passports with instant customer OTP verification. Access precision ToolBank machinery with zero capital, and earn official TVS Eurogrip certifications.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center space-x-2.5 bg-eurogrip-700 hover:bg-eurogrip-600 text-white text-sm sm:text-base font-bold px-7 py-3.5 rounded-2xl shadow-xl shadow-eurogrip-950/60 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Access Ustaad Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/passport/FP-2024-001"
                className="inline-flex items-center justify-center space-x-2 bg-slate-900/90 hover:bg-slate-850 text-slate-200 text-sm sm:text-base font-semibold px-6 py-3.5 rounded-2xl border border-slate-700/90 transition-all hover:-translate-y-0.5"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Verify a Passport</span>
              </Link>
            </div>

            {/* Program Milestone Statistics */}
            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white font-mono">50,000+</p>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Partner Garages Target</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">100%</p>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Tamper-Evident QR</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">₹0 CapEx</p>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">ToolBank Access</p>
              </div>
            </div>
          </div>

          {/* Right Column: Signature Digital Fitment Passport with Laser Scan Beam */}
          <div className="lg:col-span-5 relative" id="passport">
            <div className="relative mx-auto max-w-md rounded-3xl bg-slate-900/95 border border-slate-700/80 p-6 sm:p-7 shadow-2xl shadow-black/90 backdrop-blur-xl">
              {/* Product Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-eurogrip-700 flex items-center justify-center text-white font-black text-xs">
                    EG
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block leading-tight">
                      PASSPORT FP-2024-001
                    </span>
                    <span className="text-xs font-bold text-white block">Digital Fitment Passport</span>
                  </div>
                </div>

                {/* Prominent Emerald Verification Badge */}
                <div
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-xs shadow-emerald-950/50"
                  aria-label="Verified Tyre Fitment"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>CUSTOMER VERIFIED</span>
                </div>
              </div>

              {/* QR Code with Scanning Laser Beam Micro-Interaction */}
              <div className="my-5 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center space-x-4">
                <div className="relative p-2.5 bg-white rounded-xl flex-shrink-0 overflow-hidden shadow-inner">
                  {/* Subtle Scanning Beam */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-scan-beam pointer-events-none" />
                  <QRCodeSVG value="https://eurogrip-ustaad.network/passport/FP-2024-001" size={82} level="M" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    <span>Two-Sided SMS OTP Authenticated</span>
                  </span>
                  <p className="text-xs font-bold text-white truncate mt-0.5">TVS Eurogrip Warranty Active</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">Owner: Suresh Kumar</p>
                  <p className="text-[10px] text-slate-500">Mobile: ******3210 (Masked)</p>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Vehicle</span>
                  <span className="font-bold text-white text-xs mt-0.5 block truncate">Honda CB Shine</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Tyre Pattern</span>
                  <span className="font-bold text-white text-xs mt-0.5 block truncate">Eurogrip Protorq EX</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Size & Placement</span>
                  <span className="font-bold font-mono text-white text-xs mt-0.5 block">90/90-17 (Rear)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Certified Garage</span>
                  <span className="font-bold text-white text-xs mt-0.5 block truncate">Ramesh Auto Works</span>
                </div>
              </div>

              {/* Bottom Proof Bar */}
              <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-amber-400 font-semibold text-[11px]">
                  <Coins className="w-3.5 h-3.5" />
                  <span>+5 Fitment Credits Issued</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Ustaad ID: UE-MH-00001</span>
              </div>
            </div>

            {/* Ambient Card Glow */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600/20 via-eurogrip-500/10 to-amber-500/20 blur-xl -z-10" />
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW USTAAD NETWORK WORKS (STEP-BY-STEP WORKFLOW) */}
      <section className="relative z-10 py-16 px-6 sm:px-12 max-w-7xl mx-auto w-full border-t border-slate-800/80" id="how-it-works">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
            Seamless Workshop Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            How Ustaad Network Operates
          </h2>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Engineered specifically to avoid disrupting garage operations while ensuring 100% fraud-proof warranty traceability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workflowSteps.map((ws, i) => (
            <div
              key={i}
              className="relative p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-black text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    STEP {ws.step}
                  </span>
                  <ws.icon className="w-5 h-5 text-eurogrip-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{ws.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{ws.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center text-[11px] font-semibold text-emerald-400">
                <Check className="w-3.5 h-3.5 mr-1" />
                <span>Zero Paperwork Required</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: FOUR CORE PILLARS */}
      <section className="relative z-10 py-20 px-6 sm:px-12 max-w-7xl mx-auto w-full border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Four Pillars of Mechanic Excellence
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
            Engineered to solve everyday workshop challenges and establish institutional trust between mechanics, dealers, and motorcycle riders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((f, i) => {
            const isAnchor = f.path.startsWith('#');
            const cardContent = (
              <>
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${f.color} transition-transform group-hover:scale-110`}>
                      <f.icon className="w-6 h-6" />
                    </div>
                    {f.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 group-hover:border-slate-600 transition-colors">
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                    {f.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-eurogrip-400 group-hover:text-white transition-colors">
                  <span>{f.actionText}</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </>
            );

            const cardClasses = "group bg-slate-900/80 hover:bg-slate-850 rounded-3xl p-6 border border-slate-800 hover:border-eurogrip-500/80 shadow-lg hover:shadow-2xl hover:shadow-eurogrip-950/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer";

            return isAnchor ? (
              <a
                href={f.path}
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.querySelector(f.path);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={cardClasses}
              >
                {cardContent}
              </a>
            ) : (
              <Link
                to={f.path}
                key={i}
                className={cardClasses}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: TOOLBANK EQUIPMENT MARKETPLACE SHOWCASE */}
      <section className="relative z-10 py-20 px-6 sm:px-12 max-w-7xl mx-auto w-full border-t border-slate-800/80" id="toolbank">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
              Shared Machinery Economy
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ToolBank Equipment Pool
            </h2>
            <p className="mt-2 text-slate-400 text-sm max-w-xl">
              Mechanics reserve professional tyre equipment from authorized TVS Eurogrip dealer depots using credits earned from certified fitments. Zero financial debt.
            </p>
          </div>

          <Link
            to={isAuthenticated ? '/toolbank' : '/login?role=mechanic'}
            className="inline-flex items-center text-xs font-bold text-eurogrip-400 hover:text-white transition-colors"
          >
            <span>Explore Full ToolBank Inventory</span>
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {toolbankPreview.map((tool, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                    {tool.category}
                  </span>
                  <span className="font-mono font-bold text-amber-400">{tool.credits}</span>
                </div>
                <h3 className="text-sm font-bold text-white">{tool.name}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{tool.benefit}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{tool.period}</span>
                <span className="text-emerald-400 font-semibold">{tool.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: USTAAD ACADEMY & CERTIFICATION */}
      <section className="relative z-10 py-20 px-6 sm:px-12 max-w-7xl mx-auto w-full border-t border-slate-800/80" id="academy">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
              Skill Building & Accreditation
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              TVS Eurogrip Technical Curriculum
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Equipping roadside garages and independent technicians with engineering expertise in radial motorcycle tyres, speed rating indexes, and tubeless puncture restoration.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span><strong>Server-Side Validated Quizzes:</strong> Correct answer keys are never leaked to client state, ensuring authentic technician qualification.</span>
              </div>
              <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span><strong>Instant Reward Credits:</strong> Passing an assessment awards +15 to +25 credits toward ToolBank machinery reservations.</span>
              </div>
              <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span><strong>Digital Badges:</strong> Earn *Profile Pioneer*, *First Steps*, *Tyre Expert*, and *Eurogrip Champion* credentials.</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to={isAuthenticated ? '/academy' : '/login?role=mechanic'}
                className="inline-flex items-center space-x-2 bg-eurogrip-700 hover:bg-eurogrip-600 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition-all"
              >
                <span>View Academy Modules</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Module 01</span>
              <h4 className="text-sm font-bold text-white">Introduction to Eurogrip Tyres</h4>
              <p className="text-xs text-slate-400">Quality standards, compound technology, and tread architecture.</p>
              <span className="inline-block mt-2 font-mono text-[11px] text-eurogrip-400 font-semibold">+15 Credits Reward</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Module 02</span>
              <h4 className="text-sm font-bold text-white">Tyre Size Reading & Sizing</h4>
              <p className="text-xs text-slate-400">Aspect ratios, load capacity codes, and speed rating parameters.</p>
              <span className="inline-block mt-2 font-mono text-[11px] text-eurogrip-400 font-semibold">+15 Credits Reward</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Module 03</span>
              <h4 className="text-sm font-bold text-white">Tubeless Tyre Repair Mastery</h4>
              <p className="text-xs text-slate-400">Professional plug strip techniques and permanent puncture sealing.</p>
              <span className="inline-block mt-2 font-mono text-[11px] text-eurogrip-400 font-semibold">+20 Credits Reward</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Module 05</span>
              <h4 className="text-sm font-bold text-white">Advanced Radial Technology</h4>
              <p className="text-xs text-slate-400">Radial vs bias plies, bead seating, and heat dissipation dynamics.</p>
              <span className="inline-block mt-2 font-mono text-[11px] text-eurogrip-400 font-semibold">+25 Credits Reward</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: WORKSHOP TIER PROGRESSION */}
      <section className="relative z-10 py-20 px-6 sm:px-12 max-w-7xl mx-auto w-full border-t border-slate-800/80" id="tiers">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
            Technician Career Path
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Workshop Tier Progression
          </h2>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Every verified fitment and completed training module advances your garage tier, unlocking tangible commercial assets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`p-7 rounded-3xl border flex flex-col justify-between ${tier.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    {tier.badge}
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-400">{tier.range}</span>
                </div>
                <h3 className="text-2xl font-black text-white">{tier.level}</h3>

                <ul className="mt-6 space-y-3">
                  {tier.perks.map((perk, pIdx) => (
                    <li key={pIdx} className="flex items-start text-xs sm:text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800/80">
                <Link
                  to="/login"
                  className="block text-center text-xs font-bold py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-white transition-colors"
                >
                  Join as {tier.level}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 7: BOTTOM CTA SECTION */}
      <section className="relative z-10 bg-slate-900 border-t border-slate-800 text-white py-16 px-6 sm:px-12 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Official TVS Eurogrip Network</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">Join 50,000+ Certified Mechanics Across India</h3>
            <p className="mt-2 text-slate-400 text-xs sm:text-sm max-w-lg">
              Get direct access to TVS Eurogrip training certificates, warranty support, and authorized dealer parts.
            </p>
          </div>

          <Link
            to="/login"
            className="flex-shrink-0 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-8 py-3.5 rounded-2xl transition-all shadow-md text-sm active:scale-95"
          >
            Access Network Now
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-slate-950 text-slate-500 py-8 px-6 sm:px-12 border-t border-slate-900 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded bg-eurogrip-700 flex items-center justify-center font-bold text-white text-[10px]">
            EG
          </div>
          <p>© 2026 Eurogrip Ustaad Network. All rights reserved. TVS Eurogrip Ecosystem.</p>
        </div>
        <p className="text-slate-400">Architected by Team Code Slayers</p>
      </footer>
    </div>
  );
};
