"use client";

import React, { useState, useRef, useEffect } from "react";
import Modal from "./sub-components/Modal";

// Interface defining the props for the AddCourseButton component
interface AddCourseButtonProps {
  darkMode?: boolean; // Optional dark mode toggle
  onSubmit?: (courseData: { // Optional callback when form is submitted
    name: string;
    code: string;
    section: string;
    startDate: string;
    endDate: string;
    term: string;
    class_colour: string;
    courseId: number;
  }) => void;
}

// Main component for adding a course
export default function AddCourseButton({
  darkMode = false, // Default darkMode to false if not provided
  onSubmit,
}: AddCourseButtonProps) {
  // State management
  const [isOpen, setIsOpen] = useState(false); // Controls modal visibility
  const [isRotating, setIsRotating] = useState(false); // Controls plus icon rotation animation
  const [isMobile, setIsMobile] = useState(false); // Tracks mobile view state
  const plusIconRef = useRef<HTMLImageElement>(null); // Reference to the plus icon for animations

  // Effect to handle window resize and detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640); // 640px is typically the breakpoint for mobile
    };

    // Call once to set initial state
    handleResize();
    // Add event listener for window resize
    window.addEventListener("resize", handleResize);
    // Cleanup function to remove event listener
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handler for button click event
  const handleButtonClick = () => {
    setIsRotating(true); // Start rotation animation
    setTimeout(() => {
      setIsOpen(true); // Open modal after delay
      // Scale animation for the plus icon
      if (plusIconRef.current) {
        plusIconRef.current.style.transform = "scale(1.2)";
        setTimeout(() => {
          if (plusIconRef.current) {
            plusIconRef.current.style.transform = "scale(1)";
          }
          setIsRotating(false); // Reset rotation state
        }, 200); // Scale animation duration
      }
    }, 600); // Delay before opening modal
  };

  return (
    <div className="relative">
      {/* Main button that triggers the modal */}
<button
  data-onboarding="add-course"
  className={`
    relative overflow-hidden
    text-white font-medium text-lg border-none rounded-full
    cursor-pointer shadow-lg hover:shadow-xl
    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
    flex items-center justify-center
    bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700
    hover:from-blue-600 hover:via-blue-700 hover:to-blue-800
    active:from-blue-700 active:via-blue-800 active:to-blue-900
    focus:outline-none focus:ring-2 focus:ring-blue-400/80 focus:ring-offset-2
    group
    ${darkMode ? "ring-2 ring-blue-400" : ""}
    ${isMobile ? "w-14 h-14" : "rounded-full px-6 py-3"}
  `}
  onClick={handleButtonClick}
>
  {/* Gradient overlay */}
  <span className="absolute inset-0 bg-gradient-to-r 
    from-blue-400/10 via-blue-500/20 to-blue-600/30 
    opacity-0 group-hover:opacity-100 
    transition-opacity duration-700 ease-in-out"></span>

  {/* Shine effect */}
  <span className="absolute inset-0 overflow-hidden">
    <span className="absolute top-0 -left-full w-1/2 h-full 
      bg-white/20 -skew-x-12
      group-hover:animate-shine group-hover:[animation-duration:1.8s] 
      transition-all duration-500 pointer-events-none"></span>
  </span>

  {/* Plus icon with rotation animation */}
  <img
    ref={plusIconRef}
    src="/Plus.svg"
    alt="Add"
    className={`relative z-10 w-7 h-7 transition-transform duration-600 ease-in-out ${
      isRotating ? "rotate-[720deg]" : ""
    }`}
  />
  {/* Only show "Add Course" text on non-mobile views */}
  {!isMobile && <span className="relative z-10 ml-3">Add Course</span>}
</button>

      {/* Modal component that appears when isOpen is true */}
      <Modal
        darkMode={darkMode}
        isOpen={isOpen}
        mode="create"
        onClose={() => setIsOpen(false)} // Close handler
        onSubmit={onSubmit} // Pass through submit handler
      />
    </div>
  );
}

// Interface defining the Student object structure
interface Student {
  studentId: number;
  fullname: string;
  courseId: number;
}