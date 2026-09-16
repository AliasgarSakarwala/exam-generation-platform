import { useState } from 'react';

interface Variant {
    //id: number;
    answerKey?: string;
    title?: string;
    courseTitle?: string;
    questions?: any[];
    exam_variant_id?: number;
    version_number?: number;
    answer_key?: string | null;
    question_text?: string;
    question_number?: number;
    options?: string[];
    correct_options?: string[];
}

interface ExamCardStatisticsProps {
    variantData: Variant[];
    comparisonType?: 'answerKey' | 'questions'; // Optional prop to force comparison type
}

const ExamCardStatistics = ({ variantData, comparisonType }: ExamCardStatisticsProps) => {
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [similarityMatrix, setSimilarityMatrix] = useState<number[][]>([]);
    const [variantNames, setVariantNames] = useState<string[]>([]);

    const calculateSimilarity = (variant1: Variant, variant2: Variant): number => {
        // Use forced comparison type if provided, otherwise auto-detect
        const useAnswerKey = comparisonType === 'answerKey' ||
            (comparisonType !== 'questions' &&
                (variant1.answerKey || variant1.answer_key) &&
                (variant2.answerKey || variant2.answer_key));

        if (useAnswerKey) {
            const arr1 = (variant1.answerKey || variant1.answer_key || '').replace(/\s/g, '').split(',');
            const arr2 = (variant2.answerKey || variant2.answer_key || '').replace(/\s/g, '').split(',');

            if (arr1.length !== arr2.length || arr1.length === 0) return 0;

            let matches = 0;
            for (let i = 0; i < arr1.length; i++) {
                if (arr1[i] === arr2[i]) matches++;
            }
            return (matches / arr1.length) * 100;
        }

        // Fallback to comparing question texts
        const questions1 = variant1.questions || [];
        const questions2 = variant2.questions || [];
        const minQuestions = Math.min(questions1.length, questions2.length);
        if (minQuestions === 0) return 0;

        let textMatches = 0;
        for (let i = 0; i < minQuestions; i++) {
            const q1 = questions1[i];
            const q2 = questions2[i];
            if (q1.question_text === q2.question_text) {
                textMatches++;
            }
        }
        return (textMatches / minQuestions) * 100;
    };

    const generateSimilarityMatrix = () => {
        const names = variantData.map(v =>
            `Variant ${v.version_number}`);
        setVariantNames(names);

        const matrix: number[][] = [];

        for (let i = 0; i < variantData.length; i++) {
            matrix[i] = [];
            for (let j = 0; j < variantData.length; j++) {
                matrix[i][j] = i === j ? 100 : calculateSimilarity(
                    variantData[i],
                    variantData[j]
                );
            }
        }

        setSimilarityMatrix(matrix);
    };

    const handleClick = () => {
        if (variantData.length === 0) return;

        setIsLoadingStats(true);
        generateSimilarityMatrix();

        setTimeout(() => {
            setIsLoadingStats(false);
            setShowStatsModal(true);
        }, 500);
    };

    const getDifferenceCount = (similarity: number, variant: Variant) => {
        // Determine which field to use for count
        const useAnswerKey = comparisonType === 'answerKey' ||
            (comparisonType !== 'questions' &&
                (variant.answerKey || variant.answer_key));

        if (useAnswerKey) {
            const answerKey = variant.answerKey || variant.answer_key || '';
            const answerCount = answerKey.split(',').length;
            return answerCount - Math.round((similarity / 100) * answerCount);
        }

        // Fallback to questions length
        if (!variant.questions) return 0;
        const questionCount = variant.questions.length;
        return questionCount - Math.round((similarity / 100) * questionCount);
    };

    const getComparisonType = () => {
        if (comparisonType === 'answerKey') return 'answer keys';
        if (comparisonType === 'questions') return 'question texts';

        // Auto-detect if comparisonType not specified
        return variantData[0]?.answerKey || variantData[0]?.answer_key
            ? 'answer keys'
            : 'question texts';
    };

    return (
        <div className="flex flex-col items-center justify-center p-4" data-testid="exam-stats">
            <button
                data-onboarding="exam-statistics"
                onClick={handleClick}
                disabled={isLoadingStats || variantData.length === 0}
                className={`relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                    text-white font-medium shadow-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${isLoadingStats || variantData.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-500 via-teal-500 to-teal-600 hover:from-teal-600 hover:via-teal-600 hover:to-teal-700 active:from-teal-700 active:via-teal-700 active:to-teal-800'
                    }
                    focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2
                    ${!isLoadingStats && variantData.length > 0 &&
                    'hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
                    }
                    overflow-hidden
                    group
                `}
            >
                <span className="absolute inset-0 bg-gradient-to-r 
                    from-teal-400/30 via-teal-500/20 to-teal-600/30 
                    opacity-0 group-hover:opacity-100 
                    transition-opacity duration-500 ease-out"></span>

                <span className="absolute inset-0 overflow-hidden">
                    <span className="absolute top-0 -left-full w-1/2 h-full 
                        bg-white/20 -skew-x-12
                        group-hover:animate-shine group-hover:[animation-duration:1.8s] 
                        transition-all duration-500 pointer-events-none"></span>
                </span>

                {isLoadingStats ? (
                    <>
                        <span className="relative z-10">Loading Statistics...</span>
                        <svg
                            className="w-5 h-5 animate-spin relative z-10"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </>
                ) : (
                    <>
                        <span className="relative z-10 drop-shadow-sm">Exam Statistics</span>
                        <svg
                            className="w-5 h-5 relative z-10 transition-all duration-300 
                                group-hover:scale-110 group-hover:animate-pulse group-hover:drop-shadow-glow"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                    </>
                )}
            </button>

            {showStatsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Exam Variant Similarity Matrix
                                </h2>
                                <button
                                    onClick={() => setShowStatsModal(false)}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-gray-600 mt-1">
                                Comparison of {getComparisonType()} between {variantData.length} exam variants
                            </p>
                        </div>

                        <div className="flex-1 overflow-auto p-6">
                            {similarityMatrix.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="p-3 sticky left-0 bg-white border-b border-r border-gray-200 z-10"></th>
                                                {variantNames.map((name, index) => (
                                                    <th key={index} className="p-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
                                                        {name}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {similarityMatrix.map((row, rowIndex) => (
                                                <tr key={rowIndex} className="hover:bg-gray-50">
                                                    <td className="p-3 sticky left-0 bg-white border-b border-r border-gray-200 font-medium text-gray-700 z-10">
                                                        {variantNames[rowIndex]}
                                                    </td>
                                                    {row.map((similarity, colIndex) => (
                                                        <td
                                                            key={colIndex}
                                                            className={`p-3 border-b border-gray-200 text-center 
                                                                ${similarity < 40 ? 'bg-teal-50' :
                                                                    similarity < 50 ? 'bg-yellow-50' :
                                                                        similarity < 60 ? 'bg-orange-50' : 'bg-red-50'}
                                                                ${rowIndex === colIndex ? '!bg-[#dcf0fa] font-semibold' : ''}
                                                            `}
                                                        >
                                                            <div className="flex flex-col items-center">
                                                                <span className="font-medium">
                                                                    {similarity.toFixed(0)}%
                                                                </span>
                                                                {rowIndex !== colIndex && (
                                                                    <span className="text-xs text-gray-500 mt-1">
                                                                        {getDifferenceCount(similarity, variantData[rowIndex])} diff
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No variants available for comparison
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-[#dcf0fa] rounded mr-2"></div>
                                        <span className="text-sm text-gray-600">Exact match (100%)</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-teal-50 rounded mr-2 border border-teal-100"></div>
                                        <span className="text-sm text-gray-600">Below 40%</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-yellow-50 rounded mr-2 border border-yellow-100"></div>
                                        <span className="text-sm text-gray-600">40-49%</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-orange-50 rounded mr-2 border border-orange-100"></div>
                                        <span className="text-sm text-gray-600">50-59%</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-red-50 rounded mr-2 border border-red-100"></div>
                                        <span className="text-sm text-gray-600">60%+</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowStatsModal(false)}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamCardStatistics;