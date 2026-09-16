"use client";

import QuestionBankDrop from "./sub-components/QuestionBankDrop";
import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter, useParams } from 'next/navigation';
import { listQuestionBanks, getQuestionBankByID } from '@/services/question_bank';
import { ExamService, type CreateExamDto } from '@/services/exam';

type DifficultyLevel = "easy" | "medium" | "hard";

export interface QuestionOption {
    id: number;
    text: string;
    isCorrect: boolean;
}

export interface Question {
    id: number;
    text: string;
    selected: boolean;
    mandatory: boolean;
    difficulty: number; // 1: easy, 2: medium, 3: hard
    options: QuestionOption[];
    tag: string;
}

export interface QuestionBank {
    id: number;
    name: string;
    questions: Question[];
    percentage: number | '';
}

export default function ExamDetails() {
    const [formData, setFormData] = useState({
        examTitle: "",
        numQuestions: "",
        numVariants: "",
        percentages: {
            easy: "",
            medium: "",
            hard: ""
        }
    });

    const params = useParams();
    const course_id = params?.course_id ? Number(params.course_id) : null;
    const router = useRouter();

    const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (course_id) {
            fetchQuestionBanks(course_id);
            console.log(`course id = ${course_id}`);
        }
    }, [course_id]);

    const fetchQuestionBanks = async (classroom_id: number) => {
        try {
            setLoading(true);
            const { data: banksData } = await listQuestionBanks(classroom_id);
            const banksWithQuestions = await Promise.all(
                banksData.map(async (bank: any) => {
                    const { data: fullBank } = await getQuestionBankByID(bank.question_bank_id, classroom_id);
                    const questions: Question[] = fullBank.questions.map((q: any) => {
                        const options: QuestionOption[] = [];
                        for (let i = 1; i <= 6; i++) {
                            const optionText = q[`Option ${i}`];
                            if (optionText && optionText.trim() !== '') {
                                options.push({
                                    id: i,
                                    text: optionText,
                                    isCorrect: optionText === q.Answer
                                });
                            }
                        }

                        const tag = q["Tag 1"]?.trim() || "rogue"; // Use Tag 1 if valid, otherwise "rogue"

                        return {
                            id: q.dbID,
                            text: q.Question,
                            selected: false,
                            mandatory: false,
                            difficulty: q.Difficulty === 'Easy' ? 1 : q.Difficulty === 'Medium' ? 2 : 3,
                            options,
                            tag: [tag] // Return as an array with a single tag
                        };
                    });
                    return {
                        id: bank.question_bank_id,
                        name: bank.name,
                        percentage: '',
                        questions
                    };
                })
            );
            setQuestionBanks(banksWithQuestions);
        } catch (error) {
            console.error("Failed to fetch question banks:", error);
            toast.error("Failed to load question banks");
        } finally {
            setLoading(false);
        }
    };

    const [errors, setErrors] = useState({
        examTitle: false,
        numQuestions: false,
        numVariants: false,
        percentages: {
            easy: false,
            medium: false,
            hard: false
        },
        totalPercentage: false,
        insufficientQuestions: false
    });

    const handlePercentageChange = (level: DifficultyLevel, value: string) => {
        if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 100)) {
            setFormData(prev => ({
                ...prev,
                percentages: {
                    ...prev.percentages,
                    [level]: value
                }
            }));

            setErrors(prev => ({
                ...prev,
                percentages: {
                    ...prev.percentages,
                    [level]: false
                },
                totalPercentage: false
            }));
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        setErrors(prev => ({
            ...prev,
            [field]: false,
            insufficientQuestions: false
        }));
    };

    const handleSubmit = async () => {
        sessionStorage.setItem('accessed_examgenerated', 'false');
        let hasError = false;
        const newErrors = {
            examTitle: false,
            numQuestions: false,
            numVariants: false,
            percentages: {
                easy: false,
                medium: false,
                hard: false
            },
            totalPercentage: false,
            insufficientQuestions: false
        };

        // Validate percentages
        const values = Object.values(formData.percentages).map(val => parseInt(val) || 0);
        const total = values.reduce((sum, val) => sum + val, 0);

        // Check if any percentage is empty
        Object.entries(formData.percentages).forEach(([level, value]) => {
            if (value === "") {
                newErrors.percentages[level as DifficultyLevel] = true;
                hasError = true;
            }
        });

        // Check if total is 100
        if (total !== 100) {
            newErrors.totalPercentage = true;
            hasError = true;
        }

        // Check other fields
        if (!formData.examTitle) {
            newErrors.examTitle = true;
            hasError = true;
        }

        if (!formData.numQuestions) {
            newErrors.numQuestions = true;
            hasError = true;
        } else {
            const numQuestions = parseInt(formData.numQuestions);
            if (numQuestions > 100) {
                newErrors.numQuestions = true;
                hasError = true;
                toast.warning("Maximum number of questions is 100");
            } else if (numQuestions < 1) {
                newErrors.numQuestions = true;
                hasError = true;
                toast.error("Number of questions must be at least 1");
            }
        }

        if (!formData.numVariants) {
            newErrors.numVariants = true;
            hasError = true;
        } else {
            const numVariants = parseInt(formData.numVariants);
            if (numVariants > 20) {
                newErrors.numVariants = true;
                hasError = true;
                toast.warning("Maximum number of variants is 20");
            } else if (numVariants < 1) {
                newErrors.numVariants = true;
                hasError = true;
                toast.error("Number of variants must be at least 1");
            }
        }

        // Check if enough questions are selected
        const selectedQuestionsCount = questionBanks.flatMap(bank =>
            bank.questions.filter(q => q.selected)
        ).length;

        const requestedQuestions = parseInt(formData.numQuestions) || 0;
        if (selectedQuestionsCount < requestedQuestions) {
            newErrors.insufficientQuestions = true;
            hasError = true;
            toast.error(`Please select at least ${requestedQuestions} questions (currently selected: ${selectedQuestionsCount})`);
        }

        setErrors(newErrors);

        if (hasError) {
            return;
        }

        // Get all selected questions from question banks with their options
        const selectedQuestions = questionBanks.flatMap(bank =>
            bank.questions
                .filter(q => q.selected)
                .map(q => ({
                    id: q.id,
                    text: q.text,
                    mandatory: q.mandatory,
                    options: q.options.map(opt => ({
                        id: opt.id,
                        text: opt.text,
                        isCorrect: opt.isCorrect
                    })),
                    tag: q.tag
                }))
        );

        try {
            const localExamData = {
                examTitle: formData.examTitle,
                numQuestions: formData.numQuestions,
                numVariants: formData.numVariants,
                difficultyDistribution: {
                    easy: formData.percentages.easy,
                    medium: formData.percentages.medium,
                    hard: formData.percentages.hard
                },
                selectedQuestions: selectedQuestions
            };

            console.log("Exam Details examdatabb:", localExamData);
            localStorage.setItem("examData", JSON.stringify(localExamData));

            await router.push(`./examgenerated`);
            toast.success("Creating Exam!");
        } catch (error) {
            console.error("Error creating exam:", error);
            toast.error("Failed to create exam");
        }
    };

    const handleReset = () => {
        setFormData({
            examTitle: "",
            numQuestions: "",
            numVariants: "",
            percentages: {
                easy: "",
                medium: "",
                hard: ""
            }
        });

        setErrors({
            examTitle: false,
            numQuestions: false,
            numVariants: false,
            percentages: {
                easy: false,
                medium: false,
                hard: false
            },
            totalPercentage: false,
            insufficientQuestions: false
        });

        setQuestionBanks(prev => prev.map(bank => ({
            ...bank,
            questions: bank.questions.map(q => ({
                ...q,
                selected: false,
                mandatory: false
            }))
        })));

        toast.info("Form has been reset");
    };

    return (
        <div className="bg-white p-6 rounded-xl space-y-6 w-full mx-auto h-full overflow-y-auto">
            <style>{`
                @keyframes spin-reverse {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(-360deg); }
                }
                .reset-icon-hover:hover img {
                    animation: spin-reverse 1.5s linear infinite;
                }
                .error-border {
                    border: 2px solid #ef4444 !important;
                    animation: pulse 0.5s ease-in-out;
                }
                @keyframes pulse {
                    0% { border-color: #fff; }
                    50% { border-color: #ef4444; }
                    100% { border-color: #ef4444; }
                }`}
            </style>

            <ToastContainer position="top-right" autoClose={3000} />

            <div className="flex justify-between items-center">
                <h2 className="text-2xl text-[#3774E5] font-semibold">Exam Details</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="reset-icon-hover flex items-center gap-1 px-3 py-2 bg-amber-500 text-white rounded-lg cursor-pointer transition hover:bg-amber-600"
                        title="Reset form"
                    >
                        <img
                            src="/reset-left-line.svg"
                            alt="Reset"
                            className="w-4 h-4 invert"
                        />
                        <span>Reset</span>
                    </button>
                    <button
                        className="bg-[#3774E5] text-white px-4 py-2 rounded-lg cursor-pointer transition hover:bg-[#2a5cb7]"
                        onClick={handleSubmit}
                    >
                        Submit
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Title of Exam</label>
                    <input
                        type="text"
                        placeholder="e.g. Quiz-1"
                        className={`p-2 border rounded-lg w-full ${errors.examTitle ? 'error-border' : 'border-gray-300'}`}
                        value={formData.examTitle}
                        onChange={(e) => handleInputChange("examTitle", e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2" data-onboarding="num-of-questions">
                        <label className="block text-sm font-medium text-gray-700">Number of Questions</label>
                        <input
                            type="number"
                            placeholder="e.g. 30 (max 100)"
                            className={`p-2 border rounded-lg w-full ${errors.numQuestions ? 'error-border' : 'border-gray-300'}`}
                            value={formData.numQuestions}
                            onChange={(e) => handleInputChange("numQuestions", e.target.value)}
                            min="1"
                        />
                    </div>
                    <div className="space-y-2" data-onboarding="num-of-variants">
                        <label className="block text-sm font-medium text-gray-700">Number of Variants</label>
                        <input
                            type="number"
                            placeholder="e.g. 3 (max 20)"
                            className={`p-2 border rounded-lg w-full ${errors.numVariants ? 'error-border' : 'border-gray-300'}`}
                            value={formData.numVariants}
                            onChange={(e) => handleInputChange("numVariants", e.target.value)}
                            min="1"
                        />
                    </div>
                </div>

                <div className="md:col-span-2 space-y-2" data-onboarding="difficulty-distribution">
                    <label className="block text-sm font-medium text-gray-700">Difficulty Distribution</label>
                    {errors.totalPercentage && (
                        <p className="text-red-500 text-sm">Total must equal 100%</p>
                    )}
                    <div className="flex gap-4">
                        {(["easy", "medium", "hard"] as DifficultyLevel[]).map((level) => (
                            <div key={level} className="flex-1 space-y-1">
                                <label className="block text-xs text-gray-500 capitalize">
                                    {level} (%)
                                </label>
                                <input
                                    type="number"
                                    placeholder={`Enter ${level} %`}
                                    value={formData.percentages[level]}
                                    onChange={(e) => handlePercentageChange(level, e.target.value)}
                                    className={`p-2 border rounded-lg w-full ${errors.percentages[level] || errors.totalPercentage ? 'error-border' : 'border-gray-300'}`}
                                    min="0"
                                    max="100"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-80 mt-6" data-onboarding="add-questions">
                <QuestionBankDrop
                    questionBanks={questionBanks}
                    setQuestionBanks={setQuestionBanks}
                />
                {errors.insufficientQuestions && (
                    <p className="text-red-500 text-sm mt-2">
                        Please select enough questions to meet the required number
                    </p>
                )}
            </div>
        </div>
    );
}