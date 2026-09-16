import React, { useState } from 'react';
import { deleteQuestion } from '@/services/question';
import { toast } from 'react-toastify';
import { PencilIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import EditQuestionModal from './EditQuestionModal';

interface Question {
    ID: string;
    dbID: number;
    Question: string;
    Difficulty: string;
    'Option 1'?: string;
    'Option 2'?: string;
    'Option 3'?: string;
    'Option 4'?: string;
    'Option 5'?: string;
    'Option 6'?: string;
    'Tag 1'?: string;
    'Tag 2'?: string;
    'Tag 3'?: string;
    'Tag 4'?: string;
    'Tag 5'?: string;
    [key: string]: any;
}

interface QuestionBankData {
    question_bank_id: number;
    description: string;
    created_at: string;
    name: string;
    professor_id: number;
    questions: Question[];
    updated_at: string;
}

interface QuestionDataTableProps {
    data: QuestionBankData;
    classroomId: number;
    onQuestionDeleted: () => void;
}

const QuestionDataTable: React.FC<QuestionDataTableProps> = ({
    data,
    classroomId,
    onQuestionDeleted
}) => {
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const handleView = (question: Question) => {
        setSelectedQuestion(question);
        setViewModalOpen(true);
    };

    const handleEdit = (question: Question) => {
        setSelectedQuestion(question);
        setEditModalOpen(true);
    };

    const openDeleteModal = (question: Question) => {
        setSelectedQuestion(question);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedQuestion) return;

        setIsDeleting(true);
        try {
            const response = await deleteQuestion(selectedQuestion.dbID);
            if (response.deleted) {
                toast.success("Question deleted successfully");
                onQuestionDeleted();
            } else {
                toast.error("Failed to delete question");
            }
        } catch (error) {
            toast.error("An error occurred while deleting the question");
            console.error(error);
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setSelectedQuestion(null);
        }
    };

    const handleQuestionUpdated = () => {
        toast.success('Question updated successfully');
        // You might want to add a callback prop similar to onQuestionDeleted
        // to refresh the question list after editing
        onQuestionDeleted(); // Reusing this for now to refresh the list
        setEditModalOpen(false);
    };

    const getTags = (question: Question) => {
        const tags = [];
        for (let i = 1; i <= 5; i++) {
            const tagKey = `Tag ${i}` as keyof Question;
            if (question[tagKey]) {
                tags.push(question[tagKey]);
            }
        }
        return tags.join(', ');
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy':
                return 'bg-green-100 text-green-800';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'Hard':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getOptions = (question: Question) => {
        const options = [];
        for (let i = 1; i <= 6; i++) {
            const optionKey = `Option ${i}` as keyof Question;
            if (question[optionKey] && question[optionKey].trim() !== '') {
                options.push({
                    letter: String.fromCharCode(64 + i),
                    text: question[optionKey],
                    isCorrect: question.Answer === question[optionKey]
                });
            }
        }
        return options;
    };

    return (
        <>
            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                #
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Question
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Difficulty
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tags
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.questions.map((question, index) => (
                            <tr key={question.dbID}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {index + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 max-w-xs">
                                    {question.Question}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyColor(question.Difficulty)}`}>
                                        {question.Difficulty}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                                    {getTags(question)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleView(question)}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="View"
                                        >
                                            <EyeIcon className="h-5 w-5" data-onboarding={`view-questionBankDetails-${index}`} />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(question)}
                                            className="text-yellow-600 hover:text-yellow-900"
                                            title="Edit"
                                        >
                                            <PencilIcon className="h-5 w-5" data-onboarding={`edit-questionBankDetails-${index}`} />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(question)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Delete"
                                        >
                                            <TrashIcon className="h-5 w-5" data-onboarding={`delete-questionBankDetails-${index}`} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* View Question Modal */}
            {viewModalOpen && selectedQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center ">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-[#3774E5]">Question Details</h2>
                                <button
                                    onClick={() => setViewModalOpen(false)}
                                    className="text-red-500 hover:text-red-700 text-2xl font-bold p-1 transition-colors"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-lg font-semibold mb-2">Question Text</h3>
                                <p className="p-2 bg-gray-50 rounded">{selectedQuestion.Question}</p>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-lg font-semibold mb-2">Options</h3>
                                <div className="space-y-2">
                                    {getOptions(selectedQuestion).map((option) => (
                                        <div
                                            key={option.letter}
                                            className={`p-3 border rounded flex items-center ${option.isCorrect
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200'
                                                }`}
                                        >
                                            <span className="font-medium mr-2">{option.letter}.</span>
                                            <span>{option.text}</span>
                                            {option.isCorrect && (
                                                <span className="ml-auto text-green-600 font-medium">✓ Correct</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-lg font-semibold mb-2">Difficulty</h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedQuestion.Difficulty)}`}>
                                    {selectedQuestion.Difficulty}
                                </span>
                            </div>

                            {getTags(selectedQuestion) && (
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold mb-2">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {getTags(selectedQuestion).split(', ').map((tag, index) => (
                                            <span key={index} className="bg-gray-200 px-2 py-1 rounded text-sm">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => setViewModalOpen(false)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/*edit modal*/}
            {editModalOpen && selectedQuestion && (
                <EditQuestionModal
                    question={{
                        question_id: selectedQuestion.dbID,
                        question_text: selectedQuestion.Question,
                        difficulty_level: selectedQuestion.Difficulty === 'Easy' ? 1 :
                            selectedQuestion.Difficulty === 'Medium' ? 2 : 3,
                        options: getOptions(selectedQuestion).map(opt => ({
                            letter: opt.letter,
                            text: opt.text,
                            is_correct: opt.isCorrect
                        })),
                        tags: getTags(selectedQuestion).split(', ').filter(tag => tag)
                    }}
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    onQuestionUpdated={handleQuestionUpdated}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && selectedQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-[#3774E5]">Confirm Deletion</h2>
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="text-red-500 hover:text-red-700 text-2xl font-bold p-1 transition-colors"
                                >
                                    &times;
                                </button>
                            </div>

                            <p className="mb-6">Are you sure you want to delete this question? This action cannot be undone.</p>

                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default QuestionDataTable;