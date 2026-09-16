'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import CourseListSidebar from "../../../../components/CourseListSidebar";
import ExamCardRoulette from "../../../../components/ExamCardRoulette";
import ExamHeaderg from "../../../../components/ExamHeaderg";
import DownloadExamsButton from "./components/DownloadExamsButton";
import ExamCardStatistics from "../../../../components/ExamCardStatistics";
import { useExamCardDetails } from "./components/ExamCardDetails";
import { useAuth } from '@/context/AuthContext';
import Loading from '@/app/loading';

import { getClassroomById } from '@/services/classroom';
import { useOnboarding } from '@/context/OnboardingContext';
import { getOnboardingSteps } from '@/config/onboardingSteps';
import OnboardingStep from '@/components/OnboardingStep';
import { OnboardingPages } from '@/config/onboardingSteps';
import { updateUser } from '@/services/profile';

interface ExamVariantWithQuestions {
    exam_variant_id: number;
    version_number: number;
    answer_key?: string | null;
    questions: Array<{
        question_text: string;
        question_number: number;
        options: string[];
        correct_options: string[];
        tag: string;
    }>;
}

const ExamVariantPageWithOnboarding: React.FC = () => {
    const { state, completeStep, skipTour } = useOnboarding();
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
    const steps = getOnboardingSteps(OnboardingPages.examVariant);
    const currentStep = steps[state.currentStep];

    // Unified finder for the current onboarding step's target
    useEffect(() => {
        if (!state.isActive || !currentStep) {
            setTargetElement(null);
            return;
        }

        const { id: stepId, targetSelector: selector } = currentStep;

        // ——— SKIP "exam-variant-card-0" if no exam variant cards present ———
        if (stepId === 'exam-variant-card-0') {
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
            comp_tutorial_page: 'examVariant'
        }
        updateUser({ payload });
    }

    const handleSkip = () => {
        skipTour();
        updateDBwithCompletedOnboarding();
    };

    return (
        <>
            <ExamGeneratedPage />
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
export default function ExamVariantWrapper() {
    return <ExamVariantPageWithOnboarding />;
};

function ExamGeneratedPage() {
    const [darkMode, setDarkMode] = useState(false);
    const [classroomTitle, setClassroomTitle] = useState('');
    const [examTitle, setExamTitle] = useState('');
    const [examId, setExamId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user } = useAuth();
    const [examVariants, setExamVariants] = useState<ExamVariantWithQuestions[]>([]);
    const { startOnboarding } = useOnboarding();

    // Always call hooks unconditionally at the top level
    const { examData: generatedVariants, loading: variantsLoading } = useExamCardDetails(examId);

    useEffect(() => {
        if (user) {
            if (!(user?.comp_tutorial_pages.includes('examVariant'))) {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key?.startsWith('onboarding_examVariant_')) {
                        localStorage.removeItem(key);
                    }
                }
                // now kick off the onboarding tour
                startOnboarding('examVariant');
            }
        }
        const fetchData = async () => {
            try {
                const pathArray = window.location.pathname.split('/');
                const classroomId = parseInt(pathArray[1]);
                const examId = parseInt(pathArray[3]);
                setExamId(examId);

                const examTitle = localStorage.getItem('examTitle');

                // Check localStorage for cached exam variants
                const cachedVariants = localStorage.getItem(`ExamCardDetails-${examId}`);
                
                if (cachedVariants) {
                    try {
                        const parsedVariants = JSON.parse(cachedVariants);
                        //console.log(cachedVariants)
                        if (parsedVariants && parsedVariants.length > 0) {
                            setExamVariants(parsedVariants);
                        }
                    } catch (e) {
                        console.error('Error parsing cached variants:', e);
                    }
                }

                // Fetch classroom title
                const classroomResponse = await getClassroomById(classroomId);
                setClassroomTitle(classroomResponse.data.name);

                setExamTitle(examTitle || 'Untitled Exam');
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        // Only update from generatedVariants if we didn't get data from localStorage
        if (generatedVariants && !variantsLoading && examVariants.length === 0) {
            setExamVariants(generatedVariants);
        }
    }, [generatedVariants, variantsLoading, examVariants.length]);

    if (!user || loading || variantsLoading) {
        return <Loading />;
    }

    return (
        <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
            <div className="sticky top-0 h-screen">
                <CourseListSidebar
                    darkMode={darkMode}
                    archived={user.role === 'Admin'}
                    onToggleDarkMode={() => setDarkMode((prev) => !prev)}
                    tutorialPage='examVariant'
                    middleButtons={[
                        {
                            label: 'Active Courses',
                            alt: 'Live Courses',
                            iconSrc: '/cap.svg',
                            onClick: () => router.push('/'),
                        },
                        {
                            label: 'Exam Dashboard',
                            alt: 'Dashboard',
                            iconSrc: '/home.svg',
                            onClick: () => router.push(window.location.pathname.replace(`exams/${examId}/exam-variant`, "")),
                        },
                        {
                            label: 'View Variants',
                            alt: 'View Variants',
                            iconSrc: '/variants.svg',
                            onClick: () => window.location.reload(),
                        },
                        {
                            label: 'Upload Grade',
                            alt: 'Upload Grade',
                            iconSrc: '/mark.svg',
                            onClick: () => router.push(window.location.pathname.replace(`/exam-variant`, "/upload-grades")),
                        },
                        {
                            label: 'Exam Analytics',
                            alt: 'Exam Analytics',
                            iconSrc: '/line-chart-line.svg',
                            onClick: () => router.push(window.location.pathname.replace(`/exam-variant`, "/examanalytics")),
                        },
                    ]}
                />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>

                <ExamHeaderg />
                
                    <div className="flex justify-between mb-4">
                        <ExamCardStatistics variantData={examVariants} />
                        <DownloadExamsButton examId={examId || 0} title={`${classroomTitle}\u00A0\u00A0${examTitle}`} />
                    </div>
                    
                    <div className="-mt-6">
                        <ExamCardRoulette
                            coursetitle={examTitle}
                            coursecode={classroomTitle}
                            examVariants={examVariants}
                        />
                    </div>
                
            </div>
        </div>
    );
}