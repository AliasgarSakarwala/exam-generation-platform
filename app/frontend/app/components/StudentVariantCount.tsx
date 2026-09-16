import React from 'react';

export type GradeRecord = {
  variant: string;
  grade: number;
};

type StudentVariantCountProps = {
  totalVariants: number;
  studentCount: number;
  title?: string;
  showNotes?: boolean;
  studentLabel?: string;
  studentNote?: string;
  variantLabel?: string;
  variantNote?: string;
};

export default function StudentVariantCount({ 
  totalVariants, 
  studentCount, 
  title,
  variantLabel = "Variants",
}: StudentVariantCountProps) {
  return (
  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl transition-all duration-200">
    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-indigo-600"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clipRule="evenodd"
        />
      </svg>
      {title}
    </h3>
    
    <div className="grid grid-cols-2 gap-6">
      {/* Students Count */}
      <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-1">
          Students
        </p>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-gray-900">{studentCount}</p>
          <span className="text-sm text-gray-500 mb-1">enrolled</span>
        </div>
      </div>
      
      {/* Variants Count */}
      <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
        <p className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-1">
          {variantLabel}
        </p>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-gray-900">{totalVariants}</p>
          <span className="text-sm text-gray-500 mb-1">versions</span>
        </div>
      </div>
    </div>
  </div>
);
};