"use client"

import React, { useState, useEffect } from 'react'
import StudentAnalyzeModal from './StudentAnalyzeModal'
import StudentAnalyzeAvgModal from './StudentAnalyzeAvgModal'

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

interface StudentExamData {
    studentId: number;
    fullName: string;
    grades: {
        [examTitle: string]: {
            grade: string;
            versionNumber: number;
            variantId: number;
        };
    };
    avgScore: number;
}

interface StudentGradeTableProps {
    classroomId: number;
    students: Student[];
    exams: Exam[];
    studentExamData: StudentExamData[];
    loading: boolean;
    error: string | null;
}

const StudentGradeTable: React.FC<StudentGradeTableProps> = ({
    classroomId,
    students,
    exams,
    studentExamData,
    loading,
    error
}) => {
    const [selectedAnalysis, setSelectedAnalysis] = useState<{
        studentId: number;
        fullName: string;
        classId: number;
        examId: number;
        versionNumber: number;
        variantId: number;
    } | null>(null);

    const [selectedAvgAnalysis, setSelectedAvgAnalysis] = useState<{
        studentId: number;
        fullName: string;
        classId: number;
    } | null>(null);

    const [selectedDistribution, setSelectedDistribution] = useState<{
        studentId: number;
        fullName: string;
        distribution: Record<string, string>;
        distributionName: string;
        average: number;
    } | null>(null);

    const [distributions, setDistributions] = useState<{
        headers: string[];
        distributions: Record<string, string>[];
    } | null>(null);

    // Load distributions from localStorage on component mount
    useEffect(() => {
        const savedDistributions = localStorage.getItem(`Distributions-${classroomId}`);
        if (savedDistributions) {
            setDistributions(JSON.parse(savedDistributions));
        }
    }, [classroomId]);

    const handleGradeClick = (studentId: number, fullName: string, examId: number, versionNumber: number, variantId: number) => {
        setSelectedAnalysis({
            studentId,
            fullName,
            classId: classroomId,
            examId,
            versionNumber,
            variantId
        });
    };

    const handleAvgClick = (studentId: number, fullName: string) => {
        setSelectedAvgAnalysis({
            studentId,
            fullName,
            classId: classroomId
        });
    };

    const handleDistributionClick = (student: StudentExamData, distributionName: string, average: number) => {
        const defaultDistribution = exams.reduce((acc, _, index) => {
            acc[`exam-${index + 1}`] = '100';
            return acc;
        }, {} as Record<string, string>);

        const allDistributions = distributions?.distributions || [
            { Distribution: 'Default', ...defaultDistribution }
        ];

        const selectedDist = allDistributions.find(d =>
            (d.Distribution || 'Custom') === distributionName
        ) || { Distribution: 'Default', ...defaultDistribution };

        setSelectedDistribution({
            studentId: student.studentId,
            fullName: student.fullName,
            distribution: selectedDist,
            distributionName,
            average
        });
    };

    const parseGradeValue = (grade: string | number | null): number | null => {
        if (grade === null || grade === undefined) return null;
        
        if (typeof grade === 'number') {
            return grade;
        }
        
        if (typeof grade === 'string') {
            // Remove % if present and parse
            const cleanedGrade = grade.replace('%', '').trim();
            const parsed = parseFloat(cleanedGrade);
            return isNaN(parsed) ? null : parsed;
        }
        
        return null;
    };

    const formatGradeDisplay = (grade: string | number | null): string => {
        if (grade === null || grade === undefined) return 'N/A';
        
        const parsed = parseGradeValue(grade);
        return parsed !== null ? `${parsed}%` : 'N/A';
    };

    const calculateBestAverage = (student: StudentExamData) => {
        const defaultDistribution = exams.reduce((acc, _, index) => {
            acc[`exam-${index + 1}`] = '100';
            return acc;
        }, {} as Record<string, string>);

        const allDistributions = distributions?.distributions || [
            { Distribution: 'Default', ...defaultDistribution }
        ];

        let bestAverage = 0;
        let bestDistributionName = 'Default';
        let bestDistribution = defaultDistribution;

        allDistributions.forEach(dist => {
            let totalWeightedScore = 0;
            let totalWeight = 0;
            let hasGrades = false;

            exams.forEach((exam, examIndex) => {
                const gradeInfo = student.grades[exam.title];
                const weightKey = `exam-${examIndex + 1}`;
                const weight = Number(dist[weightKey]) || 0;

                if (gradeInfo && gradeInfo.grade !== null && gradeInfo.grade !== undefined) {
                    const parsedGrade = parseGradeValue(gradeInfo.grade);
                    
                    if (parsedGrade !== null) {
                        totalWeightedScore += parsedGrade * (weight / 100);
                        totalWeight += weight;
                        hasGrades = true;
                    }
                }
            });

            if (hasGrades && totalWeight > 0) {
                const average = (totalWeightedScore / totalWeight) * 100;
                if (average > bestAverage) {
                    bestAverage = average;
                    bestDistributionName = dist.Distribution || 'Custom';
                    bestDistribution = dist;
                }
            }
        });

        return {
            average: bestAverage,
            distributionName: bestDistributionName,
            distribution: bestDistribution
        };
    };

    if (loading) return <div className="p-6">Loading classroom data...</div>;
    if (error) return <div className="p-6">Error: {error}</div>;

    return (
        <div className="flex-1 overflow-auto px-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Full Name
                                </th>
                                {exams.map((exam, index) => (
                                    <th
                                        key={exam.exam_id}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {exam.title}
                                    </th>
                                ))}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avg Score
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Distribution
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {studentExamData.map(student => {
                                const { average, distributionName, distribution } = calculateBestAverage(student);
                                return (
                                    <tr key={student.studentId}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.studentId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.fullName}
                                        </td>
                                        {exams.map((exam, examIndex) => {
                                            const gradeInfo = student.grades[exam.title];
                                            const displayGrade = gradeInfo ? formatGradeDisplay(gradeInfo.grade) : 'N/A';
                                            const hasGrade = gradeInfo && gradeInfo.grade !== null && gradeInfo.grade !== undefined;
                                            
                                            return (
                                                <td
                                                    key={`${student.studentId}-${exam.exam_id}`}
                                                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                                                        hasGrade 
                                                            ? 'text-blue-600 cursor-pointer hover:underline' 
                                                            : 'text-gray-500'
                                                    }`}
                                                    onClick={() => hasGrade && handleGradeClick(
                                                        student.studentId,
                                                        student.fullName,
                                                        exam.exam_id,
                                                        gradeInfo.versionNumber,
                                                        gradeInfo.variantId
                                                    )}
                                                >
                                                    {displayGrade}
                                                </td>
                                            );
                                        })}
                                        <td
                                            className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                                            onClick={() => handleAvgClick(student.studentId, student.fullName)}
                                            data-onboarding={student.studentId === studentExamData[0]?.studentId ? "student-avg-0" : undefined}
                                        >
                                            {average.toFixed(1)}%
                                        </td>
                                        <td
                                            className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 cursor-pointer hover:underline"
                                            onClick={() => handleDistributionClick(student, distributionName, average)}
                                        >
                                            {distributionName}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rest of your modal components remain the same */}
            {selectedAnalysis && (
                <StudentAnalyzeModal
                    studentId={selectedAnalysis.studentId}
                    studentName={selectedAnalysis.fullName}
                    classId={selectedAnalysis.classId}
                    examId={selectedAnalysis.examId}
                    versionNumber={selectedAnalysis.versionNumber}
                    variantId={selectedAnalysis.variantId}
                    open={!!selectedAnalysis}
                    onClose={() => setSelectedAnalysis(null)}
                />
            )}

            {selectedAvgAnalysis && (
                <StudentAnalyzeAvgModal
                    studentId={selectedAvgAnalysis.studentId}
                    studentName={selectedAvgAnalysis.fullName}
                    classId={selectedAvgAnalysis.classId}
                    exams={exams}
                    studentExamData={studentExamData.find(s => s.studentId === selectedAvgAnalysis?.studentId)!}
                    open={!!selectedAvgAnalysis}
                    onClose={() => setSelectedAvgAnalysis(null)}
                />
            )}

            {selectedDistribution && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 transform transition-all duration-300 scale-95">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className={`relative inline-block text-2xl font-medium group`}>
                                    <span className={`
                                        ${'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600'}
                                        group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-700
                                        transition-all duration-500`}>
                                        Distribution Details for {selectedDistribution.fullName}
                                    </span>
                                </h2>
                                <button
                                    onClick={() => setSelectedDistribution(null)}
                                    className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                                    aria-label="Close"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium text-gray-700">Distribution Name:</span>
                                        <span className="font-semibold">{selectedDistribution.distributionName}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium text-gray-700">Calculated Average:</span>
                                        <span className="font-semibold text-blue-600">{selectedDistribution.average.toFixed(1)}%</span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Exam Weights</h3>
                                    <div className="space-y-3">
                                        {exams.map((exam, index) => {
                                            const weightKey = `exam-${index + 1}`;
                                            const weight = selectedDistribution.distribution[weightKey] || '0';
                                            const gradeInfo = studentExamData.find(s => s.studentId === selectedDistribution.studentId)?.grades[exam.title];
                                            const displayGrade = gradeInfo ? formatGradeDisplay(gradeInfo.grade) : 'N/A';

                                            return (
                                                <div key={exam.exam_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-800 truncate">{exam.title}</h4>
                                                        {gradeInfo && (
                                                            <p className="text-sm text-gray-500">Grade: {displayGrade}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${parseInt(weight) > 0
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {weight}%
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => setSelectedDistribution(null)}
                                        className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentGradeTable;