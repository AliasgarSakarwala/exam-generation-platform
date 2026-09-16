import React from 'react';

export type GradeRecord = {
  variant: string;
  grade: number;
};

type CourseExamOverviewProps = {
  grades: number[];
  title?: string;
};

const getStats = (grades: number[]) => {
  if (!grades || grades.length === 0) {
    return {
      mean: '0.0',
      median: '0.0',
      q1: '0.0',
      q3: '0.0',
      min: '0.0',
      max: '0.0',
    };
  }

  // 1. Sort grades in ascending order
  const sorted = [...grades].sort((a, b) => a - b);
  const n = sorted.length;

  // Helper function to calculate median of any array
  const calculateMedian = (arr: number[]) => {
    const len = arr.length;
    if (len % 2 === 1) {
      return arr[Math.floor(len / 2)];
    } else {
      return (arr[len / 2 - 1] + arr[len / 2]) / 2;
    }
  };

  // 2. Calculate median (Q2)
  const median = calculateMedian(sorted);

  // 3. Calculate Q1 and Q3
  const q1 = calculateMedian(sorted.slice(0, Math.floor(n / 2)));
  const q3 = calculateMedian(sorted.slice(Math.ceil(n / 2)));

  // 4. New rounding function: .5+ rounds up, .4- rounds down
  const roundToTenth = (num: number) => {
    const rounded = Math.round(num * 10) / 10; // Standard rounding
    return parseFloat(rounded.toFixed(1)); // Ensure 1 decimal place
  };

  // 5. Calculate other stats with proper rounding
  const mean = roundToTenth(sorted.reduce((sum, g) => sum + g, 0) / n);
  const min = roundToTenth(sorted[0]);
  const max = roundToTenth(sorted[n - 1]);

  return {
    mean: mean.toString(),
    median: roundToTenth(median).toString(),
    q1: roundToTenth(q1).toString(),
    q3: roundToTenth(q3).toString(),
    min: min.toString(),
    max: max.toString(),
  };
};


const CourseExamOverview: React.FC<CourseExamOverviewProps> = ({
  grades,
  title = "Exam Statistics Overview",
}) => {
  const stats = getStats(grades);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {grades.length === 0 ? (
        <p className="text-sm text-gray-500">No data available.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Mean', value: `${stats.mean}%` },
            { label: 'Median', value: `${stats.median}%` },
            { label: 'Lower Quartile', value: `${stats.q1}%` },
            { label: 'Upper Quartile', value: `${stats.q3}%` },
            { label: 'Low', value: `${stats.min}%` },
            { label: 'High', value: `${stats.max}%` },
          ].map((item) => (
            <div key={item.label} className="bg-blue-50 p-3 rounded">
              <div className="text-gray-500 text-sm">{item.label}</div>
              <div className="text-xl font-bold">{item.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseExamOverview;