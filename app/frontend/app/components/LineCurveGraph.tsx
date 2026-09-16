import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';


export type GradeRecord = {
  variant: string;
  grade: number;
};

export type CourseRecord = {
   variant: string;
  exam: string;
  grade: number;
};

export type PerformanceRecord = GradeRecord | CourseRecord;

type LineCurveGraphProps = {
  data: PerformanceRecord[];
  width?: string | number;
  height?: number;
  yAxisLabel?: string;
};


const LineCurveGraph: React.FC<LineCurveGraphProps> = ({
  data,
  width = '100%',
  height = 400,
  yAxisLabel = 'Number of Students'

}) => {
  // Group grades into buckets (0–9, 10–19, ..., 90–100)
  const buckets = Array.from({ length: 11 }, (_, i) => ({
    range: `${i * 10}-${i * 10 + 9}`,
    Students: 0
  }));

  data.forEach((record) => {
    const index = Math.min(Math.floor(record.grade / 10), 10);
    buckets[index].Students += 1;
  });

  return (
    <div style={{ width }}>
      <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={buckets}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="range"
            tick={{ fill: '#666' }}
            label={{
              value: 'Grade Range',
              position: 'insideBottom',
              offset: -30,
              fill: '#666'
            }}
          />
          <YAxis
            tick={{ fill: '#666' }}
            label={{
              value: yAxisLabel || 'Number of Students',
              angle: -90,
              position: 'insideLeft',
              offset: 15,
              fill: '#666'
            }}
            allowDecimals={false}
          />
          <Tooltip
          formatter={(value: any) => [`${value}`, yAxisLabel || 'Students']}
            contentStyle={{
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <Line
            type="monotone"
            dataKey="Students"
            stroke="#4f46e5"
            strokeWidth={3}
            dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{
              r: 8,
              stroke: '#4f46e5',
              strokeWidth: 2,
              fill: '#fff'
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineCurveGraph;