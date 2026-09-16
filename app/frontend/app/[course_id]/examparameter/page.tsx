'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import CourseListSidebar from "../../components/CourseListSidebar";
import ExamHeader from "../../components/ExamHeader";
import ExamDetails from "../../components/ExamDetails";
import CourseListHeader from '../../components/CourseListHeader';
import { useAuth } from '@/context/AuthContext';
import Loading from '@/app/loading';
import { useOnboarding } from '@/context/OnboardingContext';
import { getOnboardingSteps } from '@/config/onboardingSteps';
import { useEffect } from 'react';
import OnboardingStep from '@/components/OnboardingStep';
import { OnboardingPages } from '@/config/onboardingSteps';
import { updateUser } from '@/services/profile';

function ExamParameterPageWithOnboarding() {
    const { state, completeStep, skipTour } = useOnboarding();
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
    const steps = getOnboardingSteps(OnboardingPages.examParameter);
    const currentStep = steps[state.currentStep];

    // Unified finder for the current onboarding step’s target
    useEffect(() => {
        if (!state.isActive || !currentStep) {
            setTargetElement(null);
            return;
        }

        console.log(steps);

        const { id: stepId, targetSelector: selector } = currentStep;

        let interval: number;

        const findAndScroll = () => {
            const el = document.querySelector(selector) as HTMLElement | null;
            console.log(el);
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
    }, [state.isActive, state.currentStep]);

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
            comp_tutorial_page: 'examParameter'
        }
        updateUser({ payload });
    }

    const handleSkip = () => {
        skipTour();
        updateDBwithCompletedOnboarding();
    };

    return (
        <>
            <ExamParameterPage />
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
export default function ExamParameterWrapper() {
    return <ExamParameterPageWithOnboarding />;
};

function ExamParameterPage() {
    const [darkMode, setDarkMode] = useState(false);
    const router = useRouter();
    const { startOnboarding } = useOnboarding();
    const { user } = useAuth();

    if (!user) {
        return <Loading />
    }

    useEffect(() => {
        if (user) {
            if (!(user?.comp_tutorial_pages.includes('examParameter'))) {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key?.startsWith('onboarding_examParameter_')) {
                        localStorage.removeItem(key);
                    }
                }
                // now kick off the onboarding tour
                startOnboarding('examParameter');
            }
        }
    }, [user]);

    return (
        <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#EDEDED] text-black'} overflow-hidden`}>
            <CourseListSidebar
                darkMode={darkMode}
                archived={user.role === 'Admin'}
                tutorialPage="examParameter"
                onToggleDarkMode={() => setDarkMode((prev) => !prev)}
                middleButtons={[
                    {
                        label: 'Live Courses',
                        alt: 'Live Courses',
                        iconSrc: '/cap.svg',
                        onClick: () => router.push('/'),
                    },
                    {
                        label: 'Dashboard',
                        alt: 'Dashboard',
                        iconSrc: '/home.svg',
                        onClick: () => router.push(window.location.pathname.replace('/examparameter', '')),
                    },
                    {
                        label: 'Question Banks',
                        alt: 'Question Banks',
                        iconSrc: '/question-bank.svg',
                        onClick: () => router.push(window.location.pathname.replace('/examparameter', '/questions')),
                    },
                    {
                        label: 'Students',
                        alt: 'Students',
                        iconSrc: '/students.svg',
                        onClick: () => router.push(window.location.pathname.replace('/examparameter', '/students')),
                    },
                    {
                        label: 'Grades Analytics',
                        alt: 'Grades Analytics',
                        iconSrc: '/student-grade.svg',
                        onClick: () => router.push(window.location.pathname.replace('/examparameter', '/students-grades')),
                    },
                    {
                        label: 'Analytics',
                        alt: 'Analytics',
                        iconSrc: '/line-chart-line.svg',
                        onClick: () => router.push(window.location.pathname.replace('/examparameter', '/analytics')),
                    },
                ]}
            />

            <div className="flex flex-col flex-1 p-6">
                <CourseListHeader
                    search={(e) => { }}
                    handleFilter={(e) => { }}
                />
                <main className="flex flex-col flex-1 overflow-hidden">
                    <ExamDetails />
                </main>
            </div>
        </div>
    );
}
