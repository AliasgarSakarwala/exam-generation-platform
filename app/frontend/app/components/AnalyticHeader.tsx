'use client';

import React from 'react';

interface AnalyticHeaderProps {
  title?: string;
  settingsButton?: React.ReactNode;
}

export default function AnalyticHeader({
  title = "Analytics",
  settingsButton,
}: AnalyticHeaderProps) {
  const defaultSettingsButton = (
    <button
      className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border-none cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md hover:scale-105"
      aria-label="Settings"
      onClick={() => window.location.href = '../settings'}
    >
      <img
        src="/settings.svg"
        alt="Settings"
        className="w-7 h-7 transition-transform duration-400 ease-in-out hover:rotate-30"
      />
    </button>
  );

  // Determine gradient colors based on title
  const getGradientClasses = () => {
    if (title.startsWith('Course')) {
      return 'from-orange-400 to-orange-600 group-hover:from-orange-500 group-hover:to-orange-700';
    } else if (title.startsWith('Exam')) {
      return 'from-green-400 to-green-600 group-hover:from-green-500 group-hover:to-green-700';
    }
    // Default gradient if neither
    return 'from-blue-400 to-blue-600 group-hover:from-blue-500 group-hover:to-blue-700';
  };

  return (
    <div className="flex items-center justify-between p-4">
      <h1 className={`relative inline-block text-3xl font-medium group`}>
        <span className={`
          text-transparent bg-clip-text bg-gradient-to-r 
          ${getGradientClasses()}
          transition-all duration-500
        `}>
          {title}
        </span>
      </h1>
      <div className="ml-auto mr-10">
        {settingsButton ?? defaultSettingsButton}
      </div>
    </div>
  );
}