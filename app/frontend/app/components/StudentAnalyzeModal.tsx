import React, { useEffect, useState, useCallback } from 'react';
import { ExamVariantQuestionService } from '@/services/exam_variant_question';
import { getGrades } from '@/services/grades';
import { getQuestionById } from '@/services/question';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StudentAnalyzeModalProps {
    studentId: number;
    studentName: string,
    classId: number;
    examId: number;
    versionNumber: number;
    variantId: number;
    open: boolean;
    onClose: () => void;
}

interface ExamData {
    versionNumber: number;
    studentAnswers: Record<string, string>;
    variantAnswers: Record<string, string[]>;
    questionTexts: Record<string, string>;
    questionDifficulties: Record<string, string>;
    studentName?: string;
}

interface AnalysisResult {
    correct: number;
    wrong: number;
    unanswered: number;
    difficultyStats: Record<string, {
        correct: number;
        wrong: number;
        unanswered: number;
        total: number;
    }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const difficultyMap: Record<number, string> = {
    1: 'Easy',
    2: 'Medium',
    3: 'Hard'
};

export const StudentAnalyzeModal: React.FC<StudentAnalyzeModalProps> = ({
    studentId,
    studentName,
    classId,
    examId,
    versionNumber,
    variantId,
    open,
    onClose,
}) => {
    const [examData, setExamData] = useState<ExamData | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyzeResults = useCallback((data: ExamData): AnalysisResult => {
        let correct = 0;
        let wrong = 0;
        let unanswered = 0;

        const difficultyStats: AnalysisResult['difficultyStats'] = {
            Easy: { correct: 0, wrong: 0, unanswered: 0, total: 0 },
            Medium: { correct: 0, wrong: 0, unanswered: 0, total: 0 },
            Hard: { correct: 0, wrong: 0, unanswered: 0, total: 0 }
        };

        Object.keys(data.questionTexts).forEach(questionNumber => {
            const studentAnswer = data.studentAnswers[questionNumber];
            const correctAnswers = data.variantAnswers[questionNumber] || [];
            const difficulty = data.questionDifficulties[questionNumber] || 'Easy';

            // Count total questions by difficulty
            difficultyStats[difficulty].total += 1;

            if (!studentAnswer) {
                unanswered += 1;
                difficultyStats[difficulty].unanswered += 1;
            } else if (correctAnswers.includes(studentAnswer)) {
                correct += 1;
                difficultyStats[difficulty].correct += 1;
            } else {
                wrong += 1;
                difficultyStats[difficulty].wrong += 1;
            }
        });

        return {
            correct,
            wrong,
            unanswered,
            difficultyStats
        };
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [gradesResponse, variantQuestionsResponse] = await Promise.all([
                getGrades(classId, examId),
                ExamVariantQuestionService.getQuestionsByVariant(variantId)
            ]);

            const studentGrade = gradesResponse.data.find(
                (grade: any) =>
                    grade['Student ID'] === studentId &&
                    grade['Exam Version'] === versionNumber
            );

            if (!studentGrade) {
                throw new Error('Student grade not found');
            }

            const studentAnswers: Record<string, string> = {};
            Object.keys(studentGrade).forEach(key => {
                if (key.startsWith('Question ')) {
                    const questionNumber = key.replace('Question ', '');
                    studentAnswers[questionNumber] = studentGrade[key];
                }
            });

            const questions = variantQuestionsResponse.data || [];
            if (!Array.isArray(questions)) {
                throw new Error('Invalid questions data format');
            }

            const variantAnswers: Record<string, string[]> = {};
            const questionTexts: Record<string, string> = {};
            const questionDifficulties: Record<string, string> = {};

            // Fetch difficulty for each question
            for (const question of questions) {
    variantAnswers[question.question_number] = question.correct_options;
    questionTexts[question.question_number] = question.question_text;

    // Log basic question info
    console.log('Processing question:', {
        question_number: question.question_number,
        question_text: question.question_text,
        correct_options: question.correct_options,
        question_id: question.question_id
    });

    // Get question details by ID instead of searching by text
    if (question.question_id) {
        const questionRes = await getQuestionById(question.question_id);
        console.log('Question details from API:', questionRes); // Log the full response

        if (questionRes) {
            questionDifficulties[question.question_number] =
                difficultyMap[questionRes.difficulty_level] || 'Unknown';
            
            // Log difficulty info
            console.log('Difficulty assigned:', {
                question_number: question.question_number,
                difficulty_level: questionRes.difficulty_level,
                mapped_difficulty: difficultyMap[questionRes.difficulty_level] || 'Unknown'
            });
        } else {
            questionDifficulties[question.question_number] = 'Unknown';
            console.log('No details found for question ID:', question.question_id);
        }
    } else {
        questionDifficulties[question.question_number] = 'Unknown';
        console.log('No question_id provided for question:', question.question_number);
    }
}

            const data: ExamData = {
                versionNumber,
                studentAnswers,
                variantAnswers,
                questionTexts,
                questionDifficulties,
                studentName: studentGrade['Student Name'] || `${studentName}`
            };

            setExamData(data);
            setAnalysis(analyzeResults(data));

        } catch (err) {
            console.error('Error fetching analysis data:', err);
            setError('Failed to load analysis data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [classId, examId, studentId, studentName, versionNumber, variantId, analyzeResults]);

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            fetchData();
        }, 100);

        return () => clearTimeout(timer);
    }, [open, fetchData]);

    if (!open) return null;

    const renderDifficultyPerformance = () => {
        if (!analysis) return null;

        const difficultyData = Object.entries(analysis.difficultyStats)
            .filter(([_, stats]) => stats.total > 0)
            .map(([difficulty, stats]) => ({
                difficulty,
                ...stats,
                percentage: Math.round((stats.correct / stats.total) * 100)
            }));

        return (
            <div style={{ marginTop: '30px' }}>
                <h4>Performance by Difficulty</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                    {difficultyData.map((item) => (
                        <div key={item.difficulty} style={{ flex: 1, minWidth: '150px' }}>
                            <h5>{item.difficulty} Questions</h5>
                            <div style={{
                                height: '10px',
                                backgroundColor: '#e0e0e0',
                                borderRadius: '5px',
                                marginBottom: '5px'
                            }}>
                                <div
                                    style={{
                                        width: `${item.percentage}%`,
                                        height: '100%',
                                        backgroundColor:
                                            item.difficulty === 'Easy' ? '#4CAF50' :
                                                item.difficulty === 'Medium' ? '#FFC107' :
                                                    '#F44336',
                                        borderRadius: '5px'
                                    }}
                                />
                            </div>
                            <div>
                                {item.correct}/{item.total} ({item.percentage}%)
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                                Wrong: {item.wrong} • Unanswered: {item.unanswered}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ height: '300px', marginTop: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={difficultyData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="difficulty" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="correct" name="Correct" fill="#4CAF50" />
                            <Bar dataKey="wrong" name="Wrong" fill="#F44336" />
                            <Bar dataKey="unanswered" name="Unanswered" fill="#9E9E9E" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    const renderAnswerSummary = () => {
        if (!analysis || !examData) return null;

        const totalQuestions = Object.keys(examData.questionTexts).length;
        const scorePercentage = Math.round((analysis.correct / totalQuestions) * 100);

        return (
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #eee',
                marginBottom: '20px'
            }}>
                <h4 style={{ marginTop: 0 }}>Answer Distribution</h4>
                <div style={{ height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Correct', value: analysis.correct },
                                    { name: 'Wrong', value: analysis.wrong },
                                    { name: 'Unanswered', value: analysis.unanswered }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                            >
                                <Cell fill="#4CAF50" />
                                <Cell fill="#F44336" />
                                <Cell fill="#9E9E9E" />
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <p>Total Questions: {totalQuestions}</p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        Score: {scorePercentage}% ({analysis.correct}/{totalQuestions})
                    </p>
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
            <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '10px',
                maxWidth: '900px',
                maxHeight: '90vh',
                overflow: 'auto',
                width: '90%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>Exam Performance Analysis</h2>
                        {examData?.studentName && (
                            <p style={{ margin: '5px 0 0', color: '#666' }}>
                                {examData.studentName} (ID: {studentId}) • Version {versionNumber}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#666',
                            padding: '0',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div>Loading student data...</div>
                    </div>
                )}

                {error && (
                    <div style={{
                        color: '#721c24',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '20px'
                    }}>
                        {error}
                    </div>
                )}

                {analysis && examData && (
                    <div>
                        {renderAnswerSummary()}
                        {renderDifficultyPerformance()}

                        <div style={{ marginTop: '30px' }}>
                            <h4>Question Details</h4>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
                                {Object.keys(examData.questionTexts).map(questionNumber => (
                                    <div
                                        key={questionNumber}
                                        style={{
                                            padding: '12px 15px',
                                            borderBottom: '1px solid #eee',
                                            backgroundColor: examData.variantAnswers[questionNumber]?.includes(examData.studentAnswers[questionNumber] || '') ? '#e8f5e9' : '#ffebee'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 'bold' }}>Question {questionNumber}</div>
                                            <div style={{
                                                padding: '2px 8px',
                                                backgroundColor: examData.questionDifficulties[questionNumber] === 'Easy' ? '#e8f5e9' :
                                                    examData.questionDifficulties[questionNumber] === 'Medium' ? '#fff8e1' :
                                                        '#ffebee',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                color: examData.questionDifficulties[questionNumber] === 'Easy' ? '#2e7d32' :
                                                    examData.questionDifficulties[questionNumber] === 'Medium' ? '#ff8f00' :
                                                        '#c62828',
                                                border: `1px solid ${examData.questionDifficulties[questionNumber] === 'Easy' ? '#c8e6c9' :
                                                    examData.questionDifficulties[questionNumber] === 'Medium' ? '#ffe0b2' :
                                                        '#ffcdd2'
                                                    }`
                                            }}>
                                                {examData.questionDifficulties[questionNumber]}
                                            </div>
                                        </div>
                                        <div style={{ margin: '8px 0', color: '#333' }}>{examData.questionTexts[questionNumber]}</div>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div>
                                                <span style={{ fontWeight: '500' }}>Student Answer: </span>
                                                <span style={{
                                                    color: examData.variantAnswers[questionNumber]?.includes(examData.studentAnswers[questionNumber] || '') ? '#2e7d32' : '#c62828',
                                                    fontWeight: '500'
                                                }}>
                                                    {examData.studentAnswers[questionNumber] || 'No answer'}
                                                </span>
                                            </div>
                                            <div>
                                                <span style={{ fontWeight: '500' }}>Correct Answer: </span>
                                                <span style={{ color: '#2e7d32', fontWeight: '500' }}>
                                                    {examData.variantAnswers[questionNumber]?.join(', ') || 'No correct answer'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentAnalyzeModal;