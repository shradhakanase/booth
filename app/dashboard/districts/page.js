'use client';

import React, { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable.js';
import { PartyBadge } from '@/components/BoothBadge.js';
import { useYear } from '@/components/YearContext.js';
import { MapPin, Search, BarChart3, FileSpreadsheet, Vote, X, Trophy, Calendar } from 'lucide-react';

export default function DistrictsPage() {
  const { selectedYear } = useYear();
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('totalVotes');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtDetails, setDistrictDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchDistricts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/districts?year=${selectedYear}&search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
      const json = await res.json();
      if (json.success) {
        setDistricts(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch districts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistricts();
  }, [selectedYear, search, sortBy, sortOrder]);

  const handleRowClick = async (districtRow) => {
    setSelectedDistrict(districtRow.districtName);
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/districts/${encodeURIComponent(districtRow.districtName)}?year=${selectedYear}`);
      const json = await res.json();
      if (json.success) {
        setDistrictDetails(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch district details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const columns = [
    {
      key: 'districtName',
      label: 'District Name',
      sortable: true,
      render: (val) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm block">{val}</span>
            <span className="text-[10px] text-slate-500">Uttar Pradesh</span>
          </div>
        </div>
      ),
    },
    {
      key: 'totalFiles',
      label: 'Source Files',
      sortable: true,
      render: (val) => <span className="font-semibold text-slate-700">{val || 0}</span>,
    },
    {
      key: 'totalConstituencies',
      label: 'Constituencies',
      sortable: true,
      render: (val) => <span className="font-semibold text-slate-700">{val || 0}</span>,
    },
    {
      key: 'totalBooths',
      label: 'Total Booths',
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
      key: 'avgVotesPerBooth',
      label: 'Avg / Booth',
      sortable: true,
      render: (val) => <span className="text-slate-700 font-semibold">{val || 0}</span>,
    },
    {
      key: 'winningCandidate',
      label: 'Leading Candidate',
      render: (val, row) =>
        val ? (
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 truncate max-w-[130px]">{val}</span>
            <PartyBadge party={row.winningParty} />
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {selectedYear} Districts
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit',sans-serif]">
            {selectedYear} District Analytics & Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explore and compare election stats, turnout, and vote shares across districts in the {selectedYear} elections.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search districts..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-sm"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Main Districts Table */}
      <DataTable
        columns={columns}
        data={districts}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={handleRowClick}
        emptyTitle="No districts found"
        emptyDescription="Try searching for another district name."
      />

      {/* District Detail Modal / Drawer */}
      {selectedDistrict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-['Outfit',sans-serif]">
                    {selectedDistrict} Analytics
                  </h3>
                  <p className="text-xs text-slate-500">District Deep-Dive & Constituency Breakdown</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDistrict(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {detailsLoading ? (
                <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                  Loading district analytics...
                </div>
              ) : districtDetails ? (
                <>
                  {/* Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-semibold">Total Booths</span>
                      <span className="text-base font-extrabold text-slate-900">
                        {Number(districtDetails.totalBooths || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-semibold">Total Votes</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        {Number(districtDetails.totalVotes || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-semibold">Files Parsed</span>
                      <span className="text-base font-extrabold text-blue-700">
                        {districtDetails.totalFiles || 0}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-semibold">Avg Booth Turnout</span>
                      <span className="text-base font-extrabold text-amber-700">
                        {districtDetails.avgVotesPerBooth || 0}
                      </span>
                    </div>
                  </div>

                  {/* Constituencies List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      Assembly Constituencies ({districtDetails.constituencies?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {districtDetails.constituencies?.map((c) => (
                        <div
                          key={c._id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/80 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {c.acNo ? `${c.acNo} - ` : ''}{c.acName}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {c.totalBooths} booths • Winner: {c.winner?.candidate || '—'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-600 block">
                              {Number(c.totalVotes).toLocaleString()} votes
                            </span>
                            <PartyBadge party={c.winner?.party} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Candidates in District */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      Top Candidates
                    </h4>
                    <div className="space-y-2">
                      {districtDetails.topCandidates?.slice(0, 5).map((cand, idx) => (
                        <div
                          key={cand._id || idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-900">{cand.candidateName}</span>
                            <PartyBadge party={cand.party} />
                          </div>
                          <span className="font-extrabold text-slate-900">
                            {Number(cand.totalVotes).toLocaleString()} votes
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
