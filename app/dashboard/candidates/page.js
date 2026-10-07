'use client';

import React, { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable.js';
import FilterBar from '@/components/FilterBar.js';
import { PartyBadge } from '@/components/BoothBadge.js';
import { useYear } from '@/components/YearContext.js';
import { Users, Trophy, Award, TrendingUp, Search, Calendar } from 'lucide-react';

export default function CandidatesPage() {
  const { selectedYear } = useYear();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    district: '',
    ac: '',
    party: '',
    search: '',
  });
  const [sortBy, setSortBy] = useState('totalVotes');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('year', String(selectedYear));
      if (filters.district) params.append('district', filters.district);
      if (filters.ac) params.append('ac', filters.ac);
      if (filters.party) params.append('party', filters.party);
      if (filters.search) params.append('search', filters.search);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const res = await fetch(`/api/candidates?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCandidates(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedYear, filters.district, filters.ac, filters.party, filters.search, sortBy, sortOrder]);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const columns = [
    {
      key: 'candidateName',
      label: 'Candidate Name',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-xs">
            {val ? val.charAt(0) : 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm block">{val}</span>
              {row.isWinner && (
                <span className="p-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200" title="Constituency Winner">
                  <Trophy className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">{row.assemblyConstituency} • {row.district}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'party',
      label: 'Party',
      sortable: true,
      render: (val) => <PartyBadge party={val} />,
    },
    {
      key: 'totalVotes',
      label: 'Total Votes',
      sortable: true,
      render: (val) => (
        <span className="font-bold text-emerald-600 text-sm">
          {Number(val || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'boothsWon',
      label: 'Booths Won',
      sortable: true,
      render: (val, row) => (
        <div className="space-y-1">
          <span className="font-bold text-slate-900 block">
            {val || 0} / {row.totalBoothsContested || 0}
          </span>
          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{
                width: `${row.totalBoothsContested > 0 ? (val / row.totalBoothsContested) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'avgVotesPerBooth',
      label: 'Avg Votes / Booth',
      sortable: true,
      render: (val) => <span className="font-semibold text-slate-700">{val || 0}</span>,
    },
    {
      key: 'highestVoteBooth',
      label: 'Best Booth',
      render: (b) =>
        b?.votes !== undefined ? (
          <div className="text-xs">
            <span className="font-bold text-emerald-700 block">+{b.votes} votes</span>
            <span className="text-[10px] text-slate-500">Booth #{b.boothNumber}</span>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'lowestVoteBooth',
      label: 'Lowest Booth',
      render: (b) =>
        b?.votes !== undefined ? (
          <div className="text-xs">
            <span className="font-semibold text-slate-600 block">{b.votes} votes</span>
            <span className="text-[10px] text-slate-400">Booth #{b.boothNumber}</span>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            {selectedYear} Candidates
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit',sans-serif]">
          {selectedYear} Candidate Performance Analysis
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Compare candidate vote totals, booth victory rates, highest/lowest performing polling stations in {selectedYear}.
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

      <DataTable
        columns={columns}
        data={candidates}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyTitle="No candidates found"
        emptyDescription="Try searching by candidate name or selecting another district."
      />
    </div>
  );
}
