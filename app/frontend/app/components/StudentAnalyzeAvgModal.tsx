import React, { useEffect, useState, useCallback } from 'react';
import { ExamVariantQuestionService } from '@/services/exam_variant_question';
import { getGrades } from '@/services/grades';
import { getQuestionById } from '@/services/question';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StudentAnalyzeAvgModalProps {
    studentId: number;
    studentName: string;
    classId: number;
    exams: Exam[];
    studentExamData: StudentExamData;
    open: boolean;
    onClose: () => void;
}

interface Exam {
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

interface QuestionPerformance {
    questionText: string;
    questionId: number; 
    totalAppearances: number;
    correctAnswers: number;
    difficulty: string;
    examResults: {
        examTitle: string;
        isCorrect: boolean;
    }[];
}

const difficultyMap: Record<number, string> = {
    1: 'Easy',
    2: 'Medium',
    3: 'Hard'
};

export const StudentAnalyzeAvgModal: React.FC<StudentAnalyzeAvgModalProps> = ({
    studentId,
    studentName,
    classId,
    exams,
    studentExamData,
    open,
    onClose,
}) => {
    const [progressData, setProgressData] = useState<any[]>([]);
    const [questionPerformance, setQuestionPerformance] = useState<QuestionPerformance[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Prepare progress data for the line chart
            const progress = exams
                .filter(exam => studentExamData.grades[exam.title])
                .map(exam => ({
                    exam: exam.title,
                    score: parseFloat(studentExamData.grades[exam.title].grade),
                    date: exam.title.split('-')[0].trim()
                }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setProgressData(progress);

            // Analyze question performance across exams
            const questionMap: Record<string, QuestionPerformance> = {};

            // Fetch all exam variants and questions for this student
            await Promise.all(
                exams.map(async exam => {
                    if (!studentExamData.grades[exam.title]) return;

                    const variantId = studentExamData.grades[exam.title].variantId;
                    const gradesRes = await getGrades(classId, exam.exam_id);
                    const variantQuestionsRes = await ExamVariantQuestionService.getQuestionsByVariant(variantId);

                    const studentGrade = gradesRes.data.find(
                        (grade: any) => grade['Student ID'] === studentId
                    );

                    if (!studentGrade || !variantQuestionsRes.data) return;

                    const questions = variantQuestionsRes.data;

                    // Process each question in this exam
                    for (const question of questions) {
                        const studentAnswer = studentGrade[`Question ${question.question_number}`];
                        const isCorrect = question.correct_options.includes(studentAnswer);

                        // Get question details by ID instead of searching by text
                        let difficulty = 'Unknown';
                        if (question.question_id) {
                            const questionRes = await getQuestionById(question.question_id);
                            if (questionRes.data) {
                                difficulty = difficultyMap[questionRes.data.difficulty_level] || 'Unknown';
                            }
                        }

                        if (questionMap[question.question_id]) {
                            // Existing question - update stats
                            questionMap[question.question_id].totalAppearances += 1;
                            questionMap[question.question_id].correctAnswers += isCorrect ? 1 : 0;
                            questionMap[question.question_id].examResults.push({
                                examTitle: exam.title,
                                isCorrect
                            });
                        } else {
                            // New question - create entry
                            questionMap[question.question_id] = {
                                questionText: question.question_text,
                                questionId: question.question_id, // Add questionId to the interface
                                totalAppearances: 1,
                                correctAnswers: isCorrect ? 1 : 0,
                                difficulty,
                                examResults: [{
                                    examTitle: exam.title,
                                    isCorrect
                                }]
                            };
                        }
                    }

                })
            );

            // Convert question map to array and filter for questions that appeared in multiple exams
            const questionPerformanceArray = Object.values(questionMap)
                .filter(q => q.totalAppearances > 1)
                .sort((a, b) => b.totalAppearances - a.totalAppearances);

            setQuestionPerformance(questionPerformanceArray);

        } catch (err) {
            console.error('Error fetching average analysis data:', err);
            setError('Failed to load analysis data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [classId, exams, studentExamData, studentId]);

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            fetchData();
        }, 100);

        return () => clearTimeout(timer);
    }, [open, fetchData]);

    if (!open) return null;

    const renderProgressChart = () => {
        if (progressData.length === 0) return null;

        return (
            <div className="mt-5">
                <h4 className="text-lg">Progress Across Exams</h4>
                <div className="h-72 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="exam" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip
                                formatter={(value: any) => [`${value}%`, "Score"]}
                                labelFormatter={(label) => `Exam: ${label}`}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#3b82f6"
                                activeDot={{ r: 8 }}
                                name="Score (%)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    const renderQuestionPerformance = () => {
        if (questionPerformance.length === 0) {
            return (
                <div className="mt-8">
                    <h4 className="text-lg">Question Performance Across Exams</h4>
                    <div className="p-5 bg-gray-50 rounded-lg text-center text-gray-500 mt-3">
                        No questions appeared in multiple exams to analyze.
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-8">
                <h4 className="text-lg font-semibold">Question Performance Across Exams</h4>
                <p className="text-gray-500 mb-4">
                    Questions that appeared in multiple exams
                </p>

                <div className="space-y-4">
                    {questionPerformance.map((question, index) => (
                        <div
                            key={index}
                            className="p-4 border border-gray-200 rounded-lg"
                        >
                            <div className="flex justify-between items-center">
                                <div className="font-bold">Question {index + 1}</div>
                                <div className={`px-2 py-1 rounded text-xs ${question.difficulty === 'Easy' ? 'bg-green-100 text-green-800 border border-green-200' :
                                        question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                            'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                    {question.difficulty}
                                </div>
                            </div>
                            <div className="my-3 text-gray-700">{question.questionText}</div>

                            <div className="mt-3">
                                <div className="text-sm font-medium mb-2">
                                    Performance: {Math.round((question.correctAnswers / question.totalAppearances) * 100)}% correct
                                    ({question.correctAnswers}/{question.totalAppearances})
                                </div>

                                <div className="space-y-2">
                                    {question.examResults.map((result, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-2 rounded ${result.isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                                                }`}
                                        >
                                            <div className="flex justify-between">
                                                <span>{result.examTitle}</span>
                                                <span className={`font-medium ${result.isCorrect ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {result.isCorrect ? 'Correct' : 'Incorrect'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        }}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <div>
                            <h2 className="text-xl ">Average Performance Analysis</h2>
                            <p className="text-gray-500">
                                {studentName} (ID: {studentId}) • Average Score: {studentExamData.avgScore.toFixed(1)}%
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                    </div>

                    {loading && (
                        <div className="py-10 text-center">
                            <div>Loading student data...</div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="mt-4">
                            {renderProgressChart()}
                            {renderQuestionPerformance()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentAnalyzeAvgModal;