/**
 * __tests__/QuestionBankPage.test.jsx
 */
import React from 'react';
import {
    render,
    screen,
    waitFor,
    fireEvent,
    act,
} from '@testing-library/react';
import QuestionBankPage from '../app/[course_id]/questions/page';
import { useAuth } from '../context/AuthContext';
import * as classroomSvc from '../services/classroom';
import * as qbSvc from '../services/question_bank';
import { useRouter, notFound } from 'next/navigation';
import { toast } from 'react-hot-toast';

// --- MOCKS --- //

// Auth
jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
// Router + notFound
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    notFound: jest.fn(),
}));
// Classroom services
jest.mock('../services/classroom', () => ({
    getClassroomById: jest.fn(),
}));
// Question bank services
jest.mock('../services/question_bank', () => ({
    listQuestionBanks: jest.fn(),
    createQuestionBank: jest.fn(),
}));
// Toast
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

// Mock Papa.parse to synchronously call complete()
jest.mock('papaparse', () => ({
    parse: (file, opts) => {
        opts.complete({
            data: [
                { Difficulty: 'Easy', dbID: 1, Question: 'Q1', Answer: 'A', 'Option 1': 'A' }
            ]
        });
    }
}));

describe('QuestionBankPage', () => {
    const push = jest.fn();
    const reload = jest.fn();

    beforeEach(async () => {
        jest.resetAllMocks();

        // Authenticated user
        useAuth.mockReturnValue({ user: { role: 'Admin' } });
        // Router
        useRouter.mockReturnValue({ push });
        // Fake location.reload
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { pathname: '/course/99/questions', reload },
        });
        // Classroom fetch OK
        classroomSvc.getClassroomById.mockResolvedValue({
            status: 200,
            data: { name: 'TestCourse' },
        });
    });

    it('calls notFound if classroom fetch fails', async () => {
        classroomSvc.getClassroomById.mockRejectedValue(new Error('fail'));
        await act(async () => {
            render(<QuestionBankPage params={Promise.resolve({ course_id: '99' })} />);
        });
        await waitFor(() => {
            expect(notFound).toHaveBeenCalled();
        });
    });

    it('displays existing question banks when none files are uploaded', async () => {
        // listQuestionBanks returns two banks
        qbSvc.listQuestionBanks.mockResolvedValue({
            status: 200,
            data: [
                {
                    "question_bank_id": 3,
                    "description": "Imported via upload",
                    "created_at": "2025-07-04T11:37:30.000000Z",
                    "name": "test_question_bank_2",
                    "professor_id": 7,
                    "updated_at": "2025-07-04T17:07:30.000000Z",
                    "classroom_id": 4,
                    "questions_count": 40,
                    "test_question_bank_2": [
                        {
                            "ID": "1",
                            "dbID": 100,
                            "Question": "What method adds an element to the end of an array?",
                            "Difficulty": "Easy"
                        },
                        {
                            "ID": "2",
                            "dbID": 101,
                            "Question": "How do you remove the first element from an array?",
                            "Difficulty": "Medium"
                        },
                        {
                            "ID": "3",
                            "dbID": 102,
                            "Question": "Which function converts a JavaScript object to a JSON string?",
                            "Difficulty": "Easy"
                        }
                    ]
                },
                {
                    "question_bank_id": 4,
                    "description": "Imported via upload",
                    "created_at": "2025-07-04T11:37:30.000000Z",
                    "name": "test_question_bank_3",
                    "professor_id": 7,
                    "updated_at": "2025-07-04T17:07:30.000000Z",
                    "classroom_id": 4,
                    "questions_count": 20,
                    "test_question_bank_3": [
                        {
                            "ID": "1",
                            "dbID": 120,
                            "Question": "What is the type of Symbol('id')?",
                            "Difficulty": "Easy"
                        },
                        {
                            "ID": "2",
                            "dbID": 121,
                            "Question": "How do you combine two objects obj1 and obj2 into a new object?",
                            "Difficulty": "Medium"
                        },
                        {
                            "ID": "3",
                            "dbID": 122,
                            "Question": "How do you create a shallow copy of an array arr?",
                            "Difficulty": "Medium"
                        }
                    ]
                }
            ],
        });

        await act(async () => {
            render(<QuestionBankPage params={Promise.resolve({ course_id: '99' })} />);
        });

        // Wait for banks to load
        await waitFor(() => screen.getAllByTestId('bank-name'));
        const banks = screen.getAllByTestId('bank-name');
        expect(banks.length).toEqual(2);
    });

    it('filters question banks via search input', async () => {
        qbSvc.listQuestionBanks.mockResolvedValue({
            status: 200,
            data: [
                {
                    "question_bank_id": 3,
                    "description": "Imported via upload",
                    "created_at": "2025-07-04T11:37:30.000000Z",
                    "name": "test_question_bank_2",
                    "professor_id": 7,
                    "updated_at": "2025-07-04T17:07:30.000000Z",
                    "classroom_id": 4,
                    "questions_count": 40,
                    "test_question_bank_2": [
                        {
                            "ID": "1",
                            "dbID": 100,
                            "Question": "What method adds an element to the end of an array?",
                            "Difficulty": "Easy"
                        },
                        {
                            "ID": "2",
                            "dbID": 101,
                            "Question": "How do you remove the first element from an array?",
                            "Difficulty": "Medium"
                        },
                        {
                            "ID": "3",
                            "dbID": 102,
                            "Question": "Which function converts a JavaScript object to a JSON string?",
                            "Difficulty": "Easy"
                        }
                    ]
                },
                {
                    "question_bank_id": 4,
                    "description": "Imported via upload",
                    "created_at": "2025-07-04T11:37:30.000000Z",
                    "name": "test_question_bank_3",
                    "professor_id": 7,
                    "updated_at": "2025-07-04T17:07:30.000000Z",
                    "classroom_id": 4,
                    "questions_count": 20,
                    "test_question_bank_3": [
                        {
                            "ID": "1",
                            "dbID": 120,
                            "Question": "What is the type of Symbol('id')?",
                            "Difficulty": "Easy"
                        },
                        {
                            "ID": "2",
                            "dbID": 121,
                            "Question": "How do you combine two objects obj1 and obj2 into a new object?",
                            "Difficulty": "Medium"
                        },
                        {
                            "ID": "3",
                            "dbID": 122,
                            "Question": "How do you create a shallow copy of an array arr?",
                            "Difficulty": "Medium"
                        }
                    ]
                }
            ],
        });

        await act(async () => {
            render(<QuestionBankPage params={Promise.resolve({ course_id: '99' })} />);
        });
        await waitFor(() => screen.getAllByTestId('bank'));

        fireEvent.change(screen.getByTestId('header-search'), { target: { value: 'test_question_bank_2' } });
        expect(screen.getAllByTestId('bank')).toHaveLength(1);
    });

    it('opens file dialog when Add New is clicked', async () => {
        qbSvc.listQuestionBanks.mockResolvedValue({ status: 200, data: [] });

        await act(async () => {
            render(<QuestionBankPage params={Promise.resolve({ course_id: '99' })} />);
        });
        await waitFor(() => screen.getByText('Add New'));

        const fileInput = document.querySelector('input[type="file"]');
        fileInput.click = jest.fn();

        fireEvent.click(screen.getByText('Add New'));
        expect(fileInput.click).toHaveBeenCalled();
    });

    it('saves all banks on Save All click', async () => {
        qbSvc.listQuestionBanks.mockResolvedValue({ status: 200, data: [] });

        await act(async () => {
            render(<QuestionBankPage params={Promise.resolve({ course_id: '99' })} />);
        });
        await waitFor(() => screen.getByText('Add New'));

        // add a file
        const file = new File(['dummy'], 'one.csv', { type: 'text/csv' });
        const input = document.querySelector('input[type="file"]');
        await act(async () => {
            fireEvent.change(input, { target: { files: [file] } });
        });
        await waitFor(() => screen.getByTestId('preview'));

        // mock createQuestionBank
        qbSvc.createQuestionBank.mockResolvedValue({ status: 200 });

        // click Save All
        fireEvent.click(screen.getByText('Save All'));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                'Question Bank(s) Saved Successfully',
                expect.any(Object)
            );
            expect(reload).toHaveBeenCalled();
        });
    });
});
