'use client';

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LoadingSkeleton } from './LoadingSkeleton.js';
import EmptyState from './EmptyState.js';
import Pagination from './Pagination.js';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  sortBy = '',
  sortOrder = 'desc',
  onSort,
  pagination,
  onPageChange,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records matching your current criteria.',
  onRowClick,
}) {
  const handleHeaderClick = (col) => {
    if (!col.sortable || !onSort) return;
    const newOrder = sortBy === col.key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(col.key, newOrder);
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleHeaderClick(col)}
                  className={`py-3.5 px-4 ${col.className || ''} ${
                    col.sortable ? 'cursor-pointer select-none hover:text-slate-900 transition-colors' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortBy === col.key ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <LoadingSkeleton rows={5} height="h-10" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={row._id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors hover:bg-slate-50/80 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`py-3.5 px-4 ${col.className || ''}`}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && !loading && data.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
