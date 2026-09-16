import React, { useState } from 'react';
import { 
    createQuestionBank,
    listQuestionBanks,
    getQuestionBankByID,
    deleteQuestionBank,
    updateQuestionBank,
    PostedQuestion
} from '@/services/question_bank';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface AddManualQuestionProps {
    questionBankId: number;
    classroomId: number;
    isOpen: boolean;
    onClose: () => void;
    onQuestionAdded: () => void;
}

const AddManualQuestion: React.FC<AddManualQuestionProps> = ({
    questionBankId,
    classroomId,
    isOpen,
    onClose,
    onQuestionAdded,
}) => {
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState<Array<{ text: string; isCorrect: boolean }>>([
        { text: '', isCorrect: false },
    ]);
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    const handleCorrectOptionChange = (index: number) => {
        const newOptions = options.map((opt, i) => ({
            ...opt,
            isCorrect: i === index,
        }));
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 6) {
            setOptions([...options, { text: '', isCorrect: false }]);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 1) {
            const newOptions = options.filter((_, i) => i !== index);
            if (options[index].isCorrect && newOptions.length > 0) {
                newOptions[0].isCorrect = true;
            }
            setOptions(newOptions);
        }
    };

    const addTag = () => {
        if (newTag.trim() && tags.length < 5) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!questionText.trim()) {
            setError('Question text is required');
            return;
        }

        const hasEmptyOption = options.some(opt => !opt.text.trim());
        if (hasEmptyOption) {
            setError('All options must have text');
            return;
        }

        const hasCorrectOption = options.some(opt => opt.isCorrect);
        if (!hasCorrectOption) {
            setError('Please select a correct answer');
            return;
        }

        const toastId = toast.loading('Saving question...', {
            position: 'top-center',
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
        });

        try {
            setIsSubmitting(true);

            const questionData: Partial<PostedQuestion> = {
                Question: questionText,
                Difficulty: difficulty,
            };

            options.forEach((option, index) => {
                questionData[`Option ${index + 1}` as keyof PostedQuestion] = option.text;
            });

            for (let i = options.length; i < 6; i++) {
                questionData[`Option ${i + 1}` as keyof PostedQuestion] = '';
            }

            const correctOption = options.find(opt => opt.isCorrect);
            if (correctOption) {
                questionData.Answer = correctOption.text;
            }

            tags.forEach((tag, index) => {
                if (index < 5) {
                    questionData[`Tag ${index + 1}` as keyof PostedQuestion] = tag;
                }
            });

            const response = await updateQuestionBank(
                questionBankId,
                classroomId,
                { questions: [questionData] }
            );

            if (response.status >= 200 && response.status < 300) {
                toast.update(toastId, {
                    render: 'Question saved successfully!',
                    type: 'success',
                    isLoading: false,
                    autoClose: 3000,
                });
                resetForm();
                onClose();
                onQuestionAdded();
            } else {
                toast.update(toastId, {
                    render: 'Failed to add question. Please try again.',
                    type: 'error',
                    isLoading: false,
                    autoClose: 3000,
                });
                setError('Failed to add question. Please try again.');
            }
        } catch (err) {
            toast.update(toastId, {
                render: 'Failed to add question. Please try again.',
                type: 'error',
                isLoading: false,
                autoClose: 3000,
            });
            setError('Failed to add question. Please try again.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setQuestionText('');
        setOptions([{ text: '', isCorrect: false }]);
        setDifficulty('Medium');
        setTags([]);
        setNewTag('');
        setError('');
    };

    if (!isOpen) return null;

    return (
        <>
            <ToastContainer />
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[#3774E5]">Add New Question</h2>
                            <button
                                onClick={() => {
                                    resetForm();
                                    onClose();
                                }}
                                className="text-red-500 hover:text-red-700 text-2xl font-bold p-1 transition-colors"
                            >
                                &times;
                            </button>
                        </div>

                        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Question Text</label>
                                <textarea
                                    value={questionText}
                                    onChange={(e) => setQuestionText(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Options</label>
                                {options.map((option, index) => (
                                    <div key={index} className="flex items-center mb-2">
                                        <input
                                            type="radio"
                                            name="correctOption"
                                            checked={option.isCorrect}
                                            onChange={() => handleCorrectOptionChange(index)}
                                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            className="flex-1 p-2 border rounded mr-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                            placeholder={`Option ${index + 1}`}
                                            required
                                        />
                                        {options.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(index)}
                                                className="text-red-500 hover:text-red-700 text-xl font-bold"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {options.length < 6 && (
                                    <button
                                        type="button"
                                        onClick={addOption}
                                        className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
                                    >
                                        + Add Option
                                    </button>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Difficulty</label>
                                <div className="flex gap-2">
                                    {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                                        <button
                                            key={level}
                                            type="button"
                                            className={`px-3 py-1 rounded-full text-sm font-medium
                                                ${difficulty === level ? 
                                                    (level === 'Easy' ? 'bg-green-100 text-green-800 border border-green-300' :
                                                     level === 'Medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                                                     'bg-red-100 text-red-800 border border-red-300') :
                                                    'bg-gray-100 text-gray-800 border border-gray-300'}
                                                hover:opacity-80 transition-opacity duration-200`}
                                            onClick={() => setDifficulty(level)}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Tags (max 5)</label>
                                <div className="flex mb-2">
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        className="flex-1 p-2 border rounded mr-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                        placeholder="Add tag"
                                        maxLength={20}
                                    />
                                    <button
                                        type="button"
                                        onClick={addTag}
                                        disabled={!newTag.trim() || tags.length >= 5}
                                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="flex items-center bg-gray-200 px-2 py-1 rounded text-sm"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(index)}
                                                className="ml-1 text-gray-500 hover:text-gray-700"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetForm();
                                        onClose();
                                    }}
                                    className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Question'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddManualQuestion;