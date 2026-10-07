'use client';

import React from 'react';

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient = 'from-blue-100 to-indigo-50',
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50 border-blue-200',
  badge,
  badgeColor = 'bg-blue-50 text-blue-700 border-blue-200',
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 glass-card-hover border border-slate-200/90 shadow-sm shadow-slate-100">
      {/* Background soft gradient corner */}
      <div className={`absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full blur-2xl pointer-events-none opacity-70`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit',sans-serif]">
            {typeof value === 'number' ? value.toLocaleString() : (value || '0')}
          </h3>
        </div>

        {Icon && (
          <div className={`w-12 h-12 rounded-xl ${iconBg} border flex items-center justify-center shadow-sm`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {badge}
          </span>
        )}
        {subtitle && <p className="text-xs text-slate-500 font-medium truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
