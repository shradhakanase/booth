'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 50,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      <div className="text-xs text-slate-500">
        Showing <span className="font-bold text-slate-900">{startItem.toLocaleString()}</span> to{' '}
        <span className="font-bold text-slate-900">{endItem.toLocaleString()}</span> of{' '}
        <span className="font-bold text-slate-900">{totalItems.toLocaleString()}</span> records
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold border transition-colors ${
                currentPage === page
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
