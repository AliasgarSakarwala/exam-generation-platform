// context/ExamContext.tsx
"use client";

import { createContext, useContext, useState } from 'react';

interface Question {
    id: number;
    text: string;
    selected: boolean;
    mandatory: boolean;
}

interface QuestionBank {
    id: number;
    name: string;
    percentage: string;
    questions: Question[];
}

interface ExamData {
    examTitle: string;
    numQuestions: string;
    numVariants: string;
    percentages: {
        easy: string;
        medium: string;
        hard: string;
    };
    selectedQuestions: {
        question: Question;
        mandatory: boolean;
    }[];
}

interface ExamContextType {
    examData: ExamData;
    setExamData: React.Dispatch<React.SetStateAction<ExamData>>;
    questionBanks: QuestionBank[];
    setQuestionBanks: React.Dispatch<React.SetStateAction<QuestionBank[]>>;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export function ExamProvider({ children }: { children: React.ReactNode }) {
    const [examData, setExamData] = useState<ExamData>({
        examTitle: "",
        numQuestions: "",
        numVariants: "",
        percentages: {
            easy: "",
            medium: "",
            hard: ""
        },
        selectedQuestions: []
    });

    const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([
        {
            id: 1,
            name: "General Knowledge",
            percentage: '',
            questions: [
                { id: 101, text: "What is the capital of France?", selected: false, mandatory: false },
                { id: 102, text: "Which planet is known as the Red Planet?", selected: false, mandatory: false },
                { id: 103, text: "Who painted the Mona Lisa?", selected: false, mandatory: false },
                { id: 104, text: "What is the largest ocean on Earth?", selected: false, mandatory: false },
                { id: 105, text: "In which year did World War II end?", selected: false, mandatory: false },
            ]
        },
        {
            id: 2,
            name: "React Development",
            percentage: '',
            questions: [
                { id: 201, text: "Explain the concept of React hooks", selected: false, mandatory: false },
                { id: 202, text: "What is JSX in React?", selected: false, mandatory: false },
                { id: 203, text: "How does virtual DOM work?", selected: false, mandatory: false },
                { id: 204, text: "What are React components?", selected: false, mandatory: false },
                { id: 205, text: "Explain the difference between props and state", selected: false, mandatory: false },
            ]
        },
        {
            id: 3,
            name: "JavaScript Fundamentals",
            percentage: '',
            questions: [
                { id: 301, text: "What is closure in JavaScript?", selected: false, mandatory: false },
                { id: 302, text: "Explain event bubbling", selected: false, mandatory: false },
                { id: 303, text: "What is hoisting in JavaScript?", selected: false, mandatory: false },
                { id: 304, text: "Difference between let, const, and var", selected: false, mandatory: false },
                { id: 305, text: "What is the 'this' keyword in JavaScript?", selected: false, mandatory: false },
            ]
        },
        {
            id: 4,
            name: "CSS Concepts",
            percentage: '',
            questions: [
                { id: 401, text: "What is the box model in CSS?", selected: false, mandatory: false },
                { id: 402, text: "Explain flexbox layout", selected: false, mandatory: false },
                { id: 403, text: "What are CSS pseudo-classes?", selected: false, mandatory: false },
                { id: 404, text: "Difference between margin and padding", selected: false, mandatory: false },
                { id: 405, text: "What is CSS specificity?", selected: false, mandatory: false },
            ]
        },
        {
            id: 5,
            name: "TypeScript Basics",
            percentage: '',
            questions: [
                { id: 501, text: "What are TypeScript interfaces?", selected: false, mandatory: false },
                { id: 502, text: "Explain type inference in TypeScript", selected: false, mandatory: false },
                { id: 503, text: "What are generics in TypeScript?", selected: false, mandatory: false },
                { id: 504, text: "Difference between 'any' and 'unknown'", selected: false, mandatory: false },
                { id: 505, text: "What are TypeScript enums?", selected: false, mandatory: false },
            ]
        }
    ]);

    return (
        <ExamContext.Provider value={{ examData, setExamData, questionBanks, setQuestionBanks }}>
            {children}
        </ExamContext.Provider>
    );
}

export function useExamContext() {
    const context = useContext(ExamContext);
    if (context === undefined) {
        throw new Error('useExamContext must be used within an ExamProvider');
    }
    return context;
}