'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color || '#059669' }} className="font-bold">
            {entry.name}: {Number(entry.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function BarChartComponent({
  data = [],
  xKey = 'name',
  dataKey = 'value',
  barName = 'Count',
  fillColor = '#3b82f6',
  colors = [],
  height = 300,
  horizontal = false,
}) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400">
        No chart data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {horizontal ? (
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey={xKey}
              stroke="#94a3b8"
              tick={{ fill: '#475569', fontSize: 11 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={dataKey} name={barName} fill={fillColor} radius={[0, 6, 6, 0]}>
              {colors.length > 0 &&
                data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
            </Bar>
          </BarChart>
        ) : (
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey={xKey}
              stroke="#cbd5e1"
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
              interval={0}
              angle={-25}
              textAnchor="end"
            />
            <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={dataKey} name={barName} fill={fillColor} radius={[6, 6, 0, 0]}>
              {colors.length > 0 &&
                data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
