'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import OnboardingStep from "@/components/OnboardingStep";
import { getOnboardingSteps, OnboardingPages } from "@/config/onboardingSteps";

import CourseListSidebar from "@/app/components/CourseListSidebar";
import CourseExamOverview from "@/app/components/CourseExamOverview";
import StudentVariantCount from "@/app/components/StudentVariantCount";
import PerformanceHistogram from "@/app/components/PerformanceHistogram";
import AnalyticHeader from "@/app/components/AnalyticHeader";
import QuickAction from "@/app/components/QuickAction";
import Loading from "@/app/loading";
import { getAllGradesByExam, getAllExamsData } from "@/services/grades";
import { getStudentsByClassroomID } from "@/services/student";
import LineCurveGraph, { PerformanceRecord } from "@/app/components/LineCurveGraph";
import { updateUser } from '@/services/profile';

interface ExamAverage {
  examId: string;
  grade: number;
}

// Onboarding wrapper component
const CourseAnalyticsPageWithOnboarding: React.FC = () => {
  const { state, completeStep, skipTour } = useOnboarding();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const steps = getOnboardingSteps(OnboardingPages.courseAnalytics);
  const currentStep = steps[state.currentStep];

  // Unified finder for the current onboarding step's target
  useEffect(() => {
    if (!state.isActive || currentStep == null) {
      setTargetElement(null);
      return;
    }

    const selector = currentStep.targetSelector;

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
    if (currentStep && currentStep.id === steps[steps.length - 1].id) {
      updateDBwithCompletedOnboarding();
    }
  };

  const updateDBwithCompletedOnboarding = () => {
    const payload = {
      comp_tutorial_page: 'courseAnalytics'
    }
    updateUser({ payload });
  }

  const handleSkip = () => {
    skipTour();
    updateDBwithCompletedOnboarding();
  };

  return (
    <>
      <CourseAnalyticsPage />
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
export default function CourseAnalyticsPageWrapper() {
  return <CourseAnalyticsPageWithOnboarding />;
}

function CourseAnalyticsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [examCount, setExamCount] = useState<number>(0);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [examAverages, setExamAverages] = useState<ExamAverage[]>([]);
  const [allGrades, setAllGrades] = useState<number[]>([]);
  const [lineGraphData, setLineGraphData] = useState<PerformanceRecord[]>([]);


  const router = useRouter();
  const { user } = useAuth();
  const { startOnboarding } = useOnboarding();

  // Get classroomId from URL
  const pathParts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
  const classroomId = pathParts[1];


  useEffect(() => {

    if (!user || !classroomId) return;

    // Check if course analytics tutorial is completed
    if (user) {
      // Helper function to safely check if tutorial page is completed
      const isTutorialCompleted = (pageName: string) => {
        return Array.isArray(user?.comp_tutorial_pages) && user.comp_tutorial_pages.includes(pageName);
      };

      if (!isTutorialCompleted('courseAnalytics')) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key?.startsWith('onboarding_courseAnalytics_')) {
            localStorage.removeItem(key);
          }
        }
        // now kick off the onboarding tour
        startOnboarding('courseAnalytics');
      }
    }


    const fetchAndProcessExams = async () => {
      try {
        // Get data for all exams in this classroom
        const examsData = await getAllExamsData(Number(classroomId));

        // Debug: Log what we received
        console.log('Raw examsData:', examsData);
        console.log('Type of examsData:', typeof examsData);
        console.log('Is array:', Array.isArray(examsData));

        if (!examsData || !Array.isArray(examsData) || examsData.length === 0) {
          console.log('No exams found or invalid data format');
          // No exams found, set empty states
          setExamAverages([]);
          setLineGraphData([]);
          setAllGrades([]);
          setStudentCount(0);
          setExamCount(0);
          getStudentsByClassroomID(Number(classroomId));
          return;
        }

        // Process each exam to get its aggregated stats and collect all grades
        const allGrades: number[] = [];
        const averages: ExamAverage[] = [];
        const graphData: PerformanceRecord[] = [];
        let totalStudents = 0;

        for (const exam of examsData) {
          try {
            console.log('Processing exam:', exam);

            // Get grades for this exam once
            const { data: individualGrades } = await getAllGradesByExam(Number(classroomId), exam.exam_id);

            if (!individualGrades || individualGrades.length === 0) {
              console.warn(`No grades found for exam ${exam.exam_id}`);
              // Still add the exam to averages with 0 values
              averages.push({
                examId: `Exam ${exam.exam_id}`,
                grade: 0
              });
              graphData.push({
                variant: `Exam ${exam.exam_id}`,
                grade: 0
              });
              continue;
            }

            // Convert individual grades to percentages and collect them
            const examPercentages = individualGrades.map(grade => {
              return grade.exam_grade ?? 0;
            });

            // Add individual percentages to allGrades
            allGrades.push(...examPercentages);

            // Calculate mean from the percentages
            const meanGrade = examPercentages.length > 0
              ? examPercentages.reduce((sum, grade) => sum + grade, 0) / examPercentages.length
              : 0;

            // Prepare data for histogram and line graph
            averages.push({
              examId: `Exam ${exam.exam_id}`,
              grade: meanGrade
            });

            graphData.push({
              exam: `${exam.exam_id}`,
              variant: `Exam ${exam.exam_id}`,
              grade: meanGrade
            });

            // Count unique students across variants
            const uniqueStudentIds = new Set(individualGrades.map(g => g.student.student_id));
            totalStudents += uniqueStudentIds.size;

          } catch (examError) {
            console.error(`Error processing exam ${exam.exam_id}:`, examError);
            // Add exam with 0 values so it still appears
            averages.push({
              examId: `Exam ${exam.exam_id}`,
              grade: 0
            });
            graphData.push({
              variant: `Exam ${exam.exam_id}`,
              grade: 0
            });
          }
        }

        // Update all states
        setExamAverages(averages);
        setLineGraphData(graphData);
        setAllGrades(allGrades);
        setStudentCount(totalStudents);
        setExamCount(examsData.length);

      } catch (error) {
        console.error("Error loading exams data:", error);
        // Set empty states on error
        setExamAverages([]);
        setLineGraphData([]);
        setAllGrades([]);
        setStudentCount(0);
        setExamCount(0);
      }
    };

    fetchAndProcessExams();
  }, [user, classroomId]);

  const sortedGrades = [...allGrades].sort((a, b) => a - b);
  const count = sortedGrades.length;

  const calcQuartile = (q: number) => {
    const pos = (count - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return sortedGrades[base + 1] !== undefined
      ? sortedGrades[base] + rest * (sortedGrades[base + 1] - sortedGrades[base])
      : sortedGrades[base];
  };

  const courseStats = {
    mean: count > 0 ? sortedGrades.reduce((s, v) => s + v, 0) / count : 0,
    median: calcQuartile(0.5),
    min: sortedGrades[0] ?? 0,
    max: sortedGrades[count - 1] ?? 0,
    lowerQuartile: calcQuartile(0.25),
    upperQuartile: calcQuartile(0.75),
    totalStudents: studentCount,
    totalExams: examCount
  };

  const averageStudentsPerExam = examCount > 0 ? Math.round(studentCount / examCount) : 0;

  if (!user) {
    return <Loading />;
  }

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>

      {/* Fixed Sidebar */}
      <div className="fixed top-0 left-0 h-screen w-[80px] lg:w-[230px] z-10">
        <CourseListSidebar
          darkMode={darkMode}
          archived={user.role === 'Admin'}
          onToggleDarkMode={() => setDarkMode((prev) => !prev)}
          tutorialPage="courseAnalytics"
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
              onClick: () => router.push(window.location.pathname.replace('/courseanalytics', '')),
            },
            {
              label: 'Question Banks',
              alt: 'Question Banks',
              iconSrc: '/question-bank.svg',
              onClick: () => router.push(window.location.pathname.replace('/courseanalytics', '/questions')),
            },
            {
              label: 'Student Roster',
              alt: 'Student Roster',
              iconSrc: '/students.svg',
              onClick: () => router.push(window.location.pathname.replace('/courseanalytics', '/students')),
            },
            {
              label: 'Grades Analytics',
              alt: 'Grades Analytics',
              iconSrc: '/student-grade.svg',
              onClick: () => router.push(window.location.pathname.replace('/courseanalytics', '/students-grades')),
            },
            {
              label: 'Course Analytics',
              alt: 'Analytics',
              iconSrc: '/line-chart-line.svg',
              onClick: () => window.location.reload(),
            },
          ]}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-[80px] lg:ml-[230px] overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header with orange gradient for "Course" */}
          <AnalyticHeader title="Course Analytics" />

          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-onboarding="stats-overview">
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <StudentVariantCount
                totalVariants={examCount}
                studentCount={averageStudentsPerExam}
                title="Exam Participation"
                variantLabel="Exams"
              />
            </div>
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <CourseExamOverview
                grades={allGrades}
                title="Course Statistics Overview"
              />
            </div>
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <QuickAction
                data={examAverages.map(e => ({ id: e.examId.replace('Exam ', ''), grade: e.grade }))}
                reportData={lineGraphData}
                statistics={courseStats}
                onSelectItem={(examId) => setSelectedExam(examId || null)}
                labelPrefix="Exam "
                defaultLabel="All Exams"
                showCompareButton={false}
                labelMode="exam"
              />
            </div>
          </div>

          {/* Main Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`} data-onboarding="performance-line-chart">
              <LineCurveGraph
                data={selectedExam
                  ? lineGraphData.filter(d => d.variant === `Exam ${selectedExam}`)
                  : lineGraphData}
                width="100%"
                height={400}
                yAxisLabel="Number of Exams"
              />
            </div>
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`} data-onboarding="performance-histogram">
              <PerformanceHistogram
                data={examAverages.map((ea) => ({ id: ea.examId, grade: Number(ea.grade.toFixed(2)) }))}
                title="Average Score by Exam (%)"
                barColor={darkMode ? "#60a5fa" : "#3b82f6"} // Adjusted for dark mode
                width="100%"
                height={400}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}