import React from 'react';
import CourseExamOverview from './CourseExamOverview';

type ExamStatisticsData = {
  [variant: string]: {
    mean: number;
    median: number;
    low: number;
    high: number;
    upper_quartile: number;
    lower_quartile: number;
    standard_deviation?: number;
    count?: number;
  };
};

type ExamStatisticsProps = {
  statistics?: ExamStatisticsData;
  selectedVariant?: string | null;
  title?: string;
};

const ExamStatistics: React.FC<ExamStatisticsProps> = ({
  statistics,
  selectedVariant,
  title = "Exam Statistics"
}) => {
  if (!statistics || Object.keys(statistics).length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-sm text-gray-500">No statistics available.</p>
      </div>
    );
  }

  // If a specific variant is selected, show only that variant's stats
  if (selectedVariant && statistics[selectedVariant]) {
    return (
      <CourseExamOverview 
        stats={statistics[selectedVariant]}
        title={`Variant ${selectedVariant} Statistics`}
        variantName={selectedVariant}
      />
    );
  }

  // If no variant is selected, show overall statistics (first variant or combined)
  // You could also calculate combined statistics here if needed
  const firstVariantStats = Object.values(statistics)[0];
  const firstVariantKey = Object.keys(statistics)[0];
  
  return (
    <CourseExamOverview 
      stats={firstVariantStats}
      title="Overall Statistics"
      variantName={Object.keys(statistics).length > 1 ? "All Variants" : firstVariantKey}
    />
  );
};

export default ExamStatistics;