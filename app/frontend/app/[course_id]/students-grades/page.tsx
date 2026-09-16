"use client";

import React, { useEffect, useState } from "react";
import { getStudentsByClassroomID } from "@/services/student";
import { ExamService } from "@/services/exam";
import { getGrades } from "@/services/grades";
import StudentGradeTable from "../../components/StudentGradeTable";
import CourseListHeader from "@/app/components/CourseListHeader";
import CourseListSidebar from "@/app/components/CourseListSidebar";
//import router from 'next/router';
import { notFound, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Loading from '@/app/loading'
import { useTransition } from 'react'
import { toast, Toaster } from 'react-hot-toast';
import { useOnboarding } from "@/context/OnboardingContext";
import OnboardingStep from "@/components/OnboardingStep";
import { getOnboardingSteps, OnboardingPages } from "@/config/onboardingSteps";
import { updateUser } from '@/services/profile';

// Define types for API responses
interface StudentResponse {
    status: number;
    data: Student[] | { data?: Student[]; students?: Student[] };
}

interface GradesResponse {
    status: number;
    data: Grade[] | { data?: Grade[]; grades?: Grade[] };
}

interface Grade {
    "Student ID": number;
    "Exam Grade": string;
    "Exam Version": number;
    "Variant ID": number;
    [key: string]: any;
}

interface StudentExamData {
    studentId: number;
    fullName: string;
    grades: {
        [examTitle: string]: {
            grade: string;
            versionNumber: number; // Changed from variantId to versionNumber
            variantId: number; // Added variantId
        };
    };
    avgScore: number;
}

export interface Student {
    student_id: number;
    first_name: string;
    last_name: string;
}

export interface Exam {
    exam_id: number;
    title: string;
    is_graded: boolean;
}

// Onboarding wrapper component
const GradeAnalyticsPageWithOnboarding: React.FC = () => {
  const { state, completeStep, skipTour } = useOnboarding();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const steps = getOnboardingSteps(OnboardingPages.gradeAnalytics);
  const currentStep = steps[state.currentStep];

  // Unified finder for the current onboarding step's target
  useEffect(() => {
    if (!state.isActive || currentStep == null) {
      setTargetElement(null);
      return;
    }

    const { id: stepId, targetSelector: selector } = currentStep;

        // ——— SKIP “edit-student-0” if no question bank cards present ———
        if (stepId === 'student-avg-0') {
            const row = document.querySelector(selector);
            if (row === null) {
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
  }, [state.isActive, state.currentStep]);

  const handleNext = () => {
    if (currentStep) {
      completeStep(currentStep.id);
    }
    if (currentStep && currentStep.id === steps[steps.length - 1].id) {
      updateDBwithCompletedOnboarding();
    }
  };

  const updateDBwithCompletedOnboarding = () => {
    const payload = {
      comp_tutorial_page: 'gradeAnalytics'
    }
    updateUser({ payload });
  }

  const handleSkip = () => {
    skipTour();
    updateDBwithCompletedOnboarding();
  };

  return (
    <>
      <GradeAnalyticsPage />
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
export default function GradeAnalyticsPageWrapper() {
  return <GradeAnalyticsPageWithOnboarding />;
}

function GradeAnalyticsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [studentExamData, setStudentExamData] = useState<StudentExamData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [filteredStudents, setFilteredStudents] = useState<any>([]);
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter()
    const { startOnboarding } = useOnboarding();

    const classroomId = Number(window.location.pathname.split("/")[1]);

    // Check if grade analytics tutorial is completed
    useEffect(() => {
      if (!user) return;
      
      // Helper function to safely check if tutorial page is completed
      const isTutorialCompleted = (pageName: string) => {
        return Array.isArray(user?.comp_tutorial_pages) && user.comp_tutorial_pages.includes(pageName);
      };
      
      // Only start tutorial if not completed
      if (!isTutorialCompleted('gradeAnalytics')) {
        startOnboarding('gradeAnalytics');
      }
    }, [user, startOnboarding]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch students
                const studentsRes = (await getStudentsByClassroomID(
                    classroomId
                )) as StudentResponse;
                let studentsData: Student[] = [];

                if (Array.isArray(studentsRes.data)) {
                    studentsData = studentsRes.data;
                } else if (
                    studentsRes.data?.data &&
                    Array.isArray(studentsRes.data.data)
                ) {
                    studentsData = studentsRes.data.data;
                } else if (
                    studentsRes.data?.students &&
                    Array.isArray(studentsRes.data.students)
                ) {
                    studentsData = studentsRes.data.students;
                }

                setStudents(studentsData);

                // Fetch graded exams
                const examsRes = (await ExamService.getExamsByClassroom(
                    classroomId
                )) as Exam[];
                const gradedExams = examsRes.filter((exam) => exam.is_graded);
                setExams(gradedExams);

                // Process all grades and create combined data
                const combinedData: StudentExamData[] = studentsData.map((student) => ({
                    studentId: student.student_id,
                    fullName: `${student.first_name} ${student.last_name}`,
                    grades: {},
                    avgScore: 0,
                }));

                // Fetch grades for each exam and populate combined data
                await Promise.all(
                    gradedExams.map(async (exam) => {
                        const gradesRes = (await getGrades(
                            classroomId,
                            exam.exam_id
                        )) as GradesResponse;
                        let gradesData: Grade[] = [];

                        if (Array.isArray(gradesRes.data)) {
                            gradesData = gradesRes.data;
                        } else if (
                            gradesRes.data?.data &&
                            Array.isArray(gradesRes.data.data)
                        ) {
                            gradesData = gradesRes.data.data;
                        } else if (
                            gradesRes.data?.grades &&
                            Array.isArray(gradesRes.data.grades)
                        ) {
                            gradesData = gradesRes.data.grades;
                        }

                        // Process grades
                        gradesData.forEach((grade) => {
                            const studentIndex = combinedData.findIndex(
                                (s) => s.studentId === grade["Student ID"]
                            );
                            if (studentIndex !== -1) {
                                combinedData[studentIndex].grades[exam.title] = {
                                    grade: grade["Exam Grade"],
                                    versionNumber: grade["Exam Version"], // Version number
                                    variantId: grade["Variant ID"] || 0, // Variant ID (default to 0 if not available)
                                };
                            }
                        });
                    })
                );

                // Calculate average scores
                combinedData.forEach((student) => {
                    const grades = Object.values(student.grades);
                    if (grades.length > 0) {
                        const sum = grades.reduce(
                            (total, g) => total + parseFloat(g.grade || "0"),
                            0
                        );
                        student.avgScore = sum / grades.length;
                    }
                });

                setStudentExamData(combinedData);
                setIsLoading(false);

                console.log("Combined Classroom Data:", {
                    classroomId,
                    students: studentsData,
                    exams: gradedExams,
                    studentExamData: combinedData,
                });
            } catch (err) {
                setError("Failed to fetch classroom data");
                setIsLoading(false);
                console.error(err);
            }
        };

        fetchData();
    }, [classroomId]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase();
        if (!value) {
            setFilteredStudents(students);
        } else {
            const tempStudents = students!.filter((student: any) =>
                student["First Name"].toLowerCase().includes(value)
            );
            setFilteredStudents(tempStudents);
        }
    };

    if (isLoading || isPending || !students || !user) return <Loading />;

    return (
        <div className="flex h-screen bg-[#EDEDED]">
            <Toaster
                position="bottom-center"
                toastOptions={{
                    duration: 2000,
                    style: {
                        background: "#3b55b4ff",
                        color: "#fff",
                    },
                }}
            />


            <CourseListSidebar
                darkMode={false}
                archived={user.role === "Admin"}
                onToggleDarkMode={() => { }}
                tutorialPage="gradeAnalytics"
                middleButtons={[
                    {
                        label: "Active Courses",
                        alt: "Live Courses",
                        iconSrc: "/cap.svg",
                        onClick: () => router.push("/"),
                    },
                    {
                        label: "Exam Dashboard",
                        alt: "Dashboard",
                        iconSrc: "/home.svg",
                        onClick: () =>
                            router.push(
                                window.location.pathname.replace("/students-grades", "")
                            ),
                    },
                    {
                        label: "Question Banks",
                        alt: "Question Banks",
                        iconSrc: "/question-bank.svg",
                        onClick: () =>
                            router.push(
                                window.location.pathname.replace(
                                    "/students-grades",
                                    "/questions"
                                )
                            ),
                    },
                    {
                        label: "Students Roster",
                        alt: "Students Roster",
                        iconSrc: "/students.svg",
                        onClick: () =>
                            router.push(
                                window.location.pathname.replace(
                                    "/students-grades",
                                    "/students"
                                )
                            ),
                    },
                    {
                        label: "Grades Analytics",
                        alt: "Grades Analytics",
                        iconSrc: "/student-grade.svg",
                        onClick: () => window.location.reload(),
                    },
                    {
                        label: "Course Analytics",
                        alt: "Course Analytics",
                        iconSrc: "/line-chart-line.svg",
                        onClick: () =>
                            router.push(
                                window.location.pathname.replace(
                                    "/students-grades",
                                    "/courseanalytics"
                                )
                            ),
                    },
                ]}
            />
            <div className="flex flex-col flex-1 p-6 overflow-hidden">
                <CourseListHeader
                    searchPlaceholder="Search Students..."
                    search={handleSearch}
                />

                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-4 px-2">

                        <h1 className={`relative inline-block text-3xl font-medium group ''`}>
                            {/* Gradient text (light orange) - only visible in light mode */}
                            <span className={`
    ${'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600'}
    group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-700
    transition-all duration-500 `}>
                                {"Students Grade"}
                            </span>
                        </h1>

                        <button
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.csv';
                                input.onchange = (e: Event) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            try {
                                                const csvData = event.target?.result as string;
                                                // Parse CSV
                                                const rows = csvData.split('\n').filter(row => row.trim() !== '');
                                                if (rows.length < 2) {
                                                    toast.error('CSV must have at least one distribution row');
                                                    return;
                                                }

                                                const headers = rows[0].split(',').map(h => h.trim());
                                                if (!headers.includes('Distribution')) {
                                                    toast.error('CSV must have "Distribution" as first column');
                                                    return;
                                                }

                                                const distributions = rows.slice(1).map(row => {
                                                    const values = row.split(',');
                                                    const distribution: Record<string, string> = {};
                                                    headers.forEach((header, index) => {
                                                        distribution[header] = values[index]?.trim() || '0';
                                                    });
                                                    return distribution;
                                                });

                                                // Check and remove existing distributions
                                                const existingKey = `Distributions-${classroomId}`;
                                                if (localStorage.getItem(existingKey)) {
                                                    localStorage.removeItem(existingKey);
                                                }

                                                // Save new distributions
                                                localStorage.setItem(existingKey, JSON.stringify({
                                                    headers,
                                                    distributions
                                                }));

                                                toast.success('Distributions uploaded successfully!');
                                                window.location.reload(); // Refresh to show new distributions
                                            } catch (error) {
                                                console.error('Error processing CSV:', error);
                                                toast.error('Error processing CSV file');
                                            }
                                        };
                                        reader.onerror = () => {
                                            toast.error('Error reading file');
                                        };
                                        reader.readAsText(file);
                                    }
                                };
                                input.click();
                            }}
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
    px-4 py-2  // Increased padding 
    min-w-[140px] // Ensures consistent width`}
    data-onboarding="upload-weights"
                        >
                            Upload Weights
                        </button>
                    </div>
                    <>
                        {console.log('lol', studentExamData)}
                    </>
                    <StudentGradeTable
                        classroomId={classroomId}
                        students={students}
                        exams={exams}
                        studentExamData={studentExamData}
                        loading={isLoading}
                        error={error}
                    />
                </div>
            </div>
        </div>
    );
}
