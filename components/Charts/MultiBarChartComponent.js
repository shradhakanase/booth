'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
        <p className="font-extrabold text-slate-800 border-b pb-1 mb-1">{label}</p>
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

export default function MultiBarChartComponent({
  data = [],
  xKey = 'name',
  bars = [], // [{ dataKey: '2024', name: '2024', color: '#6366f1' }, { dataKey: '2022', name: '2022', color: '#06b6d4' }]
  height = 320,
}) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400">
        No comparative chart data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 15, left: -5, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey={xKey}
            stroke="#cbd5e1"
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
          />
          {bars.map((b, idx) => (
            <Bar
              key={b.dataKey}
              dataKey={b.dataKey}
              name={b.name || b.dataKey}
              fill={b.color || '#3b82f6'}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
