'use client';

import React, { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable.js';
import FilterBar from '@/components/FilterBar.js';
import { PartyBadge } from '@/components/BoothBadge.js';
import { useYear } from '@/components/YearContext.js';
import { Landmark, Trophy, ArrowRight, Calendar } from 'lucide-react';

export default function ConstituenciesPage() {
  const { selectedYear } = useYear();
  const [constituencies, setConstituencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    district: '',
    ac: '',
    search: '',
  });
  const [sortBy, setSortBy] = useState('totalVotes');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchConstituencies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('year', String(selectedYear));
      if (filters.district) params.append('district', filters.district);
      if (filters.search) params.append('search', filters.search);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const res = await fetch(`/api/constituencies?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setConstituencies(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch constituencies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConstituencies();
  }, [selectedYear, filters.district, filters.search, sortBy, sortOrder]);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const columns = [
    {
      key: 'acName',
      label: 'Assembly Constituency',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm block">
              {row.acNo ? `${row.acNo} - ` : ''}{val}
            </span>
            <span className="text-[10px] text-slate-500">{row.district}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'district',
      label: 'District',
      sortable: true,
      render: (val) => <span className="font-semibold text-slate-700">{val}</span>,
    },
    {
      key: 'totalBooths',
      label: 'Booths',
      sortable: true,
      render: (val) => (
        <span className="font-bold text-blue-600">{Number(val || 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'totalVotes',
      label: 'Total Votes',
      sortable: true,
      render: (val) => (
        <span className="font-bold text-emerald-600">{Number(val || 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'winner',
      label: 'Winner',
      render: (w) =>
        w?.candidate ? (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 truncate max-w-[130px]">{w.candidate}</span>
            <PartyBadge party={w.party} />
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'runnerUp',
      label: 'Runner-up',
      render: (r) =>
        r?.candidate ? (
          <div className="flex items-center gap-2">
            <span className="text-slate-600 truncate max-w-[130px]">{r.candidate}</span>
            <PartyBadge party={r.party} />
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'winningMargin',
      label: 'Margin',
      sortable: true,
      render: (val, row) => (
        <div className="space-y-0.5">
          <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-xs inline-block">
            +{Number(val || 0).toLocaleString()} votes
          </span>
          <span className="text-[10px] text-slate-500 block">
            {row.winningMarginPercent || 0}% lead
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            {selectedYear} Constituencies
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit',sans-serif]">
          {selectedYear} Assembly Constituencies Analysis
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Detailed constituency-level vote totals, winning margins, winners and runner-ups in {selectedYear}.
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
        data={constituencies}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyTitle="No constituencies found"
        emptyDescription="Try selecting another district or clearing filters."
      />
    </div>
  );
}
