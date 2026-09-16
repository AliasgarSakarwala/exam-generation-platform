'use client';

import SettingsComponents from '../components/SettingsComponents';
import CourseListSidebar from '../components/CourseListSidebar';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Loading from '../loading';

/**
 * UserData - Interface defining the structure of user data
 * 
 * @interface
 * @property {number} user_id - Unique identifier for the user
 * @property {string} role - User's role/privilege level
 * @property {string} username - Display name of the user
 * @property {string} email - User's email address
 * @property {string} language - User's preferred language
 * @property {string} mode - UI preference (e.g., light/dark)
 * @property {boolean} is_active - Account activation status
 */
export interface UserData {
  user_id: number;
  role: string;
  username: string;
  email: string;
  language: string;
  mode: string;
  is_active: boolean;
}

/**
 * SettingsPageConstruct - Main layout component for the settings page
 * 
 * Features:
 * - Provides a consistent layout with sidebar navigation
 * - Manages dark mode state for the entire application
 * - Handles routing between main sections
 * - Integrates the SettingsComponents for content display
 * 
 * Layout Structure:
 * - Left sidebar for navigation
 * - Main content area for settings
 * - Responsive design with overflow handling
 */
export default function SettingsPageConstruct() {
  // ==== ROUTER & STATE MANAGEMENT ==== //
  /**
   * Next.js router instance for programmatic navigation
   */
  const router = useRouter();
  const { user } = useAuth();

  /**
   * Dark mode state management
   * @type {boolean}
   * @default false
   * 
   * Controls:
   * - Global color scheme
   * - Passed down to all child components
   * - Toggled via the sidebar control
   */
  const [darkMode, setDarkMode] = useState(false);

  // ==== SIDEBAR CONFIGURATION ==== //
  /**
   * Navigation buttons configuration for the sidebar
   * 
   * Each button contains:
   * - label: Display text
   * - alt: Accessibility text
   * - iconSrc: Path to icon image
   * - onClick: Navigation handler
   * 
   * Current routes:
   * - Live Courses: Redirects to home page
   * - Archived: Redirects to archived courses
   */
  const middleButtons = [
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
    },
  ];

  if (!user) {
    return <Loading />
  }

  // ==== COMPONENT RENDER ==== //
  return (
    /**
     * Main container div
     * - Uses flex layout for sidebar + content
     * - Sets background color based on design system
     * - Full viewport height
     */
    <div className="flex bg-[#EDEDED] h-screen">
      {/* 
        SIDEBAR COMPONENT 
        - Manages navigation and theme toggling
        - Receives darkMode state and setter
        - Configured with navigation buttons
      */}
      <CourseListSidebar
        darkMode={darkMode}
        archived={user.role === "Admin"}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        middleButtons={middleButtons}

      />

      {/* 
        MAIN CONTENT AREA 
        - flex-1: Takes remaining horizontal space
        - p-4: Padding for content spacing
        - overflow-y-auto: Enables scrolling for long content
      */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/*
          SETTINGS COMPONENT
          - Contains all settings functionality
          - Will inherit darkMode via context or props
        */}
        <SettingsComponents />
      </div>
    </div>
  );
}