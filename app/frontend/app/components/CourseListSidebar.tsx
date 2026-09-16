"use client";

import React, { useState, useEffect } from "react";
import { logout } from "@/services/auth";
import Loading from "@/app/loading";
import toast from 'react-hot-toast';
import { useRouter, usePathname } from "next/navigation";
import SidebarButton from "@/components/side-bar-button";
import { useLoading } from "@/context/LoadingContext";
import { useOnboarding } from "@/context/OnboardingContext";

interface CourseListSidebarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  tutorialPage?: 'course' | 'exam' | 'questionBank' | 'questionBankDetails' | 'studentManagement' | 'examVariant' | 'examParameter' | 'courseAnalytics' | 'gradeAnalytics' | 'userManagement';
  archived: boolean;
  middleButtons: {
    label: string;
    alt: string;
    iconSrc: string;
    dataOnboarding?: string;
    onClick: () => void;
  }[];
}

export default function CourseListSidebar({
  darkMode,
  archived = false,
  onToggleDarkMode,
  tutorialPage,
  middleButtons,
}: CourseListSidebarProps) {
  const [hoverStates, setHoverStates] = useState({
    live: false,
    archived: false,
    theme: false,
    logout: false,
  });
  const [gradientColor, setGradientColor] = useState<'blue' | 'violet' | 'amber' | 'teal'>('violet');
  const pathname = usePathname();

  useEffect(() => {
    // Check the current route and set the appropriate gradient color
    if (pathname === '/' || pathname === '/settings'|| pathname === '/monitor'|| pathname === '/user-management') {
      setGradientColor('blue');
    } else if (pathname.match(/^\/\d+\/exams(\/|$)/) || pathname.match(/\/examgenerated(\/|$)/) ) {
      setGradientColor('teal');
    } else if (pathname.match(/^\/\d+(\/|$)/)) {
      setGradientColor('amber');
    } else {
      setGradientColor('violet');
    }
  }, [pathname]);

  const router = useRouter();
  const { setLoading } = useLoading();
  const { startOnboarding } = useOnboarding();

  const handleHover = (key: keyof typeof hoverStates, value: boolean) => {
    setHoverStates(prev => ({ ...prev, [key]: value }));
  };

  const handleFeatureNotAvailable = () => {
    toast.error('This feature is not yet available ❌', {
      position: 'bottom-center',
      style: {
        background: darkMode ? '#1e293b' : gradientColor === 'blue' ? '#3774E5' : 
                  gradientColor === 'amber' ? '#f59e0b' : 
                  gradientColor === 'teal' ? '#10b981' : '#7c3aed',
        color: 'white',
      },
    });
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.replace('/auth/login');
    } catch {
      toast.error('Logout failed. Please try again ❌');
    } finally {
      setLoading(false);
    }
  };

  // Determine the gradient classes based on the current color
  const getGradientClasses = () => {
    if (darkMode) return 'bg-gray-900';
    
    switch (gradientColor) {
      case 'blue':
        return 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700';
      case 'amber':
        return 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600';
      case 'teal':
        return 'bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700';
      case 'violet':
      default:
        return 'bg-gradient-to-br from-violet-600 via-violet-700 to-violet-800';
    }
  };

  return (
    <>
      <aside className={`
        lg:w-[230px] w-[80px] 
        flex flex-col items-center p-4 rounded-2xl m-4
        sticky top-4 h-[calc(100vh-32px)] overflow-y-auto
        self-start
        relative overflow-hidden z-[60]
        ${getGradientClasses()}
      `} data-testid="sidebar" data-sidebar="true">
        {/* Shine effect overlay - only in light mode */}
        {!darkMode && (
          <span className="absolute inset-0 overflow-hidden">
            <span className="absolute top-0 -left-full w-1/2 h-full 
              bg-white/20 -skew-x-12
              group-hover:animate-shine group-hover:[animation-duration:1.8s] 
              transition-all duration-500 pointer-events-none"></span>
          </span>
        )}

        {/* SECTION: LOGO & TITLE */}
        <div className="w-full flex flex-col items-center justify-center mb-6 relative z-10">
          <div className="flex items-center justify-center lg:space-x-3 space-x-0">
            <img
              src="/ct3_logo.png"
              alt="CT3 Logo"
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className={`text-white text-2xl font-semibold lg:block hidden`}>
              CT3 - EGAS
            </span>
          </div>
        </div>

        {/* SECTION: DYNAMIC MIDDLE BUTTONS */}
        <div className="w-full flex flex-col items-center space-y-3 px-2 relative z-10">
          {middleButtons.map((button) => (
            <SidebarButton
              key={button.label}
              alt={button.alt}
              label={button.label}
              iconSrc={button.iconSrc}
              onClick={button.onClick}
              darkMode={darkMode}
              dataOnboarding={button.label === 'Archived' ? 'archived-button' : button.dataOnboarding}
            />
          ))}
        </div>

        {/* Flexible spacer to push bottom buttons down */}
        <div className="flex-grow" />

        {/* SECTION: BOTTOM ACTION BUTTONS (Start Tutorial, Theme & Logout) */}
        <div className="w-full flex flex-col items-center space-y-3 px-2 mb-2 relative z-10">
          {/* Start Tutorial Button */}
          <SidebarButton
            alt="Start Tutorial"
            label="Start Tutorial"
            iconSrc="/tutorial.svg"
            onClick={() => {
              // Determine the correct prefix based on tutorial page
              let prefix = 'onboarding_course_';
              if (tutorialPage === 'courseAnalytics') {
                prefix = 'onboarding_courseAnalytics_';
              } else if (tutorialPage === 'exam') {
                prefix = 'onboarding_exam_';
              } else if (tutorialPage === 'questionBank') {
                prefix = 'onboarding_questionBank_';
              } else if (tutorialPage === 'questionBankDetails') {
                prefix = 'onboarding_questionBankDetails_';
              } else if (tutorialPage === 'studentManagement') {
                prefix = 'onboarding_studentManagement_';
              } else if (tutorialPage === 'examVariant') {
                prefix = 'onboarding_examVariant_';
              } else if (tutorialPage === 'examParameter') {
                prefix = 'onboarding_examParameter_';
              } else if (tutorialPage === 'gradeAnalytics') {
                prefix = 'onboarding_gradeAnalytics_';
              } else if (tutorialPage === 'userManagement') {
                prefix = 'onboarding_userManagement_';
              }
              // iterate backwards so removing keys doesn’t throw off the index
              for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key?.startsWith(prefix)) {
                  localStorage.removeItem(key);
                }
              }
              startOnboarding(tutorialPage ?? 'course');
            }}
            darkMode={darkMode}
            dataOnboarding="start-tutorial"
          />

          {/* Theme Toggle Button */}
          <div
            className="flex items-center cursor-pointer w-full max-w-[180px]"
            onMouseEnter={() => handleHover('theme', true)}
            onMouseLeave={() => handleHover('theme', false)}
            onClick={onToggleDarkMode}
          >
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              transition-all duration-200 
              ${hoverStates.theme ? 
                (darkMode ? 'bg-gray-700 shadow-sm' : 
                  `bg-${gradientColor}-400/30 shadow-sm`) 
                : 'bg-transparent'}
            `}>
              <img
                src={darkMode ? "/LightMode.svg" : "/DarkMode.svg"}
                alt={darkMode ? "LightMode" : "DarkMode"}
                className={`transition-transform duration-200 
                  ${hoverStates.theme ? 'scale-110' : 'scale-100'}
                  ${darkMode ? 'w-6 h-6' : 'w-5 h-5'}
                `}
              />
            </div>
            <span className={`
              ml-3 text-white font-medium text-base
              transition-opacity duration-200 
              ${hoverStates.theme ? 'opacity-100' : 'opacity-80'} 
              lg:block hidden
            `}>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </span>
          </div>

          {/* Logout Button */}
          <div
            data-onboarding="logout-button"
            className="flex items-center cursor-pointer w-full max-w-[180px]"
            onMouseEnter={() => handleHover('logout', true)}
            onMouseLeave={() => handleHover('logout', false)}
            onClick={handleLogout}
          >
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              transition-all duration-200 
              ${hoverStates.logout ? 
                (darkMode ? 'bg-gray-700 shadow-sm' : 
                  `bg-${gradientColor}-400/30 shadow-sm`) 
                : 'bg-transparent'}
            `}>
              <img
                src="/Logout.svg"
                alt="Logout"
                className={`
                  w-5 h-5 transition-transform duration-200 
                  ${hoverStates.logout ? 'scale-110' : 'scale-100'}
                `}
              />
            </div>
            <span className={`
              ml-3 text-white font-medium text-base
              transition-opacity duration-200 
              ${hoverStates.logout ? 'opacity-100' : 'opacity-80'} 
              lg:block hidden
            `}>
              Logout
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}