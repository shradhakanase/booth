'use client';

import React from 'react';

export const PARTY_LIGHT_COLORS = {
  BJP: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  SP: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  INC: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  BSP: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  AAP: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  ASPKR: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  IND: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

export function PerformanceBadge({ category }) {
  const cat = (category || 'neutral').toLowerCase();
  
  if (cat === 'strong') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Strong Booth
      </span>
    );
  }

  if (cat === 'medium') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Medium Booth
      </span>
    );
  }

  if (cat === 'weak') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Weak Booth
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
      Neutral
    </span>
  );
}

export function PartyBadge({ party }) {
  const p = (party || 'IND').toUpperCase();
  const color = PARTY_LIGHT_COLORS[p] || PARTY_LIGHT_COLORS.IND;
  const isBjp = p === 'BJP' || p.includes('BHARATIYA JANATA');

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${color.bg} ${color.text} ${color.border}`}>
      {isBjp && (
        <img
          src="/BJP-Symbol.png"
          alt="BJP"
          className="w-3.5 h-3.5 object-contain flex-shrink-0"
        />
      )}
      <span>{p}</span>
    </span>
  );
}
