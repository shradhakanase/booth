'use client';

import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Layers,
  MapPin,
  Vote,
  ShieldCheck,
  Flame,
  Award,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { useYear } from '@/components/YearContext.js';
import MultiBarChartComponent from '@/components/Charts/MultiBarChartComponent.js';
import MultiLineChartComponent from '@/components/Charts/MultiLineChartComponent.js';

export default function MultiYearComparisonPage() {
  const { availableYears } = useYear();
  const [viewMode, setViewMode] = useState('h2h'); // 'h2h' (Head-to-Head) or 'multi' (All Selected Years)
  const [baseYear, setBaseYear] = useState(2024);
  const [compareYear, setCompareYear] = useState(2022);
  const [selectedMultiYears, setSelectedMultiYears] = useState([2024, 2022, 2019, 2017]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districtList, setDistrictList] = useState([]);
  const [districtSearch, setDistrictSearch] = useState('');

  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch list of districts
  useEffect(() => {
    async function loadDistricts() {
      try {
        const res = await fetch('/api/districts');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDistrictList(json.data.map((d) => d.districtName || d._id).filter(Boolean));
        }
      } catch (err) {
        console.error('Failed to load districts list for comparison:', err);
      }
    }
    loadDistricts();
  }, []);

  // Fetch comparison metrics
  const fetchComparison = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (viewMode === 'h2h') {
        params.append('baseYear', baseYear);
        params.append('compareYear', compareYear);
        params.append('years', `${baseYear},${compareYear}`);
      } else {
        params.append('baseYear', baseYear);
        params.append('compareYear', compareYear);
        params.append('years', selectedMultiYears.join(','));
      }
      if (selectedDistrict) params.append('district', selectedDistrict);

      const res = await fetch(`/api/analytics/compare?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setComparisonData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch comparison data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [viewMode, baseYear, compareYear, selectedMultiYears, selectedDistrict]);

  const toggleMultiYear = (yr) => {
    if (selectedMultiYears.includes(yr)) {
      if (selectedMultiYears.length > 1) {
        setSelectedMultiYears(selectedMultiYears.filter((y) => y !== yr));
      }
    } else {
      setSelectedMultiYears([...selectedMultiYears, yr].sort((a, b) => b - a));
    }
  };

  const delta = comparisonData?.delta || {};
  const baseStats = comparisonData?.yearStatsMap?.[baseYear] || {};
  const compStats = comparisonData?.yearStatsMap?.[compareYear] || {};

  // Format Party Comparison Chart Data
  const partyChartData = (comparisonData?.partyList || []).map((p) => {
    const row = { name: p.party };
    if (viewMode === 'h2h') {
      row[`${baseYear}`] = p.baseWins;
      row[`${compareYear}`] = p.compWins;
    } else {
      selectedMultiYears.forEach((yr) => {
        row[`${yr}`] = p.years?.[yr]?.boothsWon || 0;
      });
    }
    return row;
  });

  const partyBars =
    viewMode === 'h2h'
      ? [
          { dataKey: `${baseYear}`, name: `${baseYear} Booths Won`, color: '#4f46e5' },
          { dataKey: `${compareYear}`, name: `${compareYear} Booths Won`, color: '#06b6d4' },
        ]
      : selectedMultiYears.map((yr, idx) => {
          const colors = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'];
          return { dataKey: `${yr}`, name: `Year ${yr}`, color: colors[idx % colors.length] };
        });

  // Performance Category Comparison Chart Data
  const categoryChartData = [
    {
      name: 'Strong (≥50%)',
      [`${baseYear}`]: baseStats.strongBooths || 0,
      [`${compareYear}`]: compStats.strongBooths || 0,
    },
    {
      name: 'Medium (30-50%)',
      [`${baseYear}`]: baseStats.mediumBooths || 0,
      [`${compareYear}`]: compStats.mediumBooths || 0,
    },
    {
      name: 'Weak (<30%)',
      [`${baseYear}`]: baseStats.weakBooths || 0,
      [`${compareYear}`]: compStats.weakBooths || 0,
    },
  ];

  // Multi-Year Trend Lines
  const trendLines = [
    { dataKey: 'totalVotes', name: 'Total Votes', color: '#6366f1' },
    { dataKey: 'totalBooths', name: 'Total Booths', color: '#10b981' },
  ];

  // Filtered District Comparison List
  const filteredDistricts = (comparisonData?.districtComparisonList || []).filter((d) =>
    d.district.toLowerCase().includes(districtSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit',sans-serif]">
                Multi-Year Comparative Engine
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Compare voter trends, party dominance, booth shifts, and victory margins across election cycles.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setViewMode('h2h')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'h2h'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Head-to-Head</span>
          </button>
          <button
            onClick={() => setViewMode('multi')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'multi'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Year Longitudinal</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Selectors & District Filter */}
      <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {viewMode === 'h2h' ? (
            /* Head-to-Head Year Selectors */
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Base Year:</span>
                <select
                  value={baseYear}
                  onChange={(e) => setBaseYear(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50/80 border border-indigo-200 text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y.year} value={y.year}>
                      {y.year} ({y.type || 'Election'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-black text-xs">
                VS
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Compare With:</span>
                <select
                  value={compareYear}
                  onChange={(e) => setCompareYear(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-cyan-50/80 border border-cyan-200 text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y.year} value={y.year} disabled={y.year === baseYear}>
                      {y.year} ({y.type || 'Election'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* Multi-Year Checkbox Selector Pills */
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 mr-1">Include Years:</span>
              {availableYears.map((y) => {
                const active = selectedMultiYears.includes(y.year);
                return (
                  <button
                    key={y.year}
                    onClick={() => toggleMultiYear(y.year)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {y.year} {active && '✓'}
                  </button>
                );
              })}
            </div>
          )}

          {/* District Scope Filter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Districts (Statewide)</option>
                {districtList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchComparison}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Refresh comparison"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* DELTA KPI CARDS (Head-to-Head Mode) */}
      {viewMode === 'h2h' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Votes Delta */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Polled Votes
              </span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  delta.voteDelta >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {delta.voteDelta >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {delta.voteGrowthPct}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-['Outfit',sans-serif]">
                {(baseStats.totalVotes || 0).toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                vs {(compStats.totalVotes || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Shift of {delta.voteDelta >= 0 ? '+' : ''}
              {(delta.voteDelta || 0).toLocaleString()} votes between {baseYear} & {compareYear}.
            </p>
          </div>

          {/* Total Polling Stations Delta */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Polling Booths
              </span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  delta.boothDelta >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {delta.boothDelta >= 0 ? '+' : ''}
                {delta.boothDelta}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-['Outfit',sans-serif]">
                {(baseStats.totalBooths || 0).toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                vs {(compStats.totalBooths || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {delta.boothDelta >= 0 ? 'Increase' : 'Difference'} of {Math.abs(delta.boothDelta || 0)} booths across datasets.
            </p>
          </div>

          {/* Average Victory Margin Delta */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Avg Victory Margin
              </span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  delta.marginDelta >= 0
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {delta.marginDelta >= 0 ? '+' : ''}
                {delta.marginDelta} votes
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-['Outfit',sans-serif]">
                {baseStats.avgWinningMargin || 0} votes
              </span>
              <span className="text-xs text-slate-400 font-medium">
                vs {compStats.avgWinningMargin || 0}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {delta.marginDelta >= 0 ? 'Wider' : 'Tighter'} victory spread in {baseYear} compared to {compareYear}.
            </p>
          </div>

          {/* Strong Booths Migration */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Strong Booths (≥50%)
              </span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  delta.strongDelta >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {delta.strongDelta >= 0 ? '+' : ''}
                {delta.strongDelta}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-700 font-['Outfit',sans-serif]">
                {(baseStats.strongBooths || 0).toLocaleString()} ({baseStats.strongPct || 0}%)
              </span>
              <span className="text-xs text-slate-400 font-medium">
                vs {compStats.strongBooths || 0}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {delta.strongDelta >= 0 ? 'Expansion' : 'Contraction'} of stronghold polling stations.
            </p>
          </div>
        </div>
      )}

      {/* MULTI-YEAR LONGITUDINAL TREND CHART (Multi-Year Mode) */}
      {viewMode === 'multi' && (
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                  Multi-Year Longitudinal Growth Curve
                </h3>
                <p className="text-xs text-slate-500">
                  Total Polled Votes and Polling Station Counts from 2017 to 2024
                </p>
              </div>
            </div>
          </div>
          <MultiLineChartComponent
            data={comparisonData?.timeline || []}
            xKey="year"
            lines={trendLines}
            height={320}
          />
        </div>
      )}

      {/* CHARTS GRID: Party Share Comparison & Booth Classification Shift */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Party Booth Share Comparison */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                  Party Dominance Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  Booths won by political party in {viewMode === 'h2h' ? `${baseYear} vs ${compareYear}` : 'selected years'}
                </p>
              </div>
            </div>
          </div>

          <MultiBarChartComponent data={partyChartData} xKey="name" bars={partyBars} height={300} />
        </div>

        {/* Classification Shift (Strong / Medium / Weak) */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                  Booth Performance Classification Shift
                </h3>
                <p className="text-xs text-slate-500">
                  Comparison of Strong (≥50%), Medium (30-50%), and Weak (&lt;30%) polling stations
                </p>
              </div>
            </div>
          </div>

          <MultiBarChartComponent
            data={categoryChartData}
            xKey="name"
            bars={[
              { dataKey: `${baseYear}`, name: `${baseYear} Booths`, color: '#10b981' },
              { dataKey: `${compareYear}`, name: `${compareYear} Booths`, color: '#6366f1' },
            ]}
            height={300}
          />
        </div>
      </div>

      {/* DISTRICT-BY-DISTRICT COMPARATIVE MATRIX TABLE */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                District Comparative Matrix & Swing Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Detailed side-by-side vote volume, booth presence, and margin shift across districts
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search district..."
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4 text-right">{baseYear} Votes</th>
                <th className="py-3 px-4 text-right">{compareYear} Votes</th>
                <th className="py-3 px-4 text-right">Vote Shift (Delta)</th>
                <th className="py-3 px-4 text-center">Swing %</th>
                <th className="py-3 px-4 text-right">{baseYear} Booths</th>
                <th className="py-3 px-4 text-right">{compareYear} Booths</th>
                <th className="py-3 px-4 text-right">{baseYear} Avg Margin</th>
                <th className="py-3 px-4 text-right">{compareYear} Avg Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDistricts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No district comparison data matching search.
                  </td>
                </tr>
              ) : (
                filteredDistricts.map((d) => (
                  <tr key={d.district} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{d.district}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-indigo-700">
                      {(d.baseVotes || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {(d.compVotes || 0).toLocaleString()}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        d.voteDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {d.voteDelta >= 0 ? '+' : ''}
                      {(d.voteDelta || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                          d.voteGrowthPct === 'N/A'
                            ? 'bg-slate-100 text-slate-600'
                            : Number(d.voteGrowthPct) >= 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {d.voteGrowthPct !== 'N/A' && Number(d.voteGrowthPct) >= 0 ? '+' : ''}
                        {d.voteGrowthPct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {(d.baseBooths || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {(d.compBooths || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-indigo-900">
                      {d.baseMargin || 0}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {d.compMargin || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
