'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface QuestionOption {
    id: number;
    text: string;
    isCorrect: boolean;
    letter?: string;
}

export interface Question {
    id: number;
    text: string;
    options: QuestionOption[];
    tag?: string | string[];
}

interface ExamCardProps {
    id: number;
    coursetitle: string;
    version: number;
    questions: Question[];
    coursecode: string;
}

// Enhanced color palette for tags with better contrast
const TAG_COLORS = [
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500' },
    { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-500' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-500' },
    { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
    { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-500' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', dot: 'bg-indigo-500' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', border: 'border-fuchsia-200', dot: 'bg-fuchsia-500' },
];

const getTagColorMap = (questions: Question[]) => {
    const uniqueTags = Array.from(new Set(questions.flatMap(q => q.tag ? (Array.isArray(q.tag) ? q.tag : [q.tag]) : [])));
    const tagColorMap = new Map<string, typeof TAG_COLORS[0]>();
    
    // Assign colors to tags in order, only repeating when we run out of colors
    uniqueTags.forEach((tag, index) => {
        const colorIndex = index % TAG_COLORS.length;
        tagColorMap.set(tag, TAG_COLORS[colorIndex]);
    });
    
    return tagColorMap;
};

const ExamCard: React.FC<ExamCardProps> = ({ id, coursetitle, coursecode, version, questions }) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const processedQuestions = questions.map(question => ({
        ...question,
        options: question.options.map((option, index) => ({
            ...option,
            letter: option.letter || String.fromCharCode(65 + index)
        })),
        // Ensure tag is always an array for consistent handling
        tag: question.tag ? (Array.isArray(question.tag) ? question.tag : [question.tag]) : []
    }));

    const tagColorMap = getTagColorMap(questions);
    const allTags = Array.from(tagColorMap.keys());

    return (
        <div className="bg-white text-gray-800 p-6 rounded-xl shadow-lg overflow-y-auto border border-gray-200 hover:shadow-med transition-shadow duration-300" style={{
            width: '23rem',
            height: '550px',
            fontFamily: 'Inter, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}>
            {/* Header Section */}
            <header className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">{coursetitle}</h1>
                        <p className="text-sm text-gray-600">{coursecode}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-medium text-gray-500">Version: {version}</p>
                        <p className="text-xs text-gray-400">{currentDate}</p>
                    </div>
                </div>
                
                {/* Tags legend */}
                {allTags.length > 0 && (
                    <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Question Categories:</p>
                        <div className="flex flex-wrap gap-2">
                            {allTags.map(tag => {
                                const color = tagColorMap.get(tag);
                                return (
                                    <span 
                                        key={tag}
                                        className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${color?.bg} ${color?.text} ${color?.border} border`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${color?.dot} mr-1.5`}></span>
                                        {tag}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-blue-800 mb-1">Instructions:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                        <li className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                            Answer all questions
                        </li>
                        <li className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                            Select only one answer per question
                        </li>
                        <li className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                            Time allowed: 2 hours
                        </li>
                    </ul>
                </div>
            </header>

            {/* Questions Section */}
            <main className="flex-grow pr-2">
                <ol className="space-y-6">
                    {processedQuestions.map((question) => {
                        const primaryTag = question.tag[0];
                        const tagColor = primaryTag ? tagColorMap.get(primaryTag) : null;
                        
                        return (
                            <li key={question.id} className="text-sm group">
                                <div className="font-medium mb-3 flex flex-wrap items-start">
                                    <span className={`${tagColor?.text || 'text-gray-500'} mr-2`}>{question.id}.</span>
                                    <span className={`flex-1 min-w-[70%] ${tagColor?.text || 'text-gray-900'}`}>
                                        {question.text}
                                    </span>
                                    
                                    {question.tag.length > 0 && (
                                        <div className="mt-1 ml-auto flex flex-wrap gap-1.5">
                                            {question.tag.map(t => {
                                                const tColor = tagColorMap.get(t);
                                                return (
                                                    <span 
                                                        key={t}
                                                        className={`inline-flex items-center text-[0.65rem] px-2 py-0.5 rounded-full ${tColor?.bg} ${tColor?.text} ${tColor?.border} border transition-all group-hover:scale-105`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${tColor?.dot} mr-1`}></span>
                                                        {t}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <ul className="space-y-2">
                                    {question.options.map((option) => (
                                        <li
                                            key={option.id}
                                            className={`relative pl-6 pr-8 py-2 rounded-lg transition-all duration-200 ${option.isCorrect
                                                    ? 'bg-green-50 border-2 border-green-300 font-semibold'
                                                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                                } ${tagColor ? 'group-hover:border-l-4 group-hover:border-l-' + tagColor.text.split('-')[1] + '-300' : ''}`}
                                        >
                                            <span className="font-medium text-gray-500 absolute left-2 top-2">
                                                {option.letter}.
                                            </span>
                                            <span className="text-gray-800">{option.text}</span>
                                            {option.isCorrect && (
                                                <CheckCircle2
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600"
                                                    strokeWidth={2.5}
                                                />
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        );
                    })}
                </ol>
            </main>

            {/* Footer Section */}
            <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-xs text-gray-500">
                    <div>
                        <span className="font-medium">Page 1 of 1</span>
                    </div>
                    <div className="flex items-center">
                        <span className="bg-gray-100 px-2 py-1 rounded-md">ID: {id}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamCard;