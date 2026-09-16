'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import CourseListSidebar from "@/app/components/CourseListSidebar";
import CourseExamOverview from "@/app/components/CourseExamOverview";
import StudentVariantCount from "@/app/components/StudentVariantCount";
import PerformanceHistogram from "@/app/components/PerformanceHistogram";
import AnalyticHeader from "@/app/components/AnalyticHeader";
import QuickAction from "@/app/components/QuickAction";
import { useAuth } from "../../../../../context/AuthContext";
import Loading from "@/app/loading";
import { getAllGradesByExam } from "@/services/grades";
import LineCurveGraph, { PerformanceRecord } from "@/app/components/LineCurveGraph";
import { APIGrade, GradesByVariant } from "@/services/grades";

interface VariantAverage {
  variant: string;
  average: number;
}

export default function ExamPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [variantCount, setVariantCount] = useState<number>(0);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [variantAverages, setVariantAverages] = useState<VariantAverage[]>([]);
  const [rawScores, setRawScores] = useState<number[]>([]);
  const [lineGraphData, setLineGraphData] = useState<PerformanceRecord[]>([]);
  const [variants, setVariants] = useState<{ id: string, grade: number }[]>([]);
  const [examNameMap, setExamNameMap] = useState('');

  const router = useRouter();
  const { user } = useAuth();

  // Get classroomId and examId from URL
  const pathParts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
  const classroomId = pathParts[1];
  const examId = pathParts[3];

  useEffect(() => {
    const storedExamData = localStorage.getItem("examData");
    if (storedExamData) {
      try {
        const parsed = JSON.parse(storedExamData);
        setExamNameMap(parsed.examTitle || "Untitled Exam");
      } catch (e) {
        console.error("Failed to parse examData from localStorage:", e);
      }
    }

    if (!user || !classroomId || !examId) return;

    const fetchAndProcessGrades = async () => {
      try {
        // 1. First, verify we're getting data from the API
        const response = await getAllGradesByExam(Number(classroomId), Number(examId));
        console.log('Full API response:', response);

        if (!response || !response.grouped) {
          console.error('No grouped data in response');
          return;
        }

        const { grouped } = response;
        console.log('Grouped data structure:', grouped);

        // 2. Verify we have variants
        const variantEntries = Object.entries(grouped);
        if (variantEntries.length === 0) {
          console.warn('No variants found in grouped data');
          setVariantCount(0);
          setStudentCount(0);
          return;
        }

        console.log('Variant entries:', variantEntries);

        // 3. Prepare data structures
        const variantList = [];
        const averages = [];
        const allAdjustedScores = [];
        const graphData = [];
        const uniqueStudentIds = new Set();

        // 4. Process each variant
        for (const [variantId, variantData] of variantEntries) {
          console.log(`Processing variant ${variantId}`, variantData);

          if (!variantData.grades || !Array.isArray(variantData.grades)) {
            console.warn(`Variant ${variantId} has no grades array`);
            continue;
          }

          // Calculate variant average
          const total = variantData.grades.reduce((sum: any, item: any) => sum + item.exam_grade, 0);

          // Divide by the number of entries
          const variantAvg = parseFloat((total / variantData.grades.length).toFixed(2));

          variantList.push({ id: variantId, grade: variantAvg });
          averages.push({ variant: `Variant ${variantId}`, average: variantAvg || 0 });

          // Process each grade in the variant
          let variantStudentCount = 0;
          for (const grade of variantData.grades) {
            console.log('Processing grade record:', grade);

            // Calculate percentage score
            const percentage = grade.exam_grade;

            allAdjustedScores.push(percentage);
            graphData.push({ variant: `Variant ${variantId}`, grade: percentage });

            // Track unique students
            if (grade.student?.student_id) {
              const studentId = grade.student.student_id.toString();
              if (!uniqueStudentIds.has(studentId)) {
                variantStudentCount++;
                uniqueStudentIds.add(studentId);
                console.log(`New student found: ${studentId}`);
              }
            } else {
              console.warn('Grade record missing student information:', grade);
            }
          }

          console.log(`Variant ${variantId} has ${variantStudentCount} unique students`);
        }

        // 5. Final debug output
        console.log('Total unique students:', uniqueStudentIds.size);
        console.log('All student IDs:', Array.from(uniqueStudentIds));

        // 6. Update state
        setVariants(variantList);
        setVariantAverages(averages);
        setRawScores(allAdjustedScores);
        setLineGraphData(graphData);
        setStudentCount(uniqueStudentIds.size);
        setVariantCount(variantEntries.length);

      } catch (error) {
        console.error("Error loading grades:", error);
        setStudentCount(0);
        setVariantCount(0);
      }
    };

    fetchAndProcessGrades();
  }, [user, classroomId, examId]);

  // Calculate statistics for variants
  const sortedGrades = [...rawScores].sort((a, b) => a - b);
  const count = sortedGrades.length;

  const calcQuartile = (q: number) => {
    const pos = (count - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return sortedGrades[base + 1] !== undefined
      ? sortedGrades[base] + rest * (sortedGrades[base + 1] - sortedGrades[base])
      : sortedGrades[base];
  };

  const variantStats = {
    mean: count > 0 ? sortedGrades.reduce((s, v) => s + v, 0) / count : 0,
    median: calcQuartile(0.5),
    min: sortedGrades[0] ?? 0,
    max: sortedGrades[count - 1] ?? 0,
    lowerQuartile: calcQuartile(0.25),
    upperQuartile: calcQuartile(0.75),
    totalStudents: studentCount,
    totalVariants: variantCount
  };

  if (!user) {
    return <Loading />;
  }

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>

      <div className="fixed top-0 h-screen z-10">
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
              onClick: () => {
                const examId = window.location.pathname.split('/')[3];
                router.push(window.location.pathname.replace(`/exams/${examId}/examanalytics`, ""))
              },
            },
            {
              label: 'View Variants',
              alt: 'View Variants',
              iconSrc: '/variants.svg',
              onClick: () => {
                router.push(window.location.pathname.replace(`/examanalytics`, "/exam-variant"))
              },
            },
            {
              label: 'Upload Grade',
              alt: 'Upload Grade',
              iconSrc: '/mark.svg',
              onClick: () => {
                router.push(window.location.pathname.replace(`/examanalytics`, "/upload-grades"))
              },
            },
            {
              label: 'Exam Analytics',
              alt: 'Exam Analytics',
              iconSrc: '/line-chart-line.svg',
              onClick: () => window.location.reload(),
            },
          ]}
        />
      </div>

      {/* Main Content - with left margin matching sidebar width */}
      <div className="flex-1 ml-[80px] lg:ml-[230px] overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AnalyticHeader title={`Exam Analytics ${examNameMap}`} />

          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <StudentVariantCount totalVariants={variantCount} studentCount={studentCount} title="Student Participation" />
            </div>
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <CourseExamOverview grades={rawScores} title="Exam Statistics Overview" />
            </div>
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <QuickAction
                data={variants}
                reportData={lineGraphData}
                statistics={variantStats}
                onSelectItem={(variant) => setSelectedVariant(variant || null)}
                labelPrefix="Variant "
                defaultLabel="All Variants"
                showCompareButton={false}
                labelMode="variant"
              />
            </div>
          </div>

          {/* Main Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <LineCurveGraph
                data={selectedVariant
                  ? lineGraphData.filter(d => d.variant === `Variant ${selectedVariant}`)
                  : lineGraphData}
                width="100%"
                height={400}
              />
            </div>
            <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <PerformanceHistogram
                data={variantAverages.map((va) => ({ id: va.variant, grade: va.average }))}
                title="Average Score by Variant (%)"
                barColor={darkMode ? "#fde047" : "#facc15"} // Slightly different yellow for dark mode
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