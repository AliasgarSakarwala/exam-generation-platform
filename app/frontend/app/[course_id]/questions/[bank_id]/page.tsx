"use client";

import CourseListHeader from '@/app/components/CourseListHeader';
import CourseListSidebar from '@/app/components/CourseListSidebar';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef, useTransition, useCallback } from 'react'
import { getQuestionBankByID } from '@/services/question_bank';
import Loading from '@/app/loading';
import { getClassroomById } from '@/services/classroom';
import { Classroom } from '@/services/classroom';
import toast from 'react-hot-toast';
import { FaEllipsisVertical, FaPlus } from 'react-icons/fa6';
import Papa from 'papaparse';
import * as XLSX from "xlsx";
import { FileData } from '@/components/QuestionBank/question_bank_preview';
import { useAuth } from '@/context/AuthContext';
import ImportComponent from '@/components/QuestionBank/import-comp';
import QuestionDataTable from './component/QuestionDataTable';
import AddManualQuestion from './component/AddManualQuestion';
import { useOnboarding } from '@/context/OnboardingContext';
import { getOnboardingSteps } from '@/config/onboardingSteps';
import { OnboardingPages } from '@/config/onboardingSteps';
import { updateUser } from '@/services/profile';
import OnboardingStep from '@/components/OnboardingStep';

interface QuestionBankDetailsProps {
    params: Promise<{ bank_id: string }>
}

const QuestionBankDetailsWithOnboarding: React.FC<QuestionBankDetailsProps> = ({ params }) => {
    const { state, completeStep, skipTour } = useOnboarding();
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
    const steps = getOnboardingSteps(OnboardingPages.questionBankDetails);
    const currentStep = steps[state.currentStep];

    // Unified finder for the current onboarding step’s target
    useEffect(() => {
        if (!state.isActive || !currentStep) {
            setTargetElement(null);
            return;
        }

        const { id: stepId, targetSelector: selector } = currentStep;

        // ——— SKIP “edit-student-0” if no question bank cards present ———
        if (stepId === 'edit-questionBankDetails-0' || stepId === 'delete-questionBankDetails-0') {
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
            comp_tutorial_page: 'studentManagement'
        }
        updateUser({ payload });
    }

    const handleSkip = () => {
        skipTour();
        updateDBwithCompletedOnboarding();
    };

    return (
        <>
            <QuestionBankDetails params={params} />
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

export default function QuestionBankDetailsWrapper({ params }: QuestionBankDetailsProps) {
    return <QuestionBankDetailsWithOnboarding params={params} />;
};

function QuestionBankDetails({ params }: QuestionBankDetailsProps) {
    const { bank_id } = React.use(params);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [bankDetails, setBankDetails] = useState<any>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [newFilesData, setNewFilesData] = useState<FileData[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [showManualQuestionModal, setShowManualQuestionModal] = useState(false);
    const course_id = Number(window.location.pathname.split("/")[1]);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    useEffect(() => {
        startTransition(() => {
            const course_id = Number(window.location.pathname.split("/")[1])
            getClassroomById(course_id)
                .then((res) => {
                    if (res.status >= 200 && res.status < 300) {
                        setClassroom(res.data)
                        getQuestionBankByID(Number(bank_id), Number(course_id))
                            .then((res) => {
                                if (res.status >= 200 && res.status < 300) {
                                    setBankDetails(res.data)
                                    console.log("Question Bank Data:", res.data);
                                }
                            })
                    }
                })
        });
    }, [bank_id]);

    const onDrop = useCallback((files: File[]) => {
        const parsedPromises = files.slice(0, 10).map((file) => {
            return new Promise<any>((resolve, reject) => {
                const fileName = file.name.replace(/\.(csv|xlsx|xls)$/, "");
                const finish = (data: Record<string, any>[]) => {
                    const cols = Object.keys(data[0] || {}).filter(
                        (k) => !k.startsWith("Option") && k !== "Answer" && k !== "dbID"
                    );
                    resolve({
                        id: fileName,
                        fileName,
                        columns: cols,
                        rows: data,
                    });
                };
                if (file.name.endsWith(".csv")) {
                    Papa.parse(file, {
                        header: true,
                        skipEmptyLines: true,
                        complete: ({ data }) => finish(data as any[]),
                        error: reject,
                    });
                } else {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const wb = XLSX.read(e.target?.result, { type: "array" });
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        finish(XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[]);
                    };
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(file);
                }
            });
        });

        Promise.all(parsedPromises).then((filesData) => {
            setNewFilesData((prev) => {
                const seen = new Set(prev.map((f) => f.fileName));
                return [...prev, ...filesData.filter((f) => !seen.has(f.fileName))];
            });
        });
    }, []);

    const handleQuestionAdded = () => {
        // Refresh the question bank data after adding a new question
        const course_id = Number(window.location.pathname.split("/")[1]);
        getQuestionBankByID(Number(bank_id), course_id)
            .then((res) => {
                if (res.status >= 200 && res.status < 300) {
                    setBankDetails(res.data);
                }
            });
    };

    const handleQuestionDeleted = () => {
        // Refresh the question bank data after deleting a question
        handleQuestionAdded();
    };

    if (isPending || !user) return <Loading />;

    return (
        <div className="flex bg-[#EDEDED] h-screen overflow-hidden">
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    onDrop(files);
                    e.target.value = "";
                }}
            />
            <CourseListSidebar
                darkMode={false}
                archived={user.role === "Admin"}
                onToggleDarkMode={() => { }}
                tutorialPage="questionBankDetails"
                middleButtons={[
                    {
                        label: 'Active Courses',
                        alt: 'Active Courses',
                        iconSrc: '/cap.svg',
                        onClick: () => router.push('/'),
                    },
                    {
                        label: 'Exam Dashboard',
                        alt: 'Exam Dashboard',
                        iconSrc: '/home.svg',
                        onClick: () => router.push(window.location.pathname.replace(/\/questions\/.*/, "")),
                    },
                    {
                        label: 'Question Banks',
                        alt: 'Question Banks',
                        iconSrc: '/question-bank.svg',
                        onClick: () => router.push(window.location.pathname.replace(/\/[^/]+$/, "")),
                    },
                    {
                        label: 'Students Roster',
                        alt: 'Students Roster',
                        iconSrc: '/students.svg',
                        onClick: () => router.push(window.location.pathname.replace(/\/questions\/.*/, "/students")),
                    },
                    {
                        label: 'Grades Analytics',
                        alt: 'Grades Analytics',
                        iconSrc: '/student-grade.svg',
                        onClick: () => router.push(window.location.pathname.replace(/\/questions\/.*/, "/students-grades")),
                    },
                    {
                        label: 'Course Analytics',
                        alt: 'Course Analytics',
                        iconSrc: '/line-chart-line.svg',
                        onClick: () => router.push(window.location.pathname.replace(/\/questions\/.*/, "/courseanalytics")),
                    },
                ]}
            />

            <div className="flex flex-col flex-1 p-6 overflow-hidden">
                <CourseListHeader
                    search={() => { }}
                    searchPlaceholder="Search Questions..."
                    showBackArrow={true}
                    router={router}
                />

<div className="flex flex-col flex-1 overflow-hidden">
    <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
            <h1 className={`relative inline-block text-2xl font-medium group`}>
                {/* Gradient text (light orange) - only visible in light mode */}
                <span className={`
                    ${'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600'}
                    group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-700
                    transition-all duration-500`}>
                    {classroom?.name + " - " + bankDetails?.name}
                </span>
            </h1>

            <div
                ref={menuRef}
                className="relative inline-flex items-center p-1 hover:bg-gray-300 rounded-full cursor-pointer text-[#3774E5]"
                onClick={() => { setMenuOpen(!menuOpen) }}
            >
                <FaEllipsisVertical className="w-4 h-4" data-testid="options-button" data-onboarding="ellipsis-menu-qb" />
                {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded shadow-lg z-50">
                        <button
                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                            Edit
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* EXPORT button */}
        <div className="flex items-center gap-4">
            <button
                className={`relative inline-flex items-center gap-2 text-lg font-medium group`}
                onClick={() => {
                    const link = document.createElement("a");
                    link.href = "/question-bank-template.zip";
                    link.download = "question-bank-template.zip";
                    link.click();
                }}
            >
                <img
                    src="/export.svg"
                    alt="Export Template"
                    className="w-6 h-6"
                    style={{
                        filter: 'brightness(0) saturate(100%) invert(61%) sepia(95%) saturate(300%) hue-rotate(330deg) brightness(90%) contrast(90%)',
                    }}
                />
                <span className={`
                    ${'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600'}
                    group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-700
                    transition-all duration-500`}>
                    Export Template
                </span>
                {(
                    <span className="absolute inset-0 overflow-hidden">
                        <span className="absolute top-0 -left-full w-1/2 h-full 
                            bg-white/30 -skew-x-12
                            group-hover:animate-shine group-hover:[animation-duration:1.8s] 
                            transition-all duration-500 pointer-events-none"></span>
                    </span>
                )}
            </button>
            
            <button
                className={`
                    relative overflow-hidden
                    text-white font-medium text-sm border-none rounded-full
                    cursor-pointer shadow-lg hover:shadow-xl
                    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    inline-flex items-center justify-center gap-2
                    bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700
                    hover:from-orange-600 hover:via-orange-700 hover:to-orange-800
                    active:from-orange-700 active:via-orange-800 active:to-orange-900
                    focus:outline-none focus:ring-2 focus:ring-orange-400/80 focus:ring-offset-2
                    group
                    px-4 py-2
                    min-w-[140px]
                `}
                onClick={() => setShowAddQuestionModal(true)}
                data-onboarding="add-new-questions"
            >
                <FaPlus className="relative z-10 w-4 h-4 transition-transform duration-600 ease-in-out group-hover:rotate-[720deg]" />
                Add New Question
            </button>
        </div>
    </div>

    {bankDetails && (
        <div className="flex-1 overflow-auto px-2">
            <QuestionDataTable
                data={bankDetails}
                classroomId={course_id}
                onQuestionDeleted={handleQuestionDeleted}
            />
        </div>
    )}
</div>
            </div>

            {showAddQuestionModal && (
                <ImportComponent
                    setShowAddModal={setShowAddQuestionModal}
                    setSingleEntry={() => {
                        setShowAddQuestionModal(false);
                        setShowManualQuestionModal(true);
                    }}
                    fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                    title="Add New Question"
                />
            )}

            {showManualQuestionModal && classroom && (
                <AddManualQuestion
                    questionBankId={Number(bank_id)}
                    classroomId={course_id}
                    isOpen={showManualQuestionModal}
                    onClose={() => setShowManualQuestionModal(false)}
                    onQuestionAdded={handleQuestionAdded}
                />
            )}
        </div>
    )
}