// __tests__/QuestionBankDetails.test.tsx
import React from 'react';
import {
    render,
    screen,
    waitFor,
    fireEvent,
    act,
} from '@testing-library/react';
import QuestionBankDetails from '@/app/[course_id]/questions/[bank_id]/page';
import { useAuth } from '@/context/AuthContext';
import { useRouter, notFound } from 'next/navigation';
import * as classroomSvc from '@/services/classroom';
import * as qbSvc from '@/services/question_bank';
import * as qSvc from '@/services/question';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

// ---- MOCKS ---- //
jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    notFound: jest.fn(),
}));
jest.mock('../services/classroom', () => ({
    getClassroomById: jest.fn(),
}));
jest.mock('../services/question_bank', () => ({
    getQuestionBankByID: jest.fn(),
    deleteQuestionBank: jest.fn(),
    updateQuestionBank: jest.fn(),
}));
jest.mock('../services/question', () => ({
    deleteQuestion: jest.fn(),
    updateQuestion: jest.fn(),
}));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));
jest.mock('papaparse', () => ({ parse: jest.fn() }));
jest.mock('xlsx', () => ({ read: jest.fn(), utils: { sheet_to_json: jest.fn() } }));

// Helper to resolve initial params
const params = Promise.resolve({ bank_id: '7' });

describe('QuestionBankDetails', () => {
    const push = jest.fn();
    const replace = jest.fn();
    beforeEach(() => {
        jest.resetAllMocks();

        // Authenticated user
        (useAuth).mockReturnValue({ user: { role: 'Admin' } });
        (useRouter).mockReturnValue({ push });

        // Classroom fetch OK
        (classroomSvc.getClassroomById).mockResolvedValue({
            status: 200,
            data: { name: 'CourseX' },
        });

        // Question bank fetch OK
        (qbSvc.getQuestionBankByID).mockResolvedValue({
            status: 200,
            data: {
                "question_bank_id": 3,
                "description": "Imported via upload",
                "created_at": "2025-07-04T11:37:30.000000Z",
                "name": "test_question_bank_2",
                "professor_id": 7,
                "updated_at": "2025-07-04T17:07:30.000000Z",
                "classroom_id": 4,
                "questions": [
                    {
                        "ID": "1",
                        "dbID": 100,
                        "Question": "What method adds an element to the end of an array?",
                        "Option 1": "push()",
                        "Option 2": "pop()",
                        "Option 3": "shift()",
                        "Option 4": "unshift()",
                        "Option 5": "I don't know",
                        "Option 6": " ",
                        "Answer": "push()",
                        "Difficulty": "Easy"
                    },
                    {
                        "ID": "2",
                        "dbID": 101,
                        "Question": "How do you remove the first element from an array?",
                        "Option 1": "shift()",
                        "Option 2": "unshift()",
                        "Option 3": "pop()",
                        "Option 4": "slice()",
                        "Option 5": " ",
                        "Option 6": " ",
                        "Answer": "shift()",
                        "Difficulty": "Medium"
                    },
                    {
                        "ID": "3",
                        "dbID": 102,
                        "Question": "Which function converts a JavaScript object to a JSON string?",
                        "Option 1": "JSON.stringify()",
                        "Option 2": "JSON.parse()",
                        "Option 3": "toString()",
                        "Option 4": "toJSON()",
                        "Option 5": " ",
                        "Option 6": " ",
                        "Answer": "JSON.stringify()",
                        "Difficulty": "Easy"
                    },
                    {
                        "ID": "4",
                        "dbID": 103,
                        "Question": "What keyword do you use to define a class in ES6?",
                        "Option 1": "class",
                        "Option 2": "function",
                        "Option 3": "def",
                        "Option 4": "constructor",
                        "Option 5": " ",
                        "Option 6": " ",
                        "Answer": "class",
                        "Difficulty": "Medium"
                    },
                    {
                        "ID": "5",
                        "dbID": 104,
                        "Question": "How do you create a new Promise?",
                        "Option 1": "new Promise()",
                        "Option 2": "Promise.create()",
                        "Option 3": "new promise()",
                        "Option 4": "createPromise()",
                        "Option 5": " ",
                        "Option 6": " ",
                        "Answer": "new Promise()",
                        "Difficulty": "Hard"
                    },
                    {
                        "ID": "6",
                        "dbID": 105,
                        "Question": "What does Array.prototype.filter() return?",
                        "Option 1": "A new array of filtered elements",
                        "Option 2": "Modifies the original array",
                        "Option 3": "A boolean",
                        "Option 4": "undefined",
                        "Option 5": " ",
                        "Option 6": " ",
                        "Answer": "A new array of filtered elements",
                        "Difficulty": "Medium"
                    },
                    {
                        "ID": "7",
                        "dbID": 106,
                        "Question": "Which operator is used for optional chaining?",
                        "Option 1": "?.",
                        "Option 2": "&&",
                        "Option 3": "||",
                        "Option 4": "?.",
                        "Option 5": " ",
                        "Option 6": " ",
                        "Answer": "?.",
                        "Difficulty": "Hard"
                    },
                ]
            },
        });

        // Hooks for file parsing
        (Papa.parse).mockImplementation((file, opts) => {
            opts.complete({
                data: [
                    {
                        "ID": "16",
                        "Question": "Which built-in method returns a locale-sensitive string of a Date?",
                        "Option 1": "toLocaleString()",
                        "Option 2": "toString()",
                        "Option 3": "format()",
                        "Option 4": "localeDate()",
                        "Option 5": " ",
                        "Option 6": " ",
                        "Answer": "toLocaleString()",
                        "Difficulty": "Hard"
                    }
                ]
            });
        });
        XLSX.read.mockReturnValue({ SheetNames: ['S'], Sheets: { S: {} } });
        XLSX.utils.sheet_to_json.mockReturnValue([
            { Question: 'XLS1', Answer: 'B', Difficulty: 'Medium', 'Option 1': 'B' }
        ]);

        // Spy on reload/replace
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { pathname: '/99/questions/7', replace, reload: jest.fn() },
        });
    });

    it('shows loading when not authenticated', async () => {
        (useAuth).mockReturnValue({ user: null });
        await act(async () => {
            render(<QuestionBankDetails params={params} />);
        });
        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('renders table after fetch', async () => {
        await act(async () => {
            render(<QuestionBankDetails params={params} />);
        });
        await waitFor(() => screen.getByTestId('ct3-table'));
        expect(screen.getByText('What method adds an element to the end of an array?')).toBeInTheDocument();
    });

    it('filters questions via search', async () => {
        await act(async () => {
            render(<QuestionBankDetails params={params} />);
        });
        await waitFor(() => screen.getByTestId('ct3-table'));
        fireEvent.change(screen.getByTestId('header-search'), { target: { value: 'no-match' } });
        expect(screen.queryByText('What method adds an element to the end of an array?')).toBeNull();
    });

    it('edits a question and saves successfully', async () => {
        (qSvc.updateQuestion).mockResolvedValue({ status: 200 });
        await act(async () => {
            render(<QuestionBankDetails params={params} />);
        });
        await waitFor(() => screen.getByTestId('ct3-table'));
        fireEvent.click(screen.getAllByTestId('row-edit-button')[0]);
        // textarea appears with existing text
        fireEvent.change(screen.getByTestId('question-textarea'), { target: { value: 'Q1-edited' } });
        fireEvent.click(screen.getByText('Save'));
        await waitFor(() => {
            expect(window.location.reload).toHaveBeenCalled();
        });
    });

    it('deletes a question', async () => {
        (qSvc.deleteQuestion).mockResolvedValue({ status: 200 });
        await act(async () => {
            render(<QuestionBankDetails params={params} />);
        });
        await waitFor(() => screen.getByTestId('ct3-table'));
        fireEvent.click(screen.getAllByTestId('row-delete-button')[0]);
        await waitFor(() => {
            expect(window.location.reload).toHaveBeenCalled();
        });
    });

    it('edits bank details', async () => {
        (qbSvc.updateQuestionBank).mockResolvedValue({ status: 200 });
        await act(async () => {
            render(<QuestionBankDetails params={params} />);
        });
        fireEvent.click(screen.getByTestId('options-button'));
        fireEvent.click(screen.getByTestId('edit-qb-button'));
        // inputs for name & desc
        fireEvent.click(screen.getByText('Save', { selector: 'button' }));
        await waitFor(() => {
            expect(window.location.reload).toHaveBeenCalled();
        });
    });

    it('deletes the bank', async () => {
        (qbSvc.deleteQuestionBank).mockResolvedValue({ status: 200 });
        await act(async () => {
            render(<QuestionBankDetails params={params} />);
        });
        fireEvent.click(screen.getByTestId('options-button'));
        fireEvent.click(screen.getByTestId('delete-qb-button'));
        await waitFor(() => {
            expect(window.location.replace).toHaveBeenCalledWith('/99/questions');
        });
    });
});
