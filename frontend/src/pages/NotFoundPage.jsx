import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const { isAuthenticated, getDashboardPath } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-blue-50 border border-blue-200 text-eurogrip-700 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
        <Compass className="w-8 h-8" />
      </div>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
        ERROR 404
      </span>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Page Not Found</h1>
      <p className="mt-2 text-sm text-slate-600 max-w-sm">
        The page you are looking for does not exist or has been relocated within the network.
      </p>

      <Link
        to={isAuthenticated ? getDashboardPath() : '/'}
        className="mt-6 inline-flex items-center space-x-2 bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm text-xs transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};

