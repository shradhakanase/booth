'use client';

import React from 'react';
import { Menu, Calendar, ChevronDown, CheckCircle2, UploadCloud } from 'lucide-react';
import { useYear } from './YearContext.js';

export default function Header({ onMenuClick, onSearch, activeFilters = {} }) {
  const { selectedYear, setSelectedYear, availableYears, meta } = useYear();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Year Switcher Pill */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Year:</span>
              <select
                id="global-year-selector"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-emerald-400 font-extrabold text-xs focus:outline-none cursor-pointer pr-4 appearance-none"
              >
                {availableYears.map((y) => (
                  <option key={y.year} value={y.year} className="bg-slate-900 text-white font-medium">
                    {y.year} — {y.label || `${y.year} Elections`}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-3" />
            </div>
          </div>

          {/* Active Election Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{meta?.type || 'Election Data'}</span>
          </div>

          {/* Compare Years Shortcut Button */}
          <a
            href="/dashboard/compare"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-all shadow-xs"
            title="Compare multiple election years"
          >
            <span className="text-indigo-600 font-extrabold">⇄</span>
            <span>Compare Years</span>
          </a>

          {/* Contextual filter labels */}
          {activeFilters.district && (
            <span className="hidden lg:inline-flex text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-medium">
              District: <strong className="ml-1 text-slate-900">{activeFilters.district}</strong>
            </span>
          )}
          {activeFilters.ac && (
            <span className="hidden lg:inline-flex text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-medium">
              AC: <strong className="ml-1 text-slate-900">{activeFilters.ac}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Leadership Profile Badges */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5">
            <img
              src="/PM_Modi.jpg"
              alt="PM Narendra Modi"
              className="w-6 h-6 rounded-full object-cover border border-orange-200 shadow-xs"
              title="PM Narendra Modi"
            />
            <span className="text-[11px] font-bold text-slate-800">PM Modi</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <img
              src="/CM_Yogi.jpg"
              alt="CM Yogi Adityanath"
              className="w-6 h-6 rounded-full object-cover border border-orange-200 shadow-xs"
              title="CM Yogi Adityanath"
            />
            <span className="text-[11px] font-bold text-slate-800">CM Yogi</span>
          </div>
        </div>

        {/* Live DB indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="hidden sm:inline">MongoDB Live</span>
        </div>

        {/* Quick action: Upload button */}
        <a
          href="/dashboard/upload"
          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white shadow-md shadow-emerald-600/20 transition-all"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload Form 20</span>
          <span className="sm:hidden">Upload</span>
        </a>
      </div>
    </header>
  );
}
