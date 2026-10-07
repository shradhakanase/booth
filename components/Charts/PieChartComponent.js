'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

const DEFAULT_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs">
        <p className="font-bold text-slate-800 mb-1">{data.name}</p>
        <p style={{ color: data.payload.fill || '#059669' }} className="font-bold">
          Count: {Number(data.value).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function PieChartComponent({
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  colors = DEFAULT_COLORS,
  height = 300,
  innerRadius = 60,
  outerRadius = 95,
}) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400">
        No distribution data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs font-semibold text-slate-600 ml-1">{value}</span>}
          />
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={4}
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || colors[index % colors.length]}
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
