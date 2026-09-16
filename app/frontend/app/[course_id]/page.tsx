"use client"

import React, { useEffect, useState } from 'react'
import CourseListSidebar from '../components/CourseListSidebar'
import { useRouter } from 'next/navigation'
import CourseListHeader from '../components/CourseListHeader';
import { FaPlus } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Loading from '../loading';
import ExamDashboardCard from '../components/ExamDashboardCard';
import OnboardingStep from '@/components/OnboardingStep';
import { useOnboarding } from '@/context/OnboardingContext';
import { getOnboardingSteps } from '@/config/onboardingSteps';
import { OnboardingPages } from '@/config/onboardingSteps';
import { updateUser } from '@/services/profile';

declare global {
    interface Window {
        next?: {
            router?: {
                components: Record<string, any>;
            };
        };
    }
}

const ExamDashboardPageWithOnboarding: React.FC = () => {
    const { state, completeStep, skipTour } = useOnboarding();
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
    const steps = getOnboardingSteps(OnboardingPages.exam);
    const currentStep = steps[state.currentStep];

    // Unified finder for the current onboarding step’s target
    useEffect(() => {
        if (!state.isActive || !currentStep) {
            setTargetElement(null);
            return;
        }

        const { id: stepId, targetSelector: selector } = currentStep;

        // ——— SKIP “exam-card-0” if no exam cards present ———
        if (stepId === 'exam-card-0') {
            const cards = document.querySelectorAll(selector);
            if (cards.length === 0) {
                completeStep(stepId);
                if (stepId === steps[steps.length - 1].id) {
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
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return true;
            }
            return false;
        };

        // try immediately, then poll every 100ms
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
    }, [state.isActive, state.currentStep, currentStep, completeStep]);

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
            comp_tutorial_page: 'exam'
        }
        updateUser({ payload });
    }

    const handleSkip = () => {
        skipTour();
        updateDBwithCompletedOnboarding();
    };

    return (
        <>
            <ExamDashboard />
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
export default function ExamDashboardWrapper() {
    return <ExamDashboardPageWithOnboarding />;
};

function ExamDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const { startOnboarding } = useOnboarding();
    const [classroomId, setClassroomId] = useState<number | null>(null);

    useEffect(() => {
        if (user) {
            if (!(user?.comp_tutorial_pages.includes('exam'))) {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key?.startsWith('onboarding_exam_')) {
                        localStorage.removeItem(key);
                    }
                }
                // now kick off the onboarding tour
                startOnboarding('exam');
            }
        }
        const parts = window.location.pathname.split("/");
        console.log(parts);
        setClassroomId(parseInt(parts[1], 10));
    }, []);

    // useEffect(() => {
    //     const parts = window.location.pathname.split("/");
    //     localStorage.clear();
    //     if (typeof window !== 'undefined' && window.next?.router?.components) {
    //         delete window.next.router.components[`/${parts[1]}/examgenerated`];
    //     }
    // }, []);


    if (!user || !classroomId) {
        return <Loading />
    }

    return (
    <div className={`flex min-h-[450px] min-w-[500px] overflow-hidden transition-colors duration-300 bg-gray-100`} style={{ height: '100vh', maxHeight: '100vh' }}>
            <CourseListSidebar
                darkMode={false}
                onToggleDarkMode={() => { }}
                archived={user?.role === 'Admin'}
                tutorialPage="exam"
                middleButtons={[
                    {
                        label: 'Active Courses',
                        alt: 'Active Courses',
                        iconSrc: '/cap.svg',
                        onClick: () => router.push('/'),
                    },
                    {
                        label: 'Exam Dashboard',
                        alt: 'ExamDashboard',
                        iconSrc: '/home.svg',
                        onClick: () => window.location.reload(),
                    },
                    {
                        label: 'Question Banks',
                        alt: 'Question Banks',
                        iconSrc: '/question-bank.svg',
                        dataOnboarding: 'question-bank',
                        onClick: () => router.push(window.location.pathname + "/questions"),
                    },
                    {
                        label: 'Student Roster',
                        alt: 'Students Roster',
                        iconSrc: '/students.svg',
                        dataOnboarding: 'students',
                        onClick: () => router.push(window.location.pathname + "/students"),
                    },
                    {
                        label: 'Grades Analytics',
                        alt: 'Grades Analytics',
                        iconSrc: '/student-grade.svg',
                        onClick: () => router.push(window.location.pathname + '/students-grades'),
                    },
                    {
                        label: 'Course Analytics',
                        alt: 'Course Analytics',
                        iconSrc: '/line-chart-line.svg',
                        dataOnboarding: 'course-analytics-section',
                        onClick: () => router.push(window.location.pathname + "/courseanalytics"),
                    },
                    {
                        label: 'TA Management',
                        alt: 'TA Management',
                        iconSrc: '/ManageTAs.svg',
                        onClick: () => router.push("/Ta_management"),
                    },
                ]}
            />
            <div className="flex-1 p-4 overflow-y-auto">
                <CourseListHeader
                    search={() => { }}
                    searchPlaceholder="Search Exams..."
                />
                <div className="flex items-center justify-between mb-2">
                    <h1 className={`relative inline-block text-3xl font-medium group ''`}>
                        {/* Gradient text (light orange) - only visible in light mode */}
                        <span className={`
    ${'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600'}
    group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-700
    transition-all duration-500 `}>
                            Exam Dashboard
                        </span>

                        {/* Shine effect overlay - only visible in light mode */}
                        {(
                            <span className="absolute inset-0 overflow-hidden">
                                <span className="absolute top-0 -left-full w-1/2 h-full 
        bg-white/30 -skew-x-12
        group-hover:animate-shine group-hover:[animation-duration:1.8s] 
        transition-all duration-500 pointer-events-none"></span>
                            </span>
                        )}
                    </h1>
                    <button
                        data-onboarding="add-exam"
                        className={`
    relative overflow-hidden
    text-white font-medium text-sm border-none rounded-full
    cursor-pointer shadow-lg hover:shadow-xl
    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
    flex items-center justify-center
    bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700
    hover:from-orange-600 hover:via-orange-700 hover:to-orange-800
    active:from-orange-700 active:via-orange-800 active:to-orange-900
    focus:outline-none focus:ring-2 focus:ring-orange-400/80 focus:ring-offset-2
    group
    px-6 py-3  // Increased padding 
    min-w-[140px] // Ensures consistent width
  `}
                        onClick={() => {
                            router.push(window.location.pathname + "/examparameter")
                        }}
                    >
                        {/* Gradient overlay */}
                        <span className="absolute inset-0 bg-gradient-to-r 
    from-orange-400/10 via-orange-500/20 to-orange-600/30 
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
                        <FaPlus className="relative z-10 w-5 h-5 transition-transform duration-600 ease-in-out group-hover:rotate-[720deg]" />

                        {/* Text */}
                        <span className="relative z-10 ml-3 text-lg">Add Exam</span>
                    </button>
                </div>



                <div className="mb-2 h-1/2">
                    <ExamDashboardCard classroomId={classroomId} />
                </div>



                <div className="items-center justify-center mb-2 h-1/3">
                    <h1 className={`relative inline-block text-2xl font-medium group ''`}>
                        {/* Gradient text (light orange) - only visible in light mode */}
                        <span className={`
    ${'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600'}
    group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-700
    transition-all duration-500 `}>
                            Overall Analytics
                        </span>

                        {/* Shine effect overlay - only visible in light mode */}
                        {(
                            <span className="absolute inset-0 overflow-hidden">
                                <span className="absolute top-0 -left-full w-1/2 h-full 
        bg-white/30 -skew-x-12
        group-hover:animate-shine group-hover:[animation-duration:1.8s] 
        transition-all duration-500 pointer-events-none"></span>
                            </span>
                        )}
                    </h1>
                    <div className="flex items-center justify-center gap-4 w-full">
                        <p>Under Development!</p>
                    </div>
                </div>
            </div>
        </div>
    )
}