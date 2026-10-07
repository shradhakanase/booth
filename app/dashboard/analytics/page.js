'use client';

import React, { useState, useEffect } from 'react';
import FilterBar from '@/components/FilterBar.js';
import MarginDistributionChart from '@/components/Charts/MarginScatterComponent.js';
import BarChartComponent from '@/components/Charts/BarChartComponent.js';
import PieChartComponent from '@/components/Charts/PieChartComponent.js';
import AreaChartComponent from '@/components/Charts/AreaChartComponent.js';
import { LineChart, Trophy, Flame, Scale, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { useYear } from '@/components/YearContext.js';

export default function AnalyticsDeepDivePage() {
  const { selectedYear } = useYear();
  const [filters, setFilters] = useState({
    district: '',
    ac: '',
    search: '',
  });

  const [marginData, setMarginData] = useState(null);
  const [boothData, setBoothData] = useState(null);
  const [candidateData, setCandidateData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.append('year', selectedYear);
      if (filters.district) params.append('district', filters.district);
      if (filters.ac) params.append('assemblyConstituency', filters.ac);

      const [marginRes, boothRes, candRes] = await Promise.all([
        fetch(`/api/analytics/margins?${params.toString()}`),
        fetch(`/api/analytics/booth?${params.toString()}`),
        fetch(`/api/analytics/candidate?${params.toString()}`),
      ]);

      const [marginJson, boothJson, candJson] = await Promise.all([
        marginRes.json(),
        boothRes.json(),
        candRes.json(),
      ]);

      if (marginJson.success) setMarginData(marginJson.data);
      if (boothJson.success) setBoothData(boothJson.data);
      if (candJson.success) setCandidateData(candJson.data.slice(0, 10));
    } catch (err) {
      console.error('Failed to load analytics deep dive:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear, filters.district, filters.ac]);

  const partyDonutData = boothData?.partyDistribution
    ? boothData.partyDistribution.map((p) => ({
        name: p._id || 'IND',
        value: p.boothsWon,
      }))
    : [];

  const candidateBarData = candidateData.map((c) => ({
    name: c.candidateName.length > 15 ? c.candidateName.slice(0, 15) + '...' : c.candidateName,
    votes: c.totalVotes,
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit',sans-serif]">
            Electoral Analytics & Margin Engine
          </h1>
          {selectedYear && (
            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
              {selectedYear} Election
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Deep structural analysis of victory margins, party dominance, candidate spread and booth polarization for {selectedYear || 'all years'}.
        </p>
      </div>

      <FilterBar
        selectedDistrict={filters.district}
        selectedAc={filters.ac}
        search={filters.search}
        onFilterChange={setFilters}
        showCategory={false}
        showCandidate={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margin Distribution */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                Victory Margin Spectrum
              </h3>
              <p className="text-xs text-slate-500">Distribution of booth leads across vote intervals</p>
            </div>
          </div>
          <MarginDistributionChart data={marginData?.marginDistribution || []} height={280} />
        </div>

        {/* Party Dominance Donut */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                Party Share of Booth Victories
              </h3>
              <p className="text-xs text-slate-500">Total booths won by each political party</p>
            </div>
          </div>
          <PieChartComponent
            data={partyDonutData}
            dataKey="value"
            nameKey="name"
            height={280}
            innerRadius={65}
            outerRadius={95}
          />
        </div>

        {/* Top Candidates by Total Votes */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                Candidate Vote Volumes
              </h3>
              <p className="text-xs text-slate-500">Top candidates ranked by aggregate votes polled</p>
            </div>
          </div>
          <BarChartComponent
            data={candidateBarData}
            xKey="name"
            dataKey="votes"
            barName="Total Votes"
            fillColor="#10b981"
            height={300}
          />
        </div>
      </div>
    </div>
  );
}
