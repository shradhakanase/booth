'use client';

import React, { useState, useEffect } from 'react';
import { Filter, X, Search, ChevronDown, Calendar } from 'lucide-react';
import { useYear } from './YearContext.js';

export default function FilterBar({
  selectedDistrict = '',
  selectedAc = '',
  selectedCategory = '',
  selectedCandidate = '',
  search = '',
  onFilterChange,
  showYear = true,
  showCategory = true,
  showCandidate = false,
}) {
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const [districts, setDistricts] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch districts when selectedYear changes
  useEffect(() => {
    async function loadDistricts() {
      try {
        const url = `/api/districts?year=${selectedYear}&sortBy=districtName&sortOrder=asc`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
          setDistricts(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load districts in FilterBar:', err);
      }
    }
    loadDistricts();
  }, [selectedYear]);

  // Fetch constituencies when district or year changes
  useEffect(() => {
    async function loadConstituencies() {
      try {
        const params = new URLSearchParams();
        params.append('year', String(selectedYear));
        if (selectedDistrict) params.append('district', selectedDistrict);
        params.append('sortBy', 'acName');
        params.append('sortOrder', 'asc');

        const res = await fetch(`/api/constituencies?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setConstituencies(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load constituencies:', err);
      }
    }
    loadConstituencies();
  }, [selectedDistrict, selectedYear]);

  // Fetch candidates if enabled
  useEffect(() => {
    if (!showCandidate) return;
    async function loadCandidates() {
      try {
        const params = new URLSearchParams();
        params.append('year', String(selectedYear));
        if (selectedDistrict) params.append('district', selectedDistrict);
        params.append('sortBy', 'candidateName');
        params.append('sortOrder', 'asc');

        const res = await fetch(`/api/candidates?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setCandidates(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load candidates:', err);
      }
    }
    loadCandidates();
  }, [selectedDistrict, selectedYear, showCandidate]);

  const handleYearChange = (e) => {
    const newYear = Number(e.target.value);
    setSelectedYear(newYear);
    onFilterChange({
      district: '',
      ac: '',
      category: selectedCategory,
      candidate: '',
      search,
    });
  };

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      district: val,
      ac: '', // reset AC when district changes
      category: selectedCategory,
      candidate: '',
      search,
    });
  };

  const handleAcChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      district: selectedDistrict,
      ac: val,
      category: selectedCategory,
      candidate: selectedCandidate,
      search,
    });
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      district: selectedDistrict,
      ac: selectedAc,
      category: val,
      candidate: selectedCandidate,
      search,
    });
  };

  const handleCandidateChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      district: selectedDistrict,
      ac: selectedAc,
      category: selectedCategory,
      candidate: val,
      search,
    });
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      district: selectedDistrict,
      ac: selectedAc,
      category: selectedCategory,
      candidate: selectedCandidate,
      search: val,
    });
  };

  const handleReset = () => {
    onFilterChange({
      district: '',
      ac: '',
      category: '',
      candidate: '',
      search: '',
    });
  };

  const hasActiveFilters = !!(selectedDistrict || selectedAc || selectedCategory || selectedCandidate || search);

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filter Dataset ({selectedYear} Election)</span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-xl border border-rose-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3">
        {/* Election Year Selector */}
        {showYear && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Election Year
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className="w-full appearance-none bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-300 font-extrabold text-emerald-900 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              >
                {availableYears.map((y) => (
                  <option key={y.year} value={y.year}>
                    {y.year} — {y.label || `${y.year} Data`}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-700 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        )}

        {/* District selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">District</label>
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="w-full appearance-none bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            >
              <option value="">All Districts ({districts.length})</option>
              {districts.map((d) => (
                <option key={d._id} value={d.districtName}>
                  {d.districtName} ({d.totalBooths} booths)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Assembly Constituency selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Assembly Constituency</label>
          <div className="relative">
            <select
              value={selectedAc}
              onChange={handleAcChange}
              className="w-full appearance-none bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            >
              <option value="">All Constituencies ({constituencies.length})</option>
              {constituencies.map((c) => (
                <option key={c._id} value={c.acNo}>
                  {c.acNo ? `${c.acNo} - ` : ''}{c.acName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Performance Category filter */}
        {showCategory && (
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Booth Category</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full appearance-none bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              >
                <option value="">All Performance Levels</option>
                <option value="strong">Strong Booth (≥50% Vote Share)</option>
                <option value="medium">Medium Booth (30%–49.9%)</option>
                <option value="weak">Weak Booth (&lt;30% Vote Share)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Candidate selector */}
        {showCandidate && (
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Candidate</label>
            <div className="relative">
              <select
                value={selectedCandidate}
                onChange={handleCandidateChange}
                className="w-full appearance-none bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              >
                <option value="">All Candidates</option>
                {candidates.map((c) => (
                  <option key={c._id} value={c.candidateName}>
                    {c.candidateName} ({c.party})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Search input */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Search Query</label>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Booth #, Station, Candidate..."
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
