import React, { useState } from 'react';

export default function ExamHeader({
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
    <div className="flex items-center">
      <div className="ml-auto mr-10">
        {settingsButton}
      </div>
    </div>
  );
}