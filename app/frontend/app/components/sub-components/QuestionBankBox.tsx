import { Plus, X, Check, ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

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

type DifficultyStyle = {
    text: string;
    bg: string;
    textColor: string;
};

type DifficultyStyles = {
    [key: number]: DifficultyStyle;
};

const difficultyStyles: DifficultyStyles = {
    1: { text: 'Easy', bg: 'bg-green-100', textColor: 'text-green-800' },
    2: { text: 'Medium', bg: 'bg-yellow-100', textColor: 'text-yellow-800' },
    3: { text: 'Hard', bg: 'bg-red-100', textColor: 'text-red-800' }
};

interface QuestionBankBoxProps {
    isOpen: boolean;
    onClose: () => void;
    questionBanks: QuestionBank[];
    onQuestionBanksChange: (banks: QuestionBank[]) => void;
    position: { x: number; y: number };
    onPositionChange: (position: { x: number; y: number }) => void;
    isLoading?: boolean;
}

export default function QuestionBankBox({
    isOpen,
    onClose,
    questionBanks,
    onQuestionBanksChange,
    position,
    onPositionChange,
    isLoading = false
}: QuestionBankBoxProps) {
    const [expandedBank, setExpandedBank] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    // Add state for search and filter per bank
    const [searchTerms, setSearchTerms] = useState<Record<number, string>>({});
    const [difficultyFilters, setDifficultyFilters] = useState<Record<number, number[]>>({});
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 200); // Match transition duration
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        onPositionChange({
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handlePercentageChange = (bankId: number, percent: number | '') => {
        onQuestionBanksChange(
            questionBanks.map(bank => {
                if (bank.id !== bankId) return bank;

                const newPercentage = percent === '' ? '' : Math.min(100, Math.max(0, Number(percent)));

                if (newPercentage === '' || newPercentage === 0) {
                    return {
                        ...bank,
                        percentage: newPercentage,
                        questions: bank.questions.map(q => ({
                            ...q,
                            selected: false,
                            mandatory: false
                        }))
                    };
                }

                // Get the filtered questions for this bank
                const filteredQuestions = filterQuestions(bankId, bank.questions);
                const totalFilteredQuestions = filteredQuestions.length;

                if (totalFilteredQuestions === 0) {
                    // If no questions match the filter, don't select anything
                    return {
                        ...bank,
                        percentage: newPercentage,
                        questions: bank.questions.map(q => ({
                            ...q,
                            selected: false,
                            mandatory: false
                        }))
                    };
                }

                const decimalPercent = Number(newPercentage) / 100;
                const countToSelect = Math.round(totalFilteredQuestions * decimalPercent);

                if (newPercentage === 100) {
                    // Select all filtered questions
                    const filteredIds = filteredQuestions.map(q => q.id);
                    return {
                        ...bank,
                        percentage: newPercentage,
                        questions: bank.questions.map(question => ({
                            ...question,
                            selected: filteredIds.includes(question.id),
                            mandatory: filteredIds.includes(question.id) ? question.mandatory : false
                        }))
                    };
                }

                // Randomly select from filtered questions
                const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
                const selectedIds = shuffled.slice(0, countToSelect).map(q => q.id);

                return {
                    ...bank,
                    percentage: newPercentage,
                    questions: bank.questions.map(question => ({
                        ...question,
                        selected: selectedIds.includes(question.id),
                        mandatory: selectedIds.includes(question.id) ? question.mandatory : false
                    }))
                };
            })
        );
    };

    const toggleBank = (bankId: number) => {
        setExpandedBank(expandedBank === bankId ? null : bankId);
    };

    const toggleQuestionSelect = (bankId: number, questionId: number) => {
        onQuestionBanksChange(
            questionBanks.map(bank => {
                if (bank.id === bankId) {
                    const updatedQuestions = bank.questions.map(question => {
                        if (question.id === questionId) {
                            const newSelected = !question.selected;
                            return {
                                ...question,
                                selected: newSelected,
                                mandatory: newSelected ? question.mandatory : false
                            };
                        }
                        return question;
                    });
                    return { ...bank, questions: updatedQuestions };
                }
                return bank;
            })
        );
    };

    const toggleQuestionMandatory = (bankId: number, questionId: number) => {
        onQuestionBanksChange(
            questionBanks.map(bank => {
                if (bank.id === bankId) {
                    const updatedQuestions = bank.questions.map(question => {
                        if (question.id === questionId) {
                            const newMandatory = !question.mandatory;
                            return {
                                ...question,
                                mandatory: newMandatory,
                                selected: newMandatory ? true : question.selected
                            };
                        }
                        return question;
                    });
                    return { ...bank, questions: updatedQuestions };
                }
                return bank;
            })
        );
    };

    const handleSearchChange = (bankId: number, term: string) => {
        setSearchTerms(prev => ({ ...prev, [bankId]: term }));
    };

    const toggleDifficultyFilter = (bankId: number, difficulty: number) => {
        setDifficultyFilters(prev => {
            const currentFilters = prev[bankId] || [];
            const newFilters = currentFilters.includes(difficulty)
                ? currentFilters.filter(d => d !== difficulty)
                : [...currentFilters, difficulty];

            return {
                ...prev,
                [bankId]: newFilters.length > 0 ? newFilters : []
            };
        });
    };

    const filterQuestions = (bankId: number, questions: Question[]) => {
        const searchTerm = searchTerms[bankId]?.toLowerCase() || '';
        const activeFilters = difficultyFilters[bankId] || [];

        return questions.filter(question => {
            const matchesSearch = searchTerm === '' ||
                question.text.toLowerCase().includes(searchTerm);

            const matchesDifficulty = activeFilters.length === 0 ||
                activeFilters.includes(question.difficulty);

            return matchesSearch && matchesDifficulty;
        });
    };

    const handleComplete = () => {
        const selectedQuestions = questionBanks.flatMap(bank =>
            bank.questions.filter(q => q.selected)
        );
        console.log("Selected questions:", selectedQuestions);
        onClose();
    };

   if (!isOpen) return null;

    return (
        <div
            className="fixed z-50 transition-opacity duration-200"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                cursor: isDragging ? 'grabbing' : 'default',
                opacity: isVisible ? 1 : 0
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                className="relative bg-white rounded-lg shadow-2xl border border-gray-200 w-[90vw] max-w-[1000px] max-h-[70vh] flex flex-col transition-all duration-200 transform"
                style={{
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    transform: isVisible ? 'translateY(0)' : 'translateY(-10px)'
                }}
            >
                <div
                    className="flex justify-between items-center p-4 border-b cursor-move bg-gray-50 rounded-t-lg"
                    onMouseDown={handleMouseDown}
                >
                    <h3 className="text-lg font-semibold text-gray-800">Question Banks</h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 flex-grow">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-600">Loading question banks...</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 overflow-y-auto flex-grow space-y-4">
                            {questionBanks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                                    <p>No question banks available</p>
                                </div>
                            ) : (
                                questionBanks.map(bank => (
                                    <div key={bank.id} className="border rounded-lg overflow-hidden transition-all duration-150 hover:shadow-md">
                                        <div className="flex items-center justify-between p-3 bg-gray-50">
                                            <div
                                                className="flex items-center cursor-pointer flex-grow"
                                                onClick={() => toggleBank(bank.id)}
                                            >
                                                <ChevronDown
                                                    className={`w-5 h-5 mr-2 transition-transform text-gray-600 ${expandedBank === bank.id ? 'rotate-0' : '-rotate-90'}`}
                                                />
                                                <span className="font-medium text-gray-800">{bank.name}</span>
                                                <span className="ml-2 text-sm text-gray-500">
                                                    ({bank.questions.filter(q => q.selected).length}/{bank.questions.length} selected)
                                                </span>
                                            </div>
                                            <div
                                                className="flex items-center space-x-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={bank.percentage}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        handlePercentageChange(bank.id, value === '' ? '' : Number(value));
                                                    }}
                                                    placeholder="Enter %"
                                                    className="w-24 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                />
                                                <span className="text-sm text-gray-600">%</span>
                                            </div>
                                        </div>

                                        {expandedBank === bank.id && (
                                            <>
                                                <div className="p-3 border-b bg-gray-50">
                                                    <div className="flex flex-col space-y-3">
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                placeholder="Search questions..."
                                                                value={searchTerms[bank.id] || ''}
                                                                onChange={(e) => handleSearchChange(bank.id, e.target.value)}
                                                                className="w-full px-3 py-2 pl-9 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                            />
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                {[1, 2, 3].map(difficulty => (
                                                                    <button
                                                                        key={difficulty}
                                                                        onClick={() => toggleDifficultyFilter(bank.id, difficulty)}
                                                                        className={`px-3 py-1 text-xs rounded-full transition-all ${difficultyStyles[difficulty].bg} ${difficultyStyles[difficulty].textColor} ${(difficultyFilters[bank.id] || []).includes(difficulty) ? 'ring-2 ring-offset-1 ring-gray-500 scale-105' : 'opacity-90 hover:opacity-100'}`}
                                                                    >
                                                                        {difficultyStyles[difficulty].text}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Showing {filterQuestions(bank.id, bank.questions).length} of {bank.questions.length} questions
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                                                    {filterQuestions(bank.id, bank.questions).length === 0 ? (
                                                        <div className="p-4 text-center text-gray-500 text-sm">
                                                            No questions match your filters
                                                        </div>
                                                    ) : (
                                                        filterQuestions(bank.id, bank.questions).map(question => (
                                                            <div
                                                                key={question.id}
                                                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                                            >
                                                                <div className="flex items-center">
                                                                    <span className="text-sm text-gray-800">{question.text}</span>
                                                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${difficultyStyles[question.difficulty].bg} ${difficultyStyles[question.difficulty].textColor}`}>
                                                                        {difficultyStyles[question.difficulty].text}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center space-x-4">
                                                                    <div className="flex items-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`select-${bank.id}-${question.id}`}
                                                                            checked={question.selected}
                                                                            onChange={() => toggleQuestionSelect(bank.id, question.id)}
                                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 transition"
                                                                        />
                                                                        <label htmlFor={`select-${bank.id}-${question.id}`} className="ml-2 text-xs text-gray-700">
                                                                            Select
                                                                        </label>
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`mandatory-${bank.id}-${question.id}`}
                                                                            checked={question.mandatory}
                                                                            onChange={() => toggleQuestionMandatory(bank.id, question.id)}
                                                                            disabled={!question.selected}
                                                                            className={`w-4 h-4 rounded focus:ring-blue-500 transition ${!question.selected ? 'text-gray-300' : 'text-red-600'}`}
                                                                        />
                                                                        <label
                                                                            htmlFor={`mandatory-${bank.id}-${question.id}`}
                                                                            className={`ml-2 text-xs ${!question.selected ? 'text-gray-400' : 'text-red-700'}`}
                                                                        >
                                                                            Mandatory
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end">
                            <button
                                onClick={handleComplete}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Complete Selection
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}