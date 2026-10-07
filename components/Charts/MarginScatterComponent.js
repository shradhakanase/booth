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

const MARGIN_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs">
        <p className="font-bold text-slate-800 mb-1">Margin Range: {label}</p>
        <p className="text-emerald-600 font-bold">
          Booths: {Number(payload[0].value).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function MarginDistributionChart({ data = [], height = 280 }) {
  const formattedData = data.map((d, i) => ({
    range: d._id === '5000+' ? '5000+' : `${d._id} - ${data[i + 1] ? data[i + 1]._id : '5000'}`,
    count: d.count,
    avgMargin: Math.round(d.avgMargin || 0),
  }));

  if (!formattedData.length) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400">
        No margin distribution data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="range"
            stroke="#cbd5e1"
            tick={{ fill: '#64748b', fontSize: 10 }}
            angle={-20}
            textAnchor="end"
          />
          <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" name="Booths" radius={[6, 6, 0, 0]}>
            {formattedData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={MARGIN_COLORS[index % MARGIN_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
