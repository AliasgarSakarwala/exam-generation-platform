"use client";

import React, { useState, useEffect, useRef } from "react";
import CourseListSidebar from "./components/CourseListSidebar";
import CourseListHeader from "./components/CourseListHeader";
import CourseCard from "./components/CourseCard";
import AddCourseButton from "./components/AddCourseButton";
import { getClassrooms, Classroom } from "../services/classroom";
import toast from "react-hot-toast";
import { useOnboarding } from "../context/OnboardingContext";
import OnboardingStep from "../components/OnboardingStep";
import { getOnboardingSteps } from "../config/onboardingSteps";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Loading from "./loading";
import { OnboardingPages } from "../config/onboardingSteps";

import { updateUser } from '@/services/profile';


// Onboarding wrapper component
const CoursesPageWithOnboarding: React.FC = () => {
  const { state, completeStep, skipTour } = useOnboarding();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const steps = getOnboardingSteps(OnboardingPages.course);
  const currentStep = steps[state.currentStep];

  // Unified finder for the current onboarding step’s target
  useEffect(() => {
    if (!state.isActive || currentStep == null) {
      setTargetElement(null);
      return;
    }

    // pick the correct selector for this step
    const selector =
      currentStep.id === 'ellipsis-menu'
        ? '[data-onboarding="ellipsis-menu"]'
        : currentStep.targetSelector;

    // ——— SKIP “ellipsis-menu” if no course cards present ———
    if (currentStep.id === 'ellipsis-menu') {
      const cards = document.querySelectorAll(selector);
      if (cards.length === 0) {
        completeStep(currentStep.id);
        if (currentStep.id === steps[steps.length - 1].id) {
          updateDBwithCompletedOnboarding();
        }
        return; // bail out, we marked it complete
      }
    }

    let interval: number;

    const findAndScroll = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        setTargetElement(el);
        // scroll it into view (you can adjust block/inline as you like)
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
      return false;
    };

    // try immediately, then poll
    if (!findAndScroll()) {
      interval = window.setInterval(() => {
        if (findAndScroll()) {
          clearInterval(interval);
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isActive, state.currentStep, currentStep]);

  const handleNext = () => {
    if (currentStep) {
      completeStep(currentStep.id);
    }
    if (currentStep.id === steps[steps.length - 1].id) {
      updateDBwithCompletedOnboarding();
    }
  };

  const updateDBwithCompletedOnboarding = () => {
    const payload = {
      comp_tutorial_page: 'course'
    }
    updateUser({ payload });
  }

  const handleSkip = () => {
    skipTour();
    updateDBwithCompletedOnboarding();
  };

  return (
    <>
      <CoursesPage />
      {state.isActive && currentStep && (
        <OnboardingStep
          stepId={currentStep.id}
          cardPosition={currentStep.cardPosition}
          message={currentStep.message}
          targetElement={targetElement}
          onNext={handleNext}
          onSkip={handleSkip}
          isVisible={state.isActive}
        />
      )}
    </>
  );
}

// Export the wrapped component
export default function CoursesPageWrapper() {
  return <CoursesPageWithOnboarding />;
};

/**
 * CoursesPage - Main component for displaying and managing courses.
 * 
 * Features:
 * - Dark mode toggle
 * - Course fetching and display
 * - Drag-and-drop course reordering
 * - Search and filter functionality
 * - Error handling with toast notifications
 * - Responsive grid layout
 * 
 * State Management:
 * - Uses React hooks for local state
 * - Maintains separate states for original and filtered courses
 * - Loading and error states for API calls
 * 
 * Dependencies:
 * - dnd-kit for drag-and-drop functionality
 * - react-hot-toast for notifications
 * - Next.js router for navigation
 */
function CoursesPage() {
  // ==== THEME STATE ==== //
  /**
   * Tracks dark mode preference
   * @type {boolean}
   * @default false
   */
  const [darkMode, setDarkMode] = useState(false);

  // ==== COURSE DATA STATES ==== //
  /**
   * Original list of courses from API
   * @type {Classroom[]}
   * @default []
   */
  const [courses, setCourses] = useState<Classroom[]>([]);
  const { user } = useAuth();

  /**
   * Filtered/sorted list of courses for display
   * @type {Classroom[]}
   * @default []
   */
  const [filteredCourses, setFilteredCourses] = useState<Classroom[]>([]);

  // ==== LOADING STATES ==== //
  /**
   * Indicates if courses are being fetched
   * @type {boolean}
   * @default true
   */
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Stores error messages from API calls
   * @type {string | null}
   * @default null
   */
  const [error, setError] = useState<string | null>(null);

  // ==== HOOK INITIALIZATION ==== //
  const router = useRouter();
  const { startOnboarding } = useOnboarding();

  // ==== DRAG AND DROP CONFIGURATION ==== //
  /**
   * Sensors for drag-and-drop functionality
   * - PointerSensor for mouse/touch interactions
   * - KeyboardSensor for keyboard accessibility
   * - Activation constraint prevents accidental drags
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {

      activationConstraint: { distance: 0 },

    }),
    useSensor(KeyboardSensor)
  );

  // ==== DATA FETCHING ==== //
  /**
   * Fetches courses from API and updates state
   * - Sets loading state during fetch
   * - Handles success/error cases
   * - Updates both original and filtered course lists
   * - Shows toast notifications on error
   */
  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getClassrooms();

      if (response.status === 200) {
        setCourses(response.data);
        setFilteredCourses(response.data);
      } else {
        throw new Error('Failed to fetch courses');
      }
    } catch (err) {
      setError('Failed to load courses');
      toast.error('Failed to load courses ❌', {
        position: "bottom-center",
        style: {
          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
          color: darkMode ? "#ffffff" : "#1e293b",
          border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch courses on component mount
  useEffect(() => {
    if (user) {
      // Helper function to safely check if tutorial page is completed
      const isTutorialCompleted = (pageName: string) => {
        return Array.isArray(user?.comp_tutorial_pages) && user.comp_tutorial_pages.includes(pageName);
      };

      if (!isTutorialCompleted('course')) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key?.startsWith('onboarding_course_')) {
            localStorage.removeItem(key);
          }
        }
        // now kick off the onboarding tour
        startOnboarding('course');
      }
    }
    fetchCourses();
  }, []);

  // ==== DRAG AND DROP HANDLERS ==== //
  /**
   * Handles course reordering after drag ends
   * @param {DragEndEvent} event - Contains active and over drag elements
   * - Swaps courses in filtered list if positions changed
   * - Uses arrayMove from dnd-kit for smooth transitions
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFilteredCourses((items) => {
        const oldIndex = items.findIndex(item => item.classroom_id.toString() === active.id);
        const newIndex = items.findIndex(item => item.classroom_id.toString() === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // ==== COURSE MANAGEMENT HANDLERS ==== //
  /**
   * Refetches courses after new course creation
   * Triggered by AddCourseButton onSubmit
   */
  const handleCourseCreated = () => {
    fetchCourses();
  };

  // Update the handleSearch function to search both name and code
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filteredCourses = courses.filter((course) =>
      course.name.toLowerCase().includes(value.toLowerCase()) ||
      course.code.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCourses(filteredCourses);
  };

  // Update the handleFilter function to support all required sorting options
  const handleFilter = (filter: string) => {
    let sorted: Classroom[] = [...courses]; // Always sort from the original courses

    // Helper function to parse YYYY/MM/DD format
    const parseYMDDate = (dateStr: string): Date => {
      if (!dateStr) return new Date(0); // Handle empty dates by returning epoch

      const parts = dateStr.split('/');
      if (parts.length !== 3) return new Date(0); // Invalid format

      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS
      const day = parseInt(parts[2], 10);

      return new Date(year, month, day);
    };

    switch (filter) {
      case 'code-asc':
        sorted = [...sorted].sort((a, b) => a.code.localeCompare(b.code));
        break;
      case 'code-desc':
        sorted = [...sorted].sort((a, b) => b.code.localeCompare(a.code));
        break;
      case 'start-date-asc':
        sorted = [...sorted].sort((a, b) =>
          parseYMDDate(a.start_date).getTime() - parseYMDDate(b.start_date).getTime()
        );
        break;
      case 'start-date-desc':
        sorted = [...sorted].sort((a, b) =>
          parseYMDDate(b.start_date).getTime() - parseYMDDate(a.start_date).getTime()
        );
        break;
      case 'end-date-asc':
        sorted = [...sorted].sort((a, b) =>
          parseYMDDate(a.end_date).getTime() - parseYMDDate(b.end_date).getTime()
        );
        break;
      case 'end-date-desc':
        sorted = [...sorted].sort((a, b) =>
          parseYMDDate(b.end_date).getTime() - parseYMDDate(a.end_date).getTime()
        );
        break;
      default:
        toast.error('Invalid filter option', {
          position: "bottom-center",
          style: {
            backgroundColor: darkMode ? "#1e293b" : "#ffffff",
            color: darkMode ? "#ffffff" : "#1e293b",
            border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
          }
        });
        return;
    }

    setFilteredCourses(sorted);
  };

  if (!user) {
    return <Loading />;
  }

  // ==== RENDER LOGIC ==== //
  return (
    <div className={`flex min-h-[450px] min-w-[500px] overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-zinc-900' : 'bg-gray-100'}`}
      style={{ height: '100vh', maxHeight: '100vh' }}>
      {/* SIDEBAR COMPONENT */}
      <CourseListSidebar
        darkMode={darkMode}
        archived={user.role === 'Admin'}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        middleButtons={!(user.role === 'Admin') ? [
          {
            label: 'Active Courses',
            alt: 'Active Courses',
            iconSrc: '/cap.svg',
            onClick: () => router.push('/'),
          },
          {
            label: 'Archived Courses',
            alt: 'Archived Courses',
            iconSrc: '/Archived.svg',
            onClick: () => router.push('/archived'),
            dataOnboarding: 'archived-button'
          },
        ] : [
          {
            label: 'Active Courses',
            alt: 'Active Courses',
            iconSrc: '/cap.svg',
            onClick: () => router.push('/'),
          },
          {
            label: 'Archived Courses',
            alt: 'Archived Courses',
            iconSrc: '/Archived.svg',
            onClick: () => router.push('/archived'),
            dataOnboarding: 'archived-button'
          },
          {
            label: 'Database',
            alt: 'Database',
            iconSrc: '/database.svg',
            onClick: () => router.push('/visualizer')
          },
          {
            label: 'Manage Users',
            alt: 'Manage Users',
            iconSrc: '/um.svg',
            onClick: () => router.push('/user-management')
          },
          {
            label: 'Activity Monitor',
            alt: 'Activity Monitor',
            iconSrc: '/performance.svg',
            onClick: () => router.push('/monitor')
          }
        ]}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* HEADER WITH SEARCH/FILTER */}
        <CourseListHeader search={handleSearch} handleFilter={handleFilter} searchPlaceholder="Search courses..." />
        

        {/* COURSE LIST HEADER */}
        <div className="flex items-center justify-between mb-8 px-6">
          <h2 className={`relative inline-block text-3xl font-medium group ${darkMode ? 'text-white' : ''}`}>
            {/* Gradient text (light blue) - only visible in light mode */}
            <span className={`
    ${darkMode ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600'}
    group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-blue-700
    transition-all duration-500
  `}>
              Active Courses
            </span>

            {/* Shine effect overlay - only visible in light mode */}
            {!darkMode && (
              <span className="absolute inset-0 overflow-hidden">
                <span className="absolute top-0 -left-full w-1/2 h-full 
        bg-white/30 -skew-x-12
        group-hover:animate-shine group-hover:[animation-duration:1.8s] 
        transition-all duration-500 pointer-events-none"></span>
              </span>
            )}
          </h2>
          <AddCourseButton darkMode={darkMode} onSubmit={handleCourseCreated} />
        </div>

        {/* COURSE LIST CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 min-h-[200px]">
          {isLoading ? (
            // Loading state
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            // Error state
            <div className={`text-center ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              {error}
            </div>
          ) : courses.length === 0 ? (
            // Empty state
            <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-full h-full flex items-center justify-center text-xl`}>
              Create your first course!
            </div>
          ) : (
            // Course grid with drag-and-drop context
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[
                ({ transform }) => ({
                  ...transform,
                  x: transform.x * 1.25,
                  y: transform.y * 1.25,
                }),
              ]}
            >
              <SortableContext
                items={filteredCourses.map(course => course.classroom_id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 md:gap-6 gap-1 pb-8">
                  {filteredCourses.map((course) => (
                    <CourseCard
                      key={course.classroom_id}
                      id={course.classroom_id.toString()}
                      classroom={course}
                      darkMode={darkMode}
                      refreshCourses={fetchCourses}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}