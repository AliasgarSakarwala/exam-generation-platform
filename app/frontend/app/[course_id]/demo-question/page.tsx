"use client";

import { useEffect, useState } from 'react';
import { getQuestionById } from '@/services/question';
import { Question } from '@/services/question';

export default function QuestionDetailPage() {
    const [question, setQuestion] = useState<Question | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                setLoading(true);
                const data = await getQuestionById(1); // Fetch question with ID 1
                setQuestion(data);
            } catch (err) {
                setError('Failed to fetch question');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestion();
    }, []);

    if (loading) {
        return <div className="p-4">Loading question...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">{error}</div>;
    }

    if (!question) {
        return <div className="p-4">Question not found</div>;
    }

    // Helper to convert difficulty level to text
    const getDifficultyText = (level: number) => {
        switch (level) {
            case 1: return 'Easy';
            case 2: return 'Medium';
            case 3: return 'Hard';
            default: return 'Unknown';
        }
    };

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Question Details</h1>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Question Text</h2>
                <p className="bg-gray-50 p-3 rounded">{question.question_text}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Difficulty</h2>
                    <p>{getDifficultyText(question.difficulty_level)}</p>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-2">Question Bank ID</h2>
                    <p>{question.question_bank_id}</p>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Options</h2>
                <ul className="space-y-2">
                    {question.options.map((option) => (
                        <li
                            key={option.letter}
                            className={`p-3 rounded ${option.is_correct ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'}`}
                        >
                            <span className="font-medium">{option.letter}.</span> {option.text}
                            {option.is_correct && <span className="ml-2 text-green-600">✓ Correct Answer</span>}
                        </li>
                    ))}
                </ul>
            </div>

            {question.tags && question.tags.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                        {question.tags.map((tag, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="text-sm text-gray-500">
                <p>Created: {new Date(question.created_at).toLocaleString()}</p>
                <p>Last Updated: {new Date(question.updated_at).toLocaleString()}</p>
            </div>
        </div>
    );
}