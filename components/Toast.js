'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ type = 'success', message, onClose }) {
  if (!message) return null;

  const config = {
    success: {
      bg: 'bg-white border-emerald-300 text-emerald-950 shadow-xl',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    warning: {
      bg: 'bg-white border-amber-300 text-amber-950 shadow-xl',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    error: {
      bg: 'bg-white border-rose-300 text-rose-950 shadow-xl',
      icon: XCircle,
      iconColor: 'text-rose-600',
    },
    info: {
      bg: 'bg-white border-blue-300 text-blue-950 shadow-xl',
      icon: Info,
      iconColor: 'text-blue-600',
    },
  }[type] || {
    bg: 'bg-white border-slate-300 text-slate-900 shadow-xl',
    icon: Info,
    iconColor: 'text-slate-600',
  };

  const Icon = config.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-slide-up">
      <div className={`flex items-center gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-xl ${config.bg}`}>
        <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
        <p className="text-xs font-semibold flex-1 text-slate-800">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
