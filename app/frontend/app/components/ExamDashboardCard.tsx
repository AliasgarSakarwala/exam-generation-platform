"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Exam } from '../../services/exam';
import { ExamService } from '../../services/exam';
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ExamCardProps {
    classroomId: number;
    exam: Exam;
    darkMode?: boolean;
    refreshExams: () => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ classroomId, exam, darkMode = false, refreshExams }) => {

    const router = useRouter();
    const getRandomColor = () => {
        const colors = [
    "#3B82F6", // Blue  
    "#EF4444", // Red (existing, but you may remove)  
    "#10B981", // Green  
    "#6366F1", // Soft purple-blue  
    "#EC4899", // Pink (existing, but you may remove)  
    "#14B8A6", // Teal  
    "#8B5CF6", // Muted violet  
    "#06D6A0", // Fresh mint green  
    "#2563EB", // Deep navy-blue  
    "#7C3AED", // Rich lavender  
    "#059669", // Darker emerald green  
    "#0EA5E9", // Sky blue  
];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const [cardColor] = useState(getRandomColor());
    const [isHoveringTrash, setIsHoveringTrash] = useState(false);
    const trashRef = useRef<HTMLButtonElement>(null);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const hexToRgba = (hex: string, opacity: number): string => {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const handleDelete = async () => {
        try {
            await ExamService.deleteExam(exam.exam_id);
            toast.success('Exam deleted successfully');
            refreshExams();
        } catch (error) {
            toast.error('Failed to delete exam');
            console.error('Failed to delete exam:', error);
        }
    };

    return (
        <div
            style={{
                '--shadow-color': hexToRgba(cardColor, 0.2),
            } as React.CSSProperties}

            onClick={() => {
                localStorage.setItem('examTitle', exam.title);
                router.push(`${classroomId}/exams/${exam.exam_id}/exam-variant`);
            }}
            className={`flex w-[280px] h-[170px] rounded-xl overflow-hidden bg-white m-3 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.4,1)] hover:scale-[1.02] hover:shadow-[0_12px_28px_var(--shadow-color),0_3px_6px_rgba(0,0,0,0.1)]`}
        >
            {/* Left (content) section - 70% width */}
            <div className="flex-1 flex flex-col justify-between p-3 w-[70%]">
                <div>
                    <div className="font-semibold text-lg text-gray-800 line-clamp-1 mb-1">
                        {exam.title}
                    </div>
                

                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div className="bg-gray-50 p-1.5 rounded">
                        <div className="text-gray-500 text-[0.7rem]">Points</div>
                        <div className="font-medium">{exam.total_points}</div>
                    </div>
                    <div className="bg-gray-50 p-1.5 rounded">
                        <div className="text-gray-500 text-[0.7rem]">Questions</div>
                        <div className="font-medium">{exam.question_count}</div>
                    </div>
                    <div className="bg-gray-50 p-1.5 rounded">
                        <div className="text-gray-500 text-[0.7rem]">Variants</div>
                        <div className="font-medium">{exam.variant_count}</div>
                    </div>
                    <div className="bg-gray-50 p-1.5 rounded">
                        <div className="text-gray-500 text-[0.7rem]">Created</div>
                        <div className="font-medium">{formatDate(exam.created_at)}</div>
                    </div>
                </div>
                </div>
            </div>

            {/* Right (color + menu) section - 30% width */}
            <div
                className="w-[30%] relative flex flex-col items-center justify-between py-3"
                style={{ backgroundColor: cardColor }}
            >
                <button
                    ref={trashRef}
                    onMouseEnter={() => setIsHoveringTrash(true)}
                    onMouseLeave={() => setIsHoveringTrash(false)}
                    onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-all duration-200 flex items-center overflow-hidden"
                    aria-label="Delete exam"
                    style={{ width: isHoveringTrash ? 'auto' : '32px' }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                    {isHoveringTrash && (
                        <span className="text-white text-xs ml-1 pr-1 whitespace-nowrap">Delete</span>
                    )}
                </button>
            </div>
        </div>
    );
};

interface ExamDashboardCardProps {
    classroomId: number;
}

const ExamDashboardCard: React.FC<ExamDashboardCardProps> = ({ classroomId }) => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [darkMode] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const fetchExams = async () => {
        try {
            const examsData = await ExamService.getExamsByClassroom(classroomId);
            setExams(examsData);
        } catch (error) {
            toast.error('Failed to fetch exams', {
                position: "bottom-center",
                style: {
                    backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                    color: darkMode ? "#ffffff" : "#1e293b",
                    border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                }
            });
            console.error('Failed to fetch exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshExams = () => {
        setLoading(true);
        fetchExams();
    };

    useEffect(() => {
        fetchExams();
    }, [classroomId]);

    if (loading) {
        return <div className="flex justify-center items-center h-40">Loading exams...</div>;
    }

    if (exams.length === 0) {
        return <div className="flex justify-center items-center h-40">No exams found for this classroom</div>;
    }

    return (
        <div className="p-4">
            
            <div
                ref={scrollContainerRef}
                className="flex pb-4 -mx-3 overflow-x-auto scrollbar-hide"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e0 #f1f5f9',
                }}
            >
                <style jsx>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        height: 8px;
                    }
                    .scrollbar-hide::-webkit-scrollbar-track {
                        background: #f1f5f9;
                        border-radius: 4px;
                    }
                    .scrollbar-hide::-webkit-scrollbar-thumb {
                        background-color: #cbd5e0;
                        border-radius: 4px;
                    }
                `}</style>
                {exams.map((exam, idx) => (
                    <div key={exam.exam_id} className="flex-shrink-0 px-3" data-onboarding={`exam-card-${idx}`}>
                        <ExamCard
                            classroomId={classroomId}
                            exam={exam}
                            darkMode={darkMode}
                            refreshExams={refreshExams} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExamDashboardCard;