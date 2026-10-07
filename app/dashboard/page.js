'use client';

import React, { useState, useEffect } from 'react';
import KPICard from '@/components/KPICard.js';
import FilterBar from '@/components/FilterBar.js';
import BarChartComponent from '@/components/Charts/BarChartComponent.js';
import PieChartComponent from '@/components/Charts/PieChartComponent.js';
import MarginDistributionChart from '@/components/Charts/MarginScatterComponent.js';
import DataTable from '@/components/DataTable.js';
import { CardSkeleton, LoadingSkeleton } from '@/components/LoadingSkeleton.js';
import { PartyBadge, PerformanceBadge } from '@/components/BoothBadge.js';
import { useYear } from '@/components/YearContext.js';
import {
  MapPin,
  FileSpreadsheet,
  Vote,
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
  Flame,
  Scale,
  Calendar,
  GitCompare,
} from 'lucide-react';

export default function OverviewDashboard() {
  const { selectedYear, meta } = useYear();
  const [filters, setFilters] = useState({
    district: '',
    ac: '',
    category: '',
    candidate: '',
    search: '',
  });

  const [stats, setStats] = useState(null);
  const [marginData, setMarginData] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('year', String(selectedYear));
      if (filters.district) params.append('district', filters.district);
      if (filters.ac) params.append('assemblyConstituency', filters.ac);

      const [overviewRes, marginRes] = await Promise.all([
        fetch(`/api/analytics/overview?${params.toString()}`),
        fetch(`/api/analytics/margins?${params.toString()}`),
      ]);

      const [overviewJson, marginJson] = await Promise.all([
        overviewRes.json(),
        marginRes.json(),
      ]);

      if (overviewJson.success) setStats(overviewJson.data);
      if (marginJson.success) setMarginData(marginJson.data);
      // Source-file registry is intentionally not part of the read-only API.
      setRecentFiles([]);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, filters.district, filters.ac]);

  const performancePieData = stats?.performanceDistribution
    ? [
        { name: 'Strong (≥50%)', value: stats.performanceDistribution.strong, color: '#10b981' },
        { name: 'Medium (30-49%)', value: stats.performanceDistribution.medium, color: '#f59e0b' },
        { name: 'Weak (<30%)', value: stats.performanceDistribution.weak, color: '#ef4444' },
      ].filter((d) => d.value > 0)
    : [];

  const topDistrictsBarData = stats?.topDistricts
    ? stats.topDistricts.map((d) => ({
        name: d.district,
        booths: d.booths,
        votes: d.votes,
      }))
    : [];

  const contestColumns = [
    {
      key: 'district',
      label: 'District & AC',
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-900 block">{val}</span>
          <span className="text-[11px] text-slate-500">{row.assemblyConstituency}</span>
        </div>
      ),
    },
    {
      key: 'boothNumber',
      label: 'Booth #',
      render: (val) => (
        <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
          #{val}
        </span>
      ),
    },
    {
      key: 'winner',
      label: 'Winner',
      render: (w) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 truncate max-w-[130px]">{w?.candidate || '—'}</span>
          <PartyBadge party={w?.party} />
        </div>
      ),
    },
    {
      key: 'runnerUp',
      label: 'Runner-up',
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="text-slate-600 truncate max-w-[130px]">{r?.candidate || '—'}</span>
          <PartyBadge party={r?.party} />
        </div>
      ),
    },
    {
      key: 'winningMargin',
      label: 'Margin',
      render: (val) => (
        <span className="font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-xs inline-block">
          +{Number(val).toLocaleString()} {Number(val) === 1 ? 'vote' : 'votes'}
        </span>
      ),
    },
  ];

  const victoryColumns = [
    {
      key: 'district',
      label: 'District & AC',
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-900 block">{val}</span>
          <span className="text-[11px] text-slate-500">{row.assemblyConstituency}</span>
        </div>
      ),
    },
    {
      key: 'boothNumber',
      label: 'Booth #',
      render: (val) => (
        <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
          #{val}
        </span>
      ),
    },
    {
      key: 'winner',
      label: 'Winner',
      render: (w) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 truncate max-w-[130px]">{w?.candidate || '—'}</span>
          <PartyBadge party={w?.party} />
        </div>
      ),
    },
    {
      key: 'winningMargin',
      label: 'Victory Margin',
      render: (val) => (
        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs inline-block">
          +{Number(val).toLocaleString()} votes
        </span>
      ),
    },
    {
      key: 'performanceCategory',
      label: 'Rating',
      render: (cat) => <PerformanceBadge category={cat} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome with Leadership Showcase */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-50/90 via-white to-amber-50/60 p-5 sm:p-6 border border-orange-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-800 bg-orange-100/80 px-2.5 py-0.5 rounded-full border border-orange-300 flex items-center gap-1.5">
              <img src="/BJP-Symbol.png" alt="BJP" className="w-3.5 h-3.5 object-contain" />
              <span>{selectedYear} Election Analysis</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {meta?.type || 'Form 20 Data'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit',sans-serif]">
            {meta?.label || `${selectedYear} Electoral Intelligence & Booth Analytics`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Real-time polling station classification, victory margins, candidate dynamics, and booth-level turnout tracking for the {selectedYear} elections.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href="/dashboard/compare"
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Multi-Year Trends</span>
            </a>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active Year: <strong className="text-slate-900 font-extrabold">{selectedYear}</strong></span>
            </span>
          </div>
        </div>

        {/* Leadership Showcase Cards */}
        <div className="flex items-center gap-3 self-start lg:self-center">
          {/* PM Modi */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/90 border border-orange-200 shadow-xs backdrop-blur-xs">
            <img
              src="/PM_Modi.jpg"
              alt="Hon'ble PM Narendra Modi"
              className="w-12 h-12 rounded-xl object-cover border-2 border-orange-300 shadow-sm"
            />
            <div className="min-w-0">
              <span className="font-extrabold text-xs text-slate-900 block leading-tight">
                Narendra Modi
              </span>
              <span className="text-[10px] text-orange-700 font-bold block">
                Hon'ble Prime Minister
              </span>
            </div>
          </div>

          {/* CM Yogi */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/90 border border-orange-200 shadow-xs backdrop-blur-xs">
            <img
              src="/CM_Yogi.jpg"
              alt="Hon'ble CM Yogi Adityanath"
              className="w-12 h-12 rounded-xl object-cover border-2 border-orange-300 shadow-sm"
            />
            <div className="min-w-0">
              <span className="font-extrabold text-xs text-slate-900 block leading-tight">
                Yogi Adityanath
              </span>
              <span className="text-[10px] text-orange-700 font-bold block">
                Hon'ble Chief Minister
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Filter Bar */}
      <FilterBar
        selectedDistrict={filters.district}
        selectedAc={filters.ac}
        selectedCategory={filters.category}
        selectedCandidate={filters.candidate}
        search={filters.search}
        onFilterChange={setFilters}
        showCategory={false}
        showCandidate={false}
      />

      {/* Top KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Districts"
            value={stats?.totalDistricts || 0}
            subtitle="Analyzed Districts"
            icon={MapPin}
            gradient="from-emerald-50 to-teal-50"
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 border-emerald-200"
            badge="100% Verified"
            badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
          />

          <KPICard
            title="Total Booths Extracted"
            value={stats?.totalBooths || 0}
            subtitle="Polling Stations"
            icon={Vote}
            gradient="from-blue-50 to-indigo-50"
            iconColor="text-blue-600"
            iconBg="bg-blue-50 border-blue-200"
            badge="Active EVMs"
            badgeColor="bg-blue-50 text-blue-700 border-blue-200"
          />

          <KPICard
            title="Total Votes Polled"
            value={stats?.totalVotes || 0}
            subtitle={`Valid: ${(stats?.totalValidVotes || 0).toLocaleString()}`}
            icon={CheckCircle2}
            gradient="from-purple-50 to-pink-50"
            iconColor="text-purple-600"
            iconBg="bg-purple-50 border-purple-200"
            badge={`NOTA: ${(stats?.totalNota || 0).toLocaleString()}`}
            badgeColor="bg-purple-50 text-purple-700 border-purple-200"
          />

          <KPICard
            title="Avg Winning Margin"
            value={`${(stats?.avgWinningMargin || 0).toLocaleString()} votes`}
            subtitle={`Candidates: ${(stats?.totalCandidates || 0).toLocaleString()}`}
            icon={Award}
            gradient="from-amber-50 to-orange-50"
            iconColor="text-amber-600"
            iconBg="bg-amber-50 border-amber-200"
            badge="Booth Avg"
            badgeColor="bg-amber-50 text-amber-700 border-amber-200"
          />
        </div>
      )}

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District Booth Distribution */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                Top Districts by Booth Count
              </h3>
              <p className="text-xs text-slate-500">Total polling stations per district</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              Form 20 Extracted
            </span>
          </div>
          <BarChartComponent
            data={topDistrictsBarData}
            xKey="name"
            dataKey="booths"
            barName="Booths"
            fillColor="#3b82f6"
            height={280}
          />
        </div>

        {/* Booth Classification Donut */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                  Booth Performance
                </h3>
                <p className="text-xs text-slate-500">Vote share categorization</p>
              </div>
              <a
                href="/dashboard/settings"
                className="text-xs text-emerald-600 hover:text-emerald-700 underline font-semibold"
              >
                Configure
              </a>
            </div>
            <PieChartComponent
              data={performancePieData}
              dataKey="value"
              nameKey="name"
              height={220}
              innerRadius={55}
              outerRadius={80}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="block text-[10px] font-bold text-emerald-700 uppercase">Strong</span>
              <span className="text-sm font-extrabold text-slate-900">
                {(stats?.performanceDistribution?.strong || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
              <span className="block text-[10px] font-bold text-amber-700 uppercase">Medium</span>
              <span className="text-sm font-extrabold text-slate-900">
                {(stats?.performanceDistribution?.medium || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
              <span className="block text-[10px] font-bold text-rose-700 uppercase">Weak</span>
              <span className="text-sm font-extrabold text-slate-900">
                {(stats?.performanceDistribution?.weak || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Margin Distribution Section */}
      <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                Winning Margin Distribution
              </h3>
              <p className="text-xs text-slate-500">Booth count across vote margin brackets</p>
            </div>
          </div>
          <span className="text-xs text-slate-500">Votes lead between #1 and #2</span>
        </div>
        <MarginDistributionChart data={marginData?.marginDistribution || []} height={250} />
      </div>

      {/* Closest Contests & Biggest Victories Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Closest Contests */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                Closest Contests (Razor-thin Margins)
              </h3>
              <p className="text-xs text-slate-500">Booths decided by the fewest votes</p>
            </div>
          </div>

          <DataTable
            columns={contestColumns}
            data={marginData?.closestContests || []}
            loading={loading}
            emptyTitle="No contest data"
          />
        </div>

        {/* Biggest Victories */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                Landslide Victories (Largest Margins)
              </h3>
              <p className="text-xs text-slate-500">Booths with massive winning leads</p>
            </div>
          </div>

          <DataTable
            columns={victoryColumns}
            data={marginData?.biggestVictories || []}
            loading={loading}
            emptyTitle="No victory data"
          />
        </div>
      </div>
    </div>
  );
}
