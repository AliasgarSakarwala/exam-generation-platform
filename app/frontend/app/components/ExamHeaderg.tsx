import React, { useState } from 'react';

export default function ExamHeaderg({
  settingsButton = (
    <button
      className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border-none cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md hover:scale-105"
      aria-label="Settings"
      onClick={() => {
        window.location.href = '../settings';
      }}
    >
      <img
        src="/settings.svg"
        alt="Settings"
        className="w-7 h-7 transition-transform duration-400 ease-in-out hover:rotate-30"
      />
    </button>
  )
}: {
  settingsButton?: React.ReactNode;
}) {
  // SECTION: COMPONENT RENDER
  return (
  <div className="flex items-center justify-between p-4">
    <h1 className={`relative inline-block text-3xl font-medium group`}>
      <span className={`
        text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600
        group-hover:from-green-500 group-hover:to-green-700
        transition-all duration-500
      `}>
        Exam Variants Generated:
      </span>
    </h1>
    <div className="ml-4">
      {settingsButton}
    </div>
  </div>
);
}