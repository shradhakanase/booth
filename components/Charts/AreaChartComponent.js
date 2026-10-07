'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="font-bold">
            {entry.name}: {Number(entry.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AreaChartComponent({
  data = [],
  xKey = 'name',
  dataKey = 'value',
  name = 'Votes',
  strokeColor = '#10b981',
  fillGradient = '#10b981',
  height = 280,
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
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={fillGradient} stopOpacity={0.3} />
              <stop offset="95%" stopColor={fillGradient} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey={xKey}
            stroke="#cbd5e1"
            tick={{ fill: '#475569', fontSize: 10 }}
            angle={-20}
            textAnchor="end"
          />
          <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            name={name}
            stroke={strokeColor}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#areaColor)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
