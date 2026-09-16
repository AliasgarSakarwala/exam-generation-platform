'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import CourseListSidebar from "../../components/CourseListSidebar";
import ExamCardRoulette from "../../components/ExamCardRoulette";
import ExamHeaderg from "../../components/ExamHeaderg";
import { useQuestionLogic } from '../../components/QuestionLogic';

import ExamCardStatistics from "../../components/ExamCardStatistics"
import { useAuth } from '@/context/AuthContext';
import Loading from '@/app/loading';
import ExamCardUpload from "../../components/ExamCardUpload";
import { getClassroomById } from '@/services/classroom';


export interface QuestionOption {
    id: number;
    text: string;
    letter?: string;
    isCorrect: boolean;
}

export interface Question {
    id: number;
    text: string;
    selected: boolean;
    mandatory: boolean;
    options: QuestionOption[];
    tag: string;
}

export interface ExamData {
    examTitle: string;
    numQuestions: string;
    numVariants: string;
    difficultyDistribution: { easy: string; medium: string; hard: string };
    selectedQuestions: Question[];
}

export default function ExamGeneratedPage() {
    const [darkMode, setDarkMode] = useState(false);
    const router = useRouter();
    const [classroomTitle, setClassroomTitle] = useState('');
    const [examTitle, setExamTitle] = useState('');
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [reloading, setReloading] = useState(false);

    const [examData, setExamData] = useState<ExamData | null>(null);
    const { examVariants } = useQuestionLogic(examData);

    // Function to reload exam variants
    const handleReloadVariants = async () => {
        setReloading(true);
        try {
            // Clear localStorage cache for exam variants
            localStorage.removeItem('examVariants22');

            // Force reload the page to regenerate variants
            window.location.reload();
        } catch (error) {
            console.error('Error reloading variants:', error);
        } finally {
            setReloading(false);
        }
    };



    useEffect(() => {
        const fetchData = async () => {
            try {
                const pathArray = window.location.pathname.split('/');
                const classroomId = parseInt(pathArray[1]);

                // Fetch classroom title
                const classroomResponse = await getClassroomById(classroomId);
                setClassroomTitle(classroomResponse.data.name);

                const storedExamData = localStorage.getItem("examData");
                if (storedExamData) {
                    setExamData(JSON.parse(storedExamData));
                    const parsedData = JSON.parse(storedExamData);
                    setExamTitle(parsedData.examTitle); // Update state
                }


            } catch (error) {
                console.error('Error fetching data:', error);
                // Handle error appropriately
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);




    // useEffect(() => {
    //     const accessedExamGenerated = sessionStorage.getItem('accessed_examgenerated');
    //     if (accessedExamGenerated === 'true') {
    //         router.replace(window.location.pathname.replace("/examgenerated", ""));
    //     }
    // }, []);

    if (!user || loading) {
        return <Loading />;
    }

    return (
        <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
            <div className="sticky top-0 h-screen">
                <CourseListSidebar
                    darkMode={darkMode}
                    archived={user.role === 'Admin'}
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
                            onClick: () => router.push(window.location.pathname.replace("/examgenerated", "")),
                        },
                        {
                            label: 'Question Banks',
                            alt: 'Question Banks',
                            iconSrc: '/question.svg',
                            onClick: () => router.push(window.location.pathname.replace("/examgenerated", "/questions")),
                        },
                        {
                            label: 'Students',
                            alt: 'Students',
                            iconSrc: '/students.svg',
                            onClick: () => router.push(window.location.pathname.replace("/examgenerated", "/students")),
                        },
                        {
                            label: 'Grades Analytics',
                            alt: 'Grades Analytics',
                            iconSrc: '/student-grade.svg',
                            onClick: () => router.push(window.location.pathname.replace('/examgenerated', '/students-grades')),
                        },
                        {
                            label: 'Analytics',
                            alt: 'Analytics',
                            iconSrc: '/line-chart-line.svg',
                            onClick: () => { },
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

                    {/* Reload Button */}
                    {examVariants.length > 0 && (
                        <div className="relative mt-4">
                            <button
                                onClick={handleReloadVariants}
                                disabled={reloading || loading}
                                className={`relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl
        text-white font-medium shadow-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${reloading || loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-teal-500 via-teal-500/90 to-teal-600 hover:from-teal-600 hover:via-teal-600/90 hover:to-teal-700 active:from-teal-700 active:via-teal-700/90 active:to-teal-800'
                                    }
        focus:outline-none focus:ring-2 focus:ring-teal-400/80 focus:ring-offset-2
        ${!reloading && !loading &&
                                    'hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
                                    }
        overflow-hidden
        group
    `}
                            >
                                {/* Gradient overlay */}
                                <span className="absolute inset-0 bg-gradient-to-r 
        from-teal-400/10 via-teal-500/20 to-teal-600/30 
        opacity-0 group-hover:opacity-100 
        transition-opacity duration-700 ease-in-out"></span>

                                {/* Shine effect */}
                                <span className="absolute inset-0 overflow-hidden">
                                    <span className="absolute top-0 -left-full w-1/2 h-full 
            bg-white/20 -skew-x-12
            group-hover:animate-shine group-hover:[animation-duration:1.8s] 
            transition-all duration-500 pointer-events-none"></span>
                                </span>

                                {reloading ? (
                                    <>
                                        <span className="relative z-10">Reloading...</span>
                                        <svg
                                            className="w-5 h-5 animate-spin relative z-10"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </>
                                ) : (
                                    <>
                                        <span className="relative z-10 drop-shadow-sm">Reload Exams</span>
                                        <svg
                                            className="w-5 h-5 relative z-10 transition-all duration-300 
                    group-hover:scale-110 group-hover:animate-[spin_1.5s_linear_infinite] group-hover:drop-shadow-glow"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            style={{ animationDirection: 'reverse' }} // This makes it rotate counter-clockwise
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    <ExamCardUpload />

                </div>

                <div className="-mt-6">
                    <ExamCardRoulette coursetitle={examTitle} coursecode={classroomTitle} examVariants={examVariants} />
                </div>

            </div>

        </div>
    );
}
