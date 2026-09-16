import React, { useState } from 'react';
import { GradeRecord } from './dummyData';

interface Stats {
  mean: number;
  median: number;
  q1: number;
  q3: number;
}

const VariantComparisonChart: React.FC<{ data: GradeRecord[] }> = ({ data }) => {
  const [mode, setMode] = useState<'any' | 'all-vs-one'>('any');
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [baseVariant, setBaseVariant] = useState<string>('');
  
  // Get all unique variants
  const variants = Array.from(new Set(data.map(d => d.variant)));
  
  // Group grades by variant
  const variantGrades = variants.reduce((acc, variant) => {
    acc[variant] = data.filter(d => d.variant === variant).map(d => d.grade);
    return acc;
  }, {} as Record<string, number[]>);

  // Calculate statistics for a set of grades
  const calculateStats = (grades: number[]): Stats => {
    const sorted = [...grades].sort((a, b) => a - b);
    const n = sorted.length;
    return {
      mean: sorted.reduce((sum, g) => sum + g, 0) / n,
      median: n % 2 === 0 ? (sorted[n/2-1] + sorted[n/2])/2 : sorted[Math.floor(n/2)],
      q1: sorted[Math.floor(n/4)],
      q3: sorted[Math.floor(3*n/4)]
    };
  };

  // Get variants to compare based on mode
  const getComparisonVariants = () => {
    if (mode === 'all-vs-one' && baseVariant) {
      return variants.filter(v => v !== baseVariant);
    }
    return selectedVariants;
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Variant Comparison</h2>
      
      {/* Mode selection */}
      <div className="flex space-x-4">
        <button
          className={`px-4 py-2 rounded-md ${mode === 'any' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('any')}
        >
          Compare Any Variants
        </button>
        <button
          className={`px-4 py-2 rounded-md ${mode === 'all-vs-one' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('all-vs-one')}
        >
          All vs One Variant
        </button>
      </div>

      {/* Selection controls */}
      <div className="space-y-4">
        {mode === 'any' ? (
          <div>
            <label className="block mb-2 font-medium">Select Variants to Compare:</label>
            <div className="space-y-2">
              {variants.map(variant => (
                <label key={variant} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedVariants.includes(variant)}
                    onChange={() => {
                      setSelectedVariants(prev => 
                        prev.includes(variant)
                          ? prev.filter(v => v !== variant)
                          : [...prev, variant]
                      );
                    }}
                  />
                  <span>Variant {variant}</span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block mb-2 font-medium">Select Base Variant:</label>
            <select
              className="w-full p-2 border rounded-md"
              value={baseVariant}
              onChange={(e) => setBaseVariant(e.target.value)}
            >
              <option value="">Select a variant</option>
              {variants.map(variant => (
                <option key={variant} value={variant}>Variant {variant}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results display */}
      {((mode === 'any' && selectedVariants.length > 1) || 
        (mode === 'all-vs-one' && baseVariant)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Base variant in all-vs-one mode */}
          {mode === 'all-vs-one' && baseVariant && (
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-bold text-lg">Base: Variant {baseVariant}</h3>
              <VariantStats stats={calculateStats(variantGrades[baseVariant])} />
            </div>
          )}

          {/* Comparison variants */}
          {getComparisonVariants().map(variant => {
            const stats = calculateStats(variantGrades[variant]);
            const baseStats = mode === 'all-vs-one' ? calculateStats(variantGrades[baseVariant]) : null;
            
            return (
              <div key={variant} className="p-4 border rounded-lg">
                <h3 className="font-bold text-lg">Variant {variant}</h3>
                <VariantStats stats={stats} />
                
                {mode === 'all-vs-one' && baseStats && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="font-medium">Comparison:</h4>
                    <p>Mean difference: {(stats.mean - baseStats.mean).toFixed(1)}%</p>
                    <p>Median difference: {(stats.median - baseStats.median).toFixed(1)}%</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Component to display variant statistics
const VariantStats: React.FC<{ stats: Stats }> = ({ stats }) => (
  <div className="space-y-1">
    <p><strong>Mean:</strong> {stats.mean.toFixed(1)}%</p>
    <p><strong>Median:</strong> {stats.median.toFixed(1)}%</p>
    <p><strong>First Quartile (Q1):</strong> {stats.q1.toFixed(1)}%</p>
    <p><strong>Third Quartile (Q3):</strong> {stats.q3.toFixed(1)}%</p>
  </div>
);

export default VariantComparisonChart;