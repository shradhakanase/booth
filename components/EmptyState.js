'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
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

export { EmptyState };
