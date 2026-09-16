import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PencilIcon, XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { updateQuestion } from '@/services/question';

interface EditQuestionModalProps {
    question: {
        question_id: number;
        question_text: string;
        difficulty_level: number;
        options: Array<{
            letter: string;
            text: string;
            is_correct: boolean;
        }>;
        tags: string[];
    };
    isOpen: boolean;
    onClose: () => void;
    onQuestionUpdated: () => void;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
    question,
    isOpen,
    onClose,
    onQuestionUpdated
}) => {
    const [questionText, setQuestionText] = useState(question.question_text);
    const [options, setOptions] = useState(question.options);
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(
        question.difficulty_level === 1 ? 'Easy' :
            question.difficulty_level === 2 ? 'Medium' : 'Hard'
    );
    const [tags, setTags] = useState(question.tags);
    const [newTag, setNewTag] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setQuestionText(question.question_text);
            setOptions(question.options);
            setDifficulty(
                question.difficulty_level === 1 ? 'Easy' :
                    question.difficulty_level === 2 ? 'Medium' : 'Hard'
            );
            setTags(question.tags);
            setNewTag('');
        }
    }, [isOpen, question]);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    const handleCorrectOptionChange = (index: number) => {
        const newOptions = options.map((opt, i) => ({
            ...opt,
            is_correct: i === index,
        }));
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 6) {
            const newLetter = String.fromCharCode(65 + options.length);
            setOptions([...options, { letter: newLetter, text: '', is_correct: false }]);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 1) {
            const newOptions = options.filter((_, i) => i !== index);
            if (options[index].is_correct && newOptions.length > 0) {
                newOptions[0].is_correct = true;
            }
            setOptions(newOptions);
        } else {
            toast.warning('A question must have at least one option');
        }
    };

    const addTag = () => {
        if (newTag.trim() && tags.length < 5) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        } else if (tags.length >= 5) {
            toast.warning('Maximum of 5 tags allowed per question');
        }
    };

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate question text
        if (!questionText.trim()) {
            toast.error('Question text cannot be empty');
            return;
        }

        // Validate options
        const hasEmptyOption = options.some(opt => !opt.text.trim());
        if (hasEmptyOption) {
            toast.error('All options must have text');
            return;
        }

        const hasCorrectOption = options.some(opt => opt.is_correct);
        if (!hasCorrectOption) {
            toast.error('Please select a correct answer');
            return;
        }

        try {
            setIsSubmitting(true);

            // Prepare data for API
            const updateData: any = {
                Question: questionText,
                Difficulty: difficulty,
                Answer: options.find(opt => opt.is_correct)?.text || '',
                tags: tags
            };

            // Add options to the data
            options.forEach((option, index) => {
                updateData[`Option ${index + 1}`] = option.text;
            });

            // Fill empty options if less than 6
            for (let i = options.length; i < 6; i++) {
                updateData[`Option ${i + 1}`] = '';
            }

            // Call the update API
            const response = await updateQuestion(question.question_id, updateData);

            if (response.status >= 200 && response.status < 300) {
                toast.success('Question updated successfully');
                onQuestionUpdated();
                onClose();
            } else {
                toast.error('Failed to update question');
            }
        } catch (error) {
            toast.error('An error occurred while updating the question');
            console.error(error);
        } finally {
            setIsSubmitting(false);
            window.location.reload();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 transform transition-all duration-300 scale-95">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-[#3774E5]">Edit Question</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                            aria-label="Close"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-gray-700 font-medium">Question Text</label>
                            <textarea
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200 resize-none"
                                rows={3}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-700 font-medium">Options</label>
                            <div className="space-y-3">
                                {options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleCorrectOptionChange(index)}
                                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                                                ${option.is_correct
                                                    ? 'border-green-500 bg-green-100'
                                                    : 'border-gray-300 hover:border-blue-400'}`}
                                        >
                                            {option.is_correct && (
                                                <div className="w-2 h-2 rounded-full bg-[#3774E5]"></div>
                                            )}
                                        </button>
                                        <input
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200"
                                            placeholder={`Option ${option.letter}`}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                            title="Remove option"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                                {options.length < 6 && (
                                    <button
                                        type="button"
                                        onClick={addOption}
                                        className="mt-2 flex items-center gap-1 text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Add Option
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-700 font-medium">Difficulty</label>
                            <div className="flex gap-3">
                                {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setDifficulty(level)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105
                                            ${difficulty === level ?
                                                (level === 'Easy' ? 'bg-green-100 text-green-800 shadow-green-sm' :
                                                    level === 'Medium' ? 'bg-yellow-100 text-yellow-800 shadow-yellow-sm' :
                                                        'bg-red-100 text-red-800 shadow-red-sm') :
                                                'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                                            shadow-sm border border-transparent hover:border-gray-300`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-700 font-medium">Tags (max 5)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200"
                                    placeholder="Add tag and press Enter"
                                    maxLength={20}
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    disabled={!newTag.trim() || tags.length >= 5}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-600 transition-all duration-200 flex items-center gap-1"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tags.map((tag, index) => {
                                    const colors = [
                                        'bg-blue-100 text-blue-800',
                                        'bg-green-100 text-green-800',
                                        'bg-yellow-100 text-yellow-800',
                                        'bg-purple-100 text-purple-800',
                                        'bg-pink-100 text-pink-800'
                                    ];
                                    const colorClass = colors[index % colors.length];
                                    return (
                                        <span
                                            key={index}
                                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(index)}
                                                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium flex items-center gap-1 disabled:opacity-70"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditQuestionModal;