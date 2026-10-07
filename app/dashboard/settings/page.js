'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Sliders, RefreshCw, CheckCircle2, ShieldCheck, Database, Save, Calendar } from 'lucide-react';
import Toast from '@/components/Toast.js';
import { useYear } from '@/components/YearContext.js';

export default function SettingsPage() {
  const { selectedYear, availableYears } = useYear();
  const [thresholds, setThresholds] = useState({ strong: 50, medium: 30, weak: 0 });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [reclassifyScope, setReclassifyScope] = useState('all'); // 'all' or 'current'

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.success && json.data) {
          setThresholds(json.data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...thresholds,
          year: reclassifyScope === 'current' ? selectedYear : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setToast({
          type: 'success',
          message: `Thresholds updated and booths reclassified successfully ${
            reclassifyScope === 'current' ? `for year ${selectedYear}` : 'across all election years'
          }!`,
        });
      } else {
        setToast({ type: 'error', message: json.error });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit',sans-serif]">
            System Settings & Performance Rules
          </h1>
          {selectedYear && (
            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
              {selectedYear} Active
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure dynamic rules for classifying Strong, Medium, and Weak polling stations across all election years.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Form */}
        <form
          onSubmit={handleSave}
          className="md:col-span-2 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                Booth Performance Thresholds
              </h3>
              <p className="text-xs text-slate-500">Winning candidate vote share % boundaries</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Strong Booth */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Strong Booth Threshold (≥ %)
                </label>
                <span className="font-extrabold text-slate-900 text-sm">{thresholds.strong}%</span>
              </div>
              <input
                type="range"
                min="35"
                max="80"
                step="1"
                value={thresholds.strong}
                onChange={(e) =>
                  setThresholds((prev) => ({ ...prev, strong: Number(e.target.value) }))
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-600">
                Polling stations where the winner secured {thresholds.strong}% or more of the valid votes.
              </p>
            </div>

            {/* Medium Booth */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Medium Booth Threshold (≥ %)
                </label>
                <span className="font-extrabold text-slate-900 text-sm">{thresholds.medium}%</span>
              </div>
              <input
                type="range"
                min="15"
                max={thresholds.strong - 1}
                step="1"
                value={thresholds.medium}
                onChange={(e) =>
                  setThresholds((prev) => ({ ...prev, medium: Number(e.target.value) }))
                }
                className="w-full accent-amber-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-600">
                Polling stations where the winner secured between {thresholds.medium}% and {thresholds.strong - 0.01}%.
              </p>
            </div>

            {/* Weak Booth */}
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                  Weak Booth (&lt; %)
                </label>
                <span className="font-extrabold text-slate-900 text-sm">&lt; {thresholds.medium}%</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Booths where winner vote share is under {thresholds.medium}%. High vulnerability zones.
              </p>
            </div>
            {/* Reclassification Scope */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Reclassification Scope
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReclassifyScope('all')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center ${
                    reclassifyScope === 'all'
                      ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Election Years
                </button>
                <button
                  type="button"
                  onClick={() => setReclassifyScope('current')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center ${
                    reclassifyScope === 'current'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Only Year {selectedYear || 'Active'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                {reclassifyScope === 'all'
                  ? 'Recalculates booth strong/medium/weak classification across all datasets in MongoDB.'
                  : `Recalculates classification only for booths from election year ${selectedYear}.`}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 disabled:opacity-50 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Reclassifying Booths...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Rules & Reclassify Database</span>
              </>
            )}
          </button>
        </form>

        {/* Database Status Diagnostics Card */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit',sans-serif]">
                Database Status
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Engine</span>
                <span className="font-bold text-slate-900">MongoDB + Mongoose</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Health</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Active Year</span>
                <span className="font-bold text-indigo-700">{selectedYear || '2024'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Indexed Collections</span>
                <span className="font-mono text-slate-700">booths, districts, files</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Ingested Booths</span>
                <span className="font-extrabold text-emerald-700">92,000+ Records</span>
              </div>
            </div>
          </div>

          {/* Multi-Year Breakdown Card */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Calendar className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit',sans-serif]">
                Election Years Detected
              </h4>
            </div>

            <div className="space-y-2">
              {availableYears.map((y) => (
                <div
                  key={y.year}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    y.year === selectedYear
                      ? 'bg-indigo-50/70 border-indigo-200 font-bold text-indigo-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white font-extrabold shadow-xs text-xs">
                      {y.year}
                    </span>
                    <span className="text-slate-600">{y.label || 'Assembly Election'}</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    {y.boothsCount ? `${y.boothsCount.toLocaleString()} booths` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
