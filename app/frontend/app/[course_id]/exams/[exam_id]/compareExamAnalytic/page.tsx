'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CourseListSidebar from '@/app/components/CourseListSidebar';
import AnalyticHeader from '@/app/components/AnalyticHeader';
import VariantComparisonChart from '@/app/components/VariantComparisonChart';
import QuestionComparisonChart from '@/app/components/QuestionComparisonChart';
import { useAuth } from '@/context/AuthContext';
import Loading from '@/app/loading';
import { getAllGradesByExam, GradesByVariant } from '@/services/grades';

export default function ExamComparisonPage() {
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const [gradesData, setGradesData] = useState<GradesByVariant>({});
  const [loadingGrades, setLoadingGrades] = useState(true);

  // Get classroomId and examId from URL
  const pathParts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
  const classroomId = pathParts[1];
  const examId = pathParts[3];

  useEffect(() => {
    if (!user || !classroomId || !examId) return;

    const fetchGrades = async () => {
      try {
        const { grouped } = await getAllGradesByExam(Number(classroomId), Number(examId));
        setGradesData(grouped);
      } catch (error) {
        console.error('Error fetching grade data:', error);
      } finally {
        setLoadingGrades(false);
      }
    };

    fetchGrades();
  }, [user, classroomId, examId]);

  if (!user || loadingGrades) {
    return <Loading />;
  }

  // Prepare data for VariantComparisonChart
  const variantChartData = Object.entries(gradesData).map(([variantId, variant]) => {
    return {
      variant: `Variant ${variantId}`,
      grade: variant.statistics.meanRawScore || 0,
      median: variant.statistics.medianRawScore || 0,
      q1: variant.statistics.lowerQuartileRawScore || 0,
      q3: variant.statistics.upperQuartileRawScore || 0,
    };
  });

  // Prepare data for QuestionComparisonChart
  const questionChartData = Object.entries(gradesData).flatMap(([variantId, variant]) =>
    variant.grades.map((g) => ({
      variant: `Variant ${variantId}`,
      question_id: g.question_id,
      correct: g.raw_score ?? 0,
      total: g.grade_points ?? 1
    }))
  );

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
      {/* Sticky Sidebar */}
      <div className="sticky top-0 h-screen z-10">
        <CourseListSidebar
          darkMode={darkMode}
          archived={user.role === 'Admin'}
          onToggleDarkMode={() => setDarkMode((prev) => !prev)}
          middleButtons={[
            {
              label: 'Live Courses',
              alt: 'Live Courses',
              iconSrc: '/cap.svg',
              onClick: () => router.push('/')
            },
            {
              label: 'Dashboard',
              alt: 'Dashboard',
              iconSrc: '/home.svg',
              onClick: () => {
                const examId = window.location.pathname.split('/')[3];
                router.push(window.location.pathname.replace(`/exams/${examId}/examanalytics`, ''));
              }
            },
            {
              label: 'View Variants',
              alt: 'View Variants',
              iconSrc: '/variants.svg',
              onClick: () => {
                router.push(window.location.pathname.replace(`/examanalytics`, '/exam-variant'));
              }
            },
            {
              label: 'Upload Grade',
              alt: 'Upload Grade',
              iconSrc: '/mark.svg',
              onClick: () => {
                router.push(window.location.pathname.replace(`/examanalytics`, '/upload-grades'));
              }
            },
            {
              label: 'Exam Analytics',
              alt: 'Exam Analytics',
              iconSrc: '/line-chart-line.svg',
              onClick: () => window.location.reload()
            }
          ]}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col p-6">
          <AnalyticHeader title="Exam Comparison" />

          <div className="grid grid-cols-1 gap-8 mt-8">
            {/* Variant Comparison Chart */}
            <div className={`p-6 rounded-lg shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <VariantComparisonChart data={variantChartData} />
            </div>

            {/* Question Comparison Chart */}
            <div className={`p-6 rounded-lg shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <QuestionComparisonChart data={questionChartData} selectedQuestionId={1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}