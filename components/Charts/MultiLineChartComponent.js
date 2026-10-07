'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-extrabold text-slate-800 border-b pb-1 mb-1">Year {label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-bold text-slate-900">
              {Number(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function MultiLineChartComponent({
  data = [],
  xKey = 'year',
  lines = [], // [{ dataKey: 'votes', name: 'Total Votes', color: '#6366f1' }]
  height = 320,
}) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400">
        No trend data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey={xKey}
            stroke="#cbd5e1"
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
          />
          <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
          />
          {lines.map((l, idx) => (
            <Line
              key={l.dataKey}
              type="monotone"
              dataKey={l.dataKey}
              name={l.name || l.dataKey}
              stroke={l.color || '#3b82f6'}
              strokeWidth={3}
              dot={{ r: 5, fill: l.color || '#3b82f6' }}
              activeDot={{ r: 7 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
