'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  FileText,
  Calendar,
} from 'lucide-react';
import Toast from '@/components/Toast.js';
import { useYear } from '@/components/YearContext.js';
import { selectBestSheet, cleanSheetRows } from '@/lib/sheetHelper.js';

export default function UploadPage() {
  const { selectedYear, availableYears, refreshYears } = useYear();
  const [yearMode, setYearMode] = useState('existing'); // 'existing', 'custom', 'auto'
  const [uploadYear, setUploadYear] = useState(String(selectedYear || 2024));
  const [customYear, setCustomYear] = useState('');
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [customDistrict, setCustomDistrict] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadResults, setUploadResults] = useState(null);
  const [toast, setToast] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (selectedYear) {
      setUploadYear(String(selectedYear));
    }
  }, [selectedYear]);

  // Load districts dynamically for the selected or typed year
  useEffect(() => {
    async function loadDistricts() {
      try {
        const effectiveYear =
          uploadYear === 'auto'
            ? ''
            : uploadYear === 'custom'
            ? customYear.trim()
            : uploadYear;
        const query = effectiveYear ? `?year=${effectiveYear}&sortBy=districtName&sortOrder=asc` : '?sortBy=districtName&sortOrder=asc';
        const res = await fetch(`/api/districts${query}`);
        const json = await res.json();
        if (json.success) {
          setDistricts(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load districts in upload page:', err);
      }
    }
    loadDistricts();
  }, [uploadYear, customYear]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setToast({ type: 'warning', message: 'Please select at least one file to upload.' });
      return;
    }

    let finalYear = uploadYear;
    if (uploadYear === 'custom') {
      const numYear = parseInt(customYear.trim(), 10);
      if (isNaN(numYear) || numYear < 1950 || numYear > 2050) {
        setToast({ type: 'error', message: 'Please enter a valid 4-digit election year (e.g. 2025).' });
        return;
      }
      finalYear = String(numYear);
    }

    const district = customDistrict.trim() || selectedDistrict;

    setUploading(true);
    setUploadProgress(5);
    setUploadResults(null);
    setUploadStatusText('Preparing files for ingestion...');

    const allResults = [];
    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progressPercent = Math.round(((i + 0.1) / selectedFiles.length) * 100);
        setUploadProgress(progressPercent);
        setUploadStatusText(`Ingesting file ${i + 1} of ${selectedFiles.length}: ${file.name}...`);

        const ext = file.name.split('.').pop().toLowerCase();

        try {
          if (ext === 'xlsx' || ext === 'xls') {
            // Client-side extraction: converts 5MB workbook with 60+ sheets into ~40KB Form-20 JSON
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const { rows } = selectBestSheet(workbook);
            const cleaned = cleanSheetRows(rows);

            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name,
                rows: cleaned,
                district,
                year: finalYear,
              }),
            });

            const json = await res.json();
            if (json.success && json.results) {
              allResults.push(...json.results);
              successCount += json.results.filter((r) => r.status === 'SUCCESS').length;
            } else {
              allResults.push({
                fileName: file.name,
                year: finalYear,
                district: district || 'General',
                status: 'FAILED',
                error: json.error || 'Server error',
              });
              failCount++;
            }
          } else {
            // Standard FormData upload for CSV / PDF
            const formData = new FormData();
            formData.append('file', file);
            formData.append('year', finalYear);
            if (district) {
              formData.append('district', district);
            }

            const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            const json = await res.json();
            if (json.success && json.results) {
              allResults.push(...json.results);
              successCount += json.results.filter((r) => r.status === 'SUCCESS').length;
            } else {
              allResults.push({
                fileName: file.name,
                year: finalYear,
                district: district || 'General',
                status: 'FAILED',
                error: json.error || 'Upload failed',
              });
              failCount++;
            }
          }
        } catch (fileErr) {
          console.error(`Error uploading ${file.name}:`, fileErr);
          allResults.push({
            fileName: file.name,
            year: finalYear,
            district: district || 'General',
            status: 'FAILED',
            error: fileErr.message,
          });
          failCount++;
        }

        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      setUploadResults(allResults);

      if (successCount > 0) {
        setToast({
          type: 'success',
          message: `Successfully processed ${successCount} file${successCount !== 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}!`,
        });
        setSelectedFiles([]);
        refreshYears();
      } else {
        setToast({
          type: 'error',
          message: `Failed to process uploaded files. Check the report below.`,
        });
      }
    } catch (err) {
      console.error('Upload batch failed:', err);
      setToast({ type: 'error', message: `Upload error: ${err.message}` });
    } finally {
      setUploading(false);
      setUploadStatusText('');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit',sans-serif]">
          Upload Form 20 Files
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Import Excel (.xlsx), CSV or PDF files. The engine extracts booth-level voting, candidates, NOTA and calculates margins automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form Card */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-5">
          {/* Target Election Year & District Selection Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Target Election Year</span>
              </label>

              {/* Dynamic status pill */}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                {uploadYear === 'auto'
                  ? '⚡ Auto-Detect per file'
                  : uploadYear === 'custom'
                  ? `New: ${customYear || 'Type year'}`
                  : `Year ${uploadYear}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  value={uploadYear}
                  onChange={(e) => {
                    setUploadYear(e.target.value);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
                >
                  <option value="auto">⚡ Auto-Detect Year from File Header / Name</option>
                  <optgroup label="Available Election Datasets">
                    {availableYears.map((y) => (
                      <option key={y.year} value={String(y.year)}>
                        {y.year} — {y.label || `${y.year} Elections`}
                      </option>
                    ))}
                  </optgroup>
                  <option value="custom">➕ Enter Custom / New Election Year...</option>
                </select>
              </div>

              {/* Custom Year Input (when custom is chosen) */}
              {uploadYear === 'custom' ? (
                <div>
                  <input
                    type="number"
                    min="1950"
                    max="2050"
                    placeholder="e.g. 2025, 2023, 2021..."
                    value={customYear}
                    onChange={(e) => setCustomYear(e.target.value)}
                    className="w-full bg-white border-2 border-indigo-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
              ) : uploadYear === 'auto' ? (
                <div className="flex items-center px-3.5 py-2 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-[11px] font-medium">
                  The engine will extract the 4-digit year directly from each file's title or header.
                </div>
              ) : (
                <div className="flex items-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px]">
                  Files will be assigned to election year <strong>{uploadYear}</strong>.
                </div>
              )}
            </div>

            {/* District Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/80">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Assign to Existing District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCustomDistrict('');
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option value="">Auto-Detect from File Header</option>
                  {districts.map((d) => (
                    <option key={d._id} value={d.districtName}>
                      {d.districtName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Or New District Name
                </label>
                <input
                  type="text"
                  value={customDistrict}
                  onChange={(e) => {
                    setCustomDistrict(e.target.value);
                    setSelectedDistrict('');
                  }}
                  placeholder="e.g. Kanpur Dehat, Meerut..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              multiple
              accept=".xlsx,.xls,.csv,.pdf"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 font-['Outfit',sans-serif]">
              Drag & Drop Form 20 Files
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports .xlsx, .xls, .csv, and .pdf documents
            </p>
            <button
              type="button"
              className="mt-3 px-4 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition-colors"
            >
              Browse Files from Computer
            </button>
          </div>

          {/* Staged Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Selected Files ({selectedFiles.length})</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-rose-600 hover:underline font-bold"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="font-mono font-bold text-slate-800 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button & Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                <span className="flex items-center gap-2 truncate max-w-[80%]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 flex-shrink-0" />
                  <span className="truncate">{uploadStatusText || 'Parsing and inserting into MongoDB...'}</span>
                </span>
                <span className="font-bold font-mono text-emerald-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={uploading || selectedFiles.length === 0}
            onClick={handleUploadSubmit}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Upload...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Process & Ingest {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>

        {/* Upload Guidelines Card */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit',sans-serif]">
                Pipeline Capabilities
              </h3>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Automatic candidate column and vote normalization.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Duplicate hash check to prevent duplicate booth records.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Instant re-classification into Strong / Medium / Weak categories.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Direct MongoDB storage with indexed queries for 90k+ booths.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Results Summary */}
      {uploadResults && (
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
              Processing Report ({uploadResults.length} Files)
            </h3>
            <a
              href="/dashboard/booths"
              className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-bold"
            >
              <span>Explore Booths</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {uploadResults.map((r, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-slate-900 block">{r.fileName}</span>
                  <span className="text-[10px] text-slate-500">
                    <strong className="text-indigo-700 font-bold">Year {r.year}</strong> • District: {r.district} • Constituency: {r.constituency || '—'}
                  </span>
                </div>

                <div className="text-right">
                  {r.status === 'SUCCESS' ? (
                    <div>
                      <span className="font-extrabold text-emerald-700 block">
                        +{r.totalBooths} booths ({r.totalVotes?.toLocaleString()} votes)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Winner: {r.winner} ({r.winningParty})
                      </span>
                    </div>
                  ) : (
                    <span className="text-rose-600 font-bold">{r.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
