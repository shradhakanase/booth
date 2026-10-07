'use client';

import React, { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable.js';
import Toast from '@/components/Toast.js';
import { useYear } from '@/components/YearContext.js';
import { FileSpreadsheet, CheckCircle2, AlertTriangle, Trash2, Search, UploadCloud, Calendar } from 'lucide-react';

export default function FilesPage() {
  const { selectedYear } = useYear();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?year=${selectedYear}&search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) {
        setFiles(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [selectedYear, search]);

  const handleDelete = async (fileId, fileName) => {
    if (!confirm(`Are you sure you want to delete ${fileName} and all its extracted booth records?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: json.message });
        fetchFiles();
      } else {
        setToast({ type: 'error', message: json.error });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete file' });
    }
  };

  const columns = [
    {
      key: 'originalFileName',
      label: 'File Name',
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs block font-mono">{val}</span>
            <span className="text-[10px] text-slate-500">
              {row.fileType?.toUpperCase()} • {new Date(row.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'district',
      label: 'District',
      render: (val) => <span className="font-semibold text-slate-700">{val}</span>,
    },
    {
      key: 'acName',
      label: 'Constituency',
      render: (val, row) => (
        <span className="text-slate-700">
          {row.acNo ? `${row.acNo} - ` : ''}{val || '—'}
        </span>
      ),
    },
    {
      key: 'totalBooths',
      label: 'Booths Extracted',
      render: (val) => (
        <span className="font-bold text-blue-600">{Number(val || 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'totalVotes',
      label: 'Total Votes',
      render: (val) => (
        <span className="font-bold text-emerald-600">{Number(val || 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'processingStatus',
      label: 'Status',
      render: (val) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
            val === 'PROCESSED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : val === 'REVIEW'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {val === 'PROCESSED' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {val}
        </span>
      ),
    },
    {
      key: '_id',
      label: 'Actions',
      render: (val, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(val, row.originalFileName);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Delete File"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {selectedYear} Files
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit',sans-serif]">
            {selectedYear} Source Files Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse, manage, and inspect all ingested Form 20 spreadsheets for {selectedYear}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search file or district..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-sm"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          </div>

          <a
            href="/dashboard/upload"
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white shadow-md shadow-emerald-600/20 transition-all whitespace-nowrap"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New</span>
          </a>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={files}
        loading={loading}
        emptyTitle="No files registered"
        emptyDescription="Upload Form 20 files to populate this table."
      />

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
