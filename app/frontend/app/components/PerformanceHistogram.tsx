import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

interface PerformanceHistogramProps {
  data: Array<{ id: string; grade: number }>;
  title?: string;
  width?: string | number;
  height?: number;
  darkMode?: boolean;
  labelPrefix?: string;
  yAxisLabel?: string;
  barColor?: string;
}

const PerformanceHistogram: React.FC<PerformanceHistogramProps> = ({
  data,
  title = 'Performance',
  width = '100%',
  height = 400,
  darkMode = false,
  yAxisLabel = 'Average Score',
  barColor = '#facc15',
}) => {
  const chartData = data.map((item, index)=> ({
    id: `${item.id.split(' ')[0]} ${index+1}`,
    average: item.grade
  }));

  const textColor = darkMode ? '#e5e7eb' : '#374151';
  const gridColor = darkMode ? '#4b5563' : '#e5e7eb';
  const tooltipBg = darkMode ? '#1f2937' : '#ffffff';

  return (
    <div style={{ width }}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="id"
            angle={-30}
            textAnchor="end"
            interval={0}
            tick={{ fill: textColor }}
            height={60}
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fill: textColor }}
            label={{
              value: yAxisLabel,
              angle: -90,
              position: 'insideLeft',
              offset: 15,
              fill: textColor,
            }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value}%`, 'Average']}
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: darkMode ? '#4b5563' : '#d1d5db',
              borderRadius: '0.375rem',
            }}
            itemStyle={{ color: textColor }}
          />
          <Bar dataKey="average" fill={barColor}>
            <LabelList 
              dataKey="average" 
              position="top"  
              fill={textColor}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceHistogram;