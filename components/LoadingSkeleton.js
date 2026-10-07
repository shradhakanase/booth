'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

export function LoadingSkeleton({ rows = 5, height = 'h-12' }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`w-full ${height} bg-slate-100 rounded-xl border border-slate-200/80`} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 animate-pulse border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-7 w-28 bg-slate-200 rounded" />
        </div>
        <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl" />
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="h-3 w-36 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

export function EmptyState({
  title = 'No Data Found',
  description = 'Try adjusting your search criteria or filters.',
  icon: Icon = Inbox,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-slate-900 mb-1 font-['Outfit',sans-serif]">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
