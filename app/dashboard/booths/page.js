'use client';

import React, { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable.js';
import FilterBar from '@/components/FilterBar.js';
import { PartyBadge, PerformanceBadge } from '@/components/BoothBadge.js';
import { useYear } from '@/components/YearContext.js';
import { Vote, X, Award, CheckCircle2, ChevronRight, BarChart2, Calendar } from 'lucide-react';

export default function BoothsPage() {
  const { selectedYear } = useYear();
  const [booths, setBooths] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    district: '',
    ac: '',
    category: '',
    candidate: '',
    search: '',
  });
  const [sortBy, setSortBy] = useState('boothNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedBooth, setSelectedBooth] = useState(null);

  const fetchBooths = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('year', String(selectedYear));
      if (filters.district) params.append('district', filters.district);
      if (filters.ac) params.append('assemblyConstituency', filters.ac);
      if (filters.category) params.append('performanceCategory', filters.category);
      if (filters.candidate) params.append('candidate', filters.candidate);
      if (filters.search) params.append('search', filters.search);
      params.append('page', String(page));
      params.append('limit', '50');
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const res = await fetch(`/api/booths?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setBooths(json.data || []);
        setPagination(json.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch booths:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooths(1);
  }, [selectedYear, filters.district, filters.ac, filters.category, filters.candidate, filters.search, sortBy, sortOrder]);

  const handlePageChange = (newPage) => {
    fetchBooths(newPage);
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const columns = [
    {
      key: 'boothNumber',
      label: 'Booth #',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-xs text-slate-800">
            {val}
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline truncate max-w-[160px]">
            {row.pollingStation || `Station ${val}`}
          </span>
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
      key: 'assemblyConstituency',
      label: 'Constituency',
      sortable: true,
      render: (val) => <span className="font-medium text-slate-700 truncate max-w-[140px] block">{val}</span>,
    },
    {
      key: 'totalVotes',
      label: 'Total Votes',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-900 block">{Number(val || 0).toLocaleString()}</span>
          <span className="text-[10px] text-slate-500">NOTA: {row.nota || 0}</span>
        </div>
      ),
    },
    {
      key: 'winner',
      label: 'Winner & Margin',
      render: (w, row) =>
        w?.candidate ? (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 truncate max-w-[130px]">{w.candidate}</span>
              <PartyBadge party={w.party} />
            </div>
            <div className="text-[11px] text-emerald-700 font-bold">
              +{Number(row.winningMargin || 0).toLocaleString()} {Number(row.winningMargin) === 1 ? 'vote' : 'votes'} ({w.voteShare || 0}%)
            </div>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'performanceCategory',
      label: 'Classification',
      sortable: true,
      render: (cat) => <PerformanceBadge category={cat} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {selectedYear} Booth Data
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit',sans-serif]">
          {selectedYear} Booth Explorer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Detailed booth-by-booth voting records, candidate shares, victory margins, and classification in {selectedYear}.
        </p>
      </div>

      <FilterBar
        selectedDistrict={filters.district}
        selectedAc={filters.ac}
        selectedCategory={filters.category}
        selectedCandidate={filters.candidate}
        search={filters.search}
        onFilterChange={setFilters}
        showCategory={true}
        showCandidate={true}
      />

      <DataTable
        columns={columns}
        data={booths}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRowClick={(row) => setSelectedBooth(row)}
        emptyTitle="No booths found"
        emptyDescription="Try selecting another district or constituency."
      />

      {/* Deep Booth Modal */}
      {selectedBooth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-extrabold">
                  #{selectedBooth.boothNumber}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                    Booth #{selectedBooth.boothNumber} — {selectedBooth.pollingStation}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedBooth.assemblyConstituency} • {selectedBooth.district}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedBooth(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Top Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">Total Votes</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {Number(selectedBooth.totalVotes).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">Valid Votes</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {Number(selectedBooth.validVotes).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">NOTA</span>
                  <span className="text-base font-extrabold text-purple-700">
                    {selectedBooth.nota || 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">Margin</span>
                  <span className="text-base font-extrabold text-amber-700">
                    +{selectedBooth.winningMargin || 0}
                  </span>
                </div>
              </div>

              {/* Performance category pill */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Classification</span>
                <PerformanceBadge category={selectedBooth.performanceCategory} />
              </div>

              {/* Candidate Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Candidate Votes in this Booth
                </h4>
                <div className="space-y-2.5">
                  {selectedBooth.candidateVotes?.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{c.candidate}</span>
                          <PartyBadge party={c.party} />
                        </div>
                        <span className="font-extrabold text-slate-900">
                          {c.votes} votes ({c.voteShare}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, c.voteShare || 0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source reference */}
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600">
                Source: <span className="text-slate-800 font-mono font-bold">{selectedBooth.sourceFile}</span> (Row {selectedBooth.sourceRow})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
