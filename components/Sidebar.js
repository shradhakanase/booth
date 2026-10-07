'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  Landmark,
  Users,
  Vote,
  FileSpreadsheet,
  UploadCloud,
  LineChart,
  GitCompare,
  Settings,
  ChevronRight,
  Database,
  Calendar,
} from 'lucide-react';
import { useYear } from './YearContext.js';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Year Comparison', href: '/dashboard/compare', icon: GitCompare, badge: 'Multi-Year' },
  { name: 'Districts', href: '/dashboard/districts', icon: MapPin },
  { name: 'Constituencies', href: '/dashboard/constituencies', icon: Landmark },
  { name: 'Candidates', href: '/dashboard/candidates', icon: Users },
  { name: 'Booth Explorer', href: '/dashboard/booths', icon: Vote },
  { name: 'Source Files', href: '/dashboard/files', icon: FileSpreadsheet },
  { name: 'Upload Data', href: '/dashboard/upload', icon: UploadCloud, badge: 'Form 20' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: LineChart },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { selectedYear, meta } = useYear();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200/90 shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center p-1.5 shadow-sm shadow-orange-500/10 flex-shrink-0">
            <img
              src="/BJP-Symbol.png"
              alt="BJP Symbol"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 font-['Outfit',sans-serif] block truncate">
              BOOTH ANALYSIS
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="truncate">{selectedYear} Form 20 Engine</span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300">
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </a>
            );
          })}
        </div>

        {/* Leadership & Active Year Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80 space-y-2.5">
          {/* Leadership Avatars */}
          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src="/PM_Modi.jpg"
                alt="PM Narendra Modi"
                className="w-8 h-8 rounded-lg object-cover border border-orange-200 shadow-xs flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-900 truncate">Narendra Modi</div>
                <div className="text-[9px] text-slate-500 font-medium truncate">Hon'ble Prime Minister</div>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0 pl-1 border-l border-slate-100">
              <img
                src="/CM_Yogi.jpg"
                alt="CM Yogi Adityanath"
                className="w-8 h-8 rounded-lg object-cover border border-orange-200 shadow-xs flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-900 truncate">Yogi Adityanath</div>
                <div className="text-[9px] text-slate-500 font-medium truncate">Hon'ble Chief Minister</div>
              </div>
            </div>
          </div>

          {/* Active Year Pill */}
          <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold text-slate-800">{selectedYear} Elections</span>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Active
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
