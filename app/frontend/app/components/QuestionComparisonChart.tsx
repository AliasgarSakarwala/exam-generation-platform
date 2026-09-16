'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export type GradeRecord = {
  variant: string;
  question_id: number;
  correct: number; // raw_score
  total: number;   // grade_points
};

export type QuestionComparisonChartProps = {
  data: GradeRecord[];
  selectedQuestionId: number;
};

const QuestionComparisonChart: React.FC<QuestionComparisonChartProps> = ({ 
  data,
  selectedQuestionId: initialQuestionId
}) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState<number>(initialQuestionId);

  // Dynamically extract unique question IDs and variants per question
  const allQuestionIds = useMemo(() => {
    const ids = new Set<number>();
    data.forEach((record) => {
      if (record.question_id !== undefined && !isNaN(record.question_id)) {
        ids.add(record.question_id);
      }
    });
    return Array.from(ids).sort((a, b) => a - b);
  }, [data]);

  // Determine variants that contain the selected question
  const participatingVariants = useMemo(() => {
    return Array.from(new Set(
      data
        .filter((d) => d.question_id === selectedQuestionId)
        .map((d) => d.variant)
    ));
  }, [data, selectedQuestionId]);

  // Compute % correct for each variant
  const stats = useMemo(() => {
    return participatingVariants.map((variant) => {
      const records = data.filter((d) => d.variant === variant && d.question_id === selectedQuestionId);
      const total = records.length;
      const correct = records.filter((d) => d.correct > 0).length;
      const percent = total === 0 ? 0 : (correct / total) * 100;
      return {
        variant,
        '% Correct': parseFloat(percent.toFixed(1)),
      };
    });
  }, [data, selectedQuestionId, participatingVariants]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Question Comparison</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Question:</label>
        <select
          value={selectedQuestionId}
          onChange={(e) => setSelectedQuestionId(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded"
        >
          {allQuestionIds.map((qid) => (
            <option key={qid} value={qid}>
              Question {qid}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={stats} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="variant" />
          <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
          <Tooltip formatter={(value: any) => `${value}%`} />
          <Legend />
          <Bar dataKey="% Correct" fill="#4CAF50" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default QuestionComparisonChart;
