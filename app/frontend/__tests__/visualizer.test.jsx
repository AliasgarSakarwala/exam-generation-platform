// __tests__/DatabaseVisualizer.test.tsx
import React from 'react';
import {
    render,
    screen,
    waitFor,
    fireEvent,
    act,
} from '@testing-library/react';
import DatabaseVisualizer from '../app/visualizer/page';
import { useAuth } from '../context/AuthContext';
import { useRouter, notFound } from 'next/navigation';
import { getTables } from '../services/visualizer';
import toast from 'react-hot-toast';

// Mock services
jest.mock('../services/visualizer', () => ({ getTables: jest.fn() }));

// Mock context & router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    notFound: jest.fn(),
}));
jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));

// Mock toast
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { error: jest.fn() } }));

describe('DatabaseVisualizer', () => {
    const push = jest.fn();
    let originalCreateObjectURL;
    let originalRevokeObjectURL;

    beforeAll(() => {
        // Spy on URL.createObjectURL
        originalCreateObjectURL = URL.createObjectURL;
        originalRevokeObjectURL = URL.revokeObjectURL;
        Object.defineProperty(URL, 'createObjectURL', {
            writable: true,
            value: jest.fn(() => 'blob:fake'),
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            writable: true,
            value: jest.fn(),
        });
    });

    afterAll(() => {
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
    });

    beforeEach(() => {
        jest.resetAllMocks();
        useRouter.mockReturnValue({ push });
    });

    it('shows loading when user not authenticated', () => {
        useAuth.mockReturnValue({ user: null });
        render(<DatabaseVisualizer />);
        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('calls notFound for non-admin user', async () => {
        useAuth.mockReturnValue({ user: { role: 'User' } });
        // Make getTables resolve immediately
        getTables.mockResolvedValue({ status: 200, data: { data: {} } });
        render(<DatabaseVisualizer />);
        // wait effect
        await act(async () => { });
        expect(notFound).toHaveBeenCalled();
    });

    it('shows error toast on fetch failure', async () => {
        useAuth.mockReturnValue({ user: { role: 'Admin' } });
        getTables.mockRejectedValue(new Error('fail'));
        render(<DatabaseVisualizer />);
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
            'Failed to load tables ❌',
            expect.objectContaining({ position: "bottom-center" })
        ));
    });

    it('renders stats, table and supports dark mode toggle', async () => {
        useAuth.mockReturnValue({ user: { role: 'Admin' } });

        const tablesData = {
            "classroom": {
                "headers": [
                    "classroom_id",
                    "name",
                    "code",
                    "description",
                    "professor_id",
                    "is_archived",
                    "end_date",
                    "student_count",
                    "created_at",
                    "updated_at",
                    "class_colour"
                ],
                "rows": [
                    {
                        "classroom_id": 2,
                        "name": "Database Systems",
                        "code": "CS320",
                        "description": "Relational database design",
                        "professor_id": 3,
                        "is_archived": false,
                        "end_date": "2025-12-20",
                        "student_count": 30,
                        "created_at": "2025-07-03 12:36:51.137424+05:30",
                        "updated_at": null,
                        "class_colour": "#CCCCFF"
                    },
                    {
                        "classroom_id": 3,
                        "name": "Advanced Algorithms",
                        "code": "CS450",
                        "description": "Algorithm analysis and design",
                        "professor_id": 2,
                        "is_archived": true,
                        "end_date": "2025-05-15",
                        "student_count": 25,
                        "created_at": "2025-07-03 12:36:51.137424+05:30",
                        "updated_at": null,
                        "class_colour": "#CCCCFF"
                    },
                    {
                        "classroom_id": 4,
                        "name": "Intro to Javascript",
                        "code": "111",
                        "description": null,
                        "professor_id": 6,
                        "is_archived": false,
                        "end_date": "2025-08-29",
                        "student_count": 0,
                        "created_at": "2025-07-03 12:40:42.862245+05:30",
                        "updated_at": null,
                        "class_colour": "#d92222"
                    },
                    {
                        "classroom_id": 1,
                        "name": "Introduction to Computer Science",
                        "code": "CS101",
                        "description": "Basic programming concepts",
                        "professor_id": 2,
                        "is_archived": false,
                        "end_date": "2025-12-15",
                        "student_count": 50,
                        "created_at": "2025-07-03 12:36:51.137424+05:30",
                        "updated_at": null,
                        "class_colour": "#CCCCFF"
                    }
                ],
                "total": 4,
                "columns_meta": [
                    {
                        "column_name": "classroom_id",
                        "data_type": "integer",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "name",
                        "data_type": "character varying",
                        "character_maximum_length": 100,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "code",
                        "data_type": "character varying",
                        "character_maximum_length": 20,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "description",
                        "data_type": "text",
                        "character_maximum_length": null,
                        "is_nullable": "YES"
                    },
                    {
                        "column_name": "professor_id",
                        "data_type": "integer",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "is_archived",
                        "data_type": "boolean",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "end_date",
                        "data_type": "date",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "student_count",
                        "data_type": "integer",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "created_at",
                        "data_type": "timestamp with time zone",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "updated_at",
                        "data_type": "timestamp with time zone",
                        "character_maximum_length": null,
                        "is_nullable": "YES"
                    },
                    {
                        "column_name": "class_colour",
                        "data_type": "character varying",
                        "character_maximum_length": 7,
                        "is_nullable": "NO"
                    }
                ]
            },
            "professor": {
                "headers": [
                    "user_id",
                    "created_at"
                ],
                "rows": [
                    {
                        "user_id": 2,
                        "created_at": "2025-07-03 12:36:51.13579+05:30"
                    },
                    {
                        "user_id": 3,
                        "created_at": "2025-07-03 12:36:51.13579+05:30"
                    },
                    {
                        "user_id": 6,
                        "created_at": "2025-07-03 12:40:42.85892+05:30"
                    }
                ],
                "total": 3,
                "columns_meta": [
                    {
                        "column_name": "user_id",
                        "data_type": "integer",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "created_at",
                        "data_type": "timestamp with time zone",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    }
                ]
            },
            "question_bank": {
                "headers": [
                    "question_bank_id",
                    "description",
                    "created_at",
                    "name",
                    "professor_id",
                    "updated_at",
                    "classroom_id"
                ],
                "rows": [
                    {
                        "question_bank_id": 3,
                        "description": "Imported via upload",
                        "created_at": "2025-07-04 17:07:30+05:30",
                        "name": "test_question_bank_2",
                        "professor_id": 7,
                        "updated_at": "2025-07-04 17:07:30",
                        "classroom_id": 4
                    },
                    {
                        "question_bank_id": 4,
                        "description": "Imported via upload",
                        "created_at": "2025-07-04 17:07:30+05:30",
                        "name": "test_question_bank_3",
                        "professor_id": 7,
                        "updated_at": "2025-07-04 17:07:30",
                        "classroom_id": 4
                    },
                    {
                        "question_bank_id": 5,
                        "description": "Imported via upload",
                        "created_at": "2025-07-04 17:07:30+05:30",
                        "name": "test_question_bank_4",
                        "professor_id": 7,
                        "updated_at": "2025-07-04 17:07:30",
                        "classroom_id": 4
                    },
                    {
                        "question_bank_id": 6,
                        "description": "Imported via upload",
                        "created_at": "2025-07-04 19:39:04+05:30",
                        "name": "test_question_bank_4",
                        "professor_id": 7,
                        "updated_at": "2025-07-04 19:39:04",
                        "classroom_id": 4
                    },
                    {
                        "question_bank_id": 7,
                        "description": "Imported via upload",
                        "created_at": "2025-07-04 19:39:04+05:30",
                        "name": "test_question_bank_3",
                        "professor_id": 7,
                        "updated_at": "2025-07-04 19:39:04",
                        "classroom_id": 4
                    },
                    {
                        "question_bank_id": 8,
                        "description": "Imported via upload",
                        "created_at": "2025-07-04 19:39:04+05:30",
                        "name": "test_question_bank_2",
                        "professor_id": 7,
                        "updated_at": "2025-07-04 19:39:04",
                        "classroom_id": 4
                    },
                    {
                        "question_bank_id": 9,
                        "description": "Imported via upload",
                        "created_at": "2025-07-05 23:05:09+05:30",
                        "name": "Midterm 1 Bank",
                        "professor_id": 6,
                        "updated_at": "2025-07-05 23:05:09",
                        "classroom_id": 4
                    }
                ],
                "total": 7,
                "columns_meta": [
                    {
                        "column_name": "question_bank_id",
                        "data_type": "integer",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "description",
                        "data_type": "text",
                        "character_maximum_length": null,
                        "is_nullable": "YES"
                    },
                    {
                        "column_name": "created_at",
                        "data_type": "timestamp with time zone",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "name",
                        "data_type": "character varying",
                        "character_maximum_length": 255,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "professor_id",
                        "data_type": "bigint",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "updated_at",
                        "data_type": "timestamp without time zone",
                        "character_maximum_length": null,
                        "is_nullable": "YES"
                    },
                    {
                        "column_name": "classroom_id",
                        "data_type": "bigint",
                        "character_maximum_length": null,
                        "is_nullable": "YES"
                    }
                ]
            },
            "student": {
                "headers": [
                    "student_id",
                    "first_name",
                    "last_name",
                    "is_active",
                    "created_at"
                ],
                "rows": [
                    {
                        "student_id": 1001,
                        "first_name": "Alice",
                        "last_name": "Johnson",
                        "is_active": true,
                        "created_at": "2025-07-03 12:36:51.138848+05:30"
                    },
                    {
                        "student_id": 1002,
                        "first_name": "Bob",
                        "last_name": "Williams",
                        "is_active": true,
                        "created_at": "2025-07-03 12:36:51.138848+05:30"
                    },
                    {
                        "student_id": 1003,
                        "first_name": "Charlie",
                        "last_name": "Brown",
                        "is_active": true,
                        "created_at": "2025-07-03 12:36:51.138848+05:30"
                    },
                    {
                        "student_id": 1004,
                        "first_name": "Diana",
                        "last_name": "Miller",
                        "is_active": false,
                        "created_at": "2025-07-03 12:36:51.138848+05:30"
                    },
                    {
                        "student_id": 1005,
                        "first_name": "Ethan",
                        "last_name": "Davis",
                        "is_active": true,
                        "created_at": "2025-07-03 12:36:51.138848+05:30"
                    },
                    {
                        "student_id": 12346,
                        "first_name": "Samyak",
                        "last_name": "Jain",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12347,
                        "first_name": "Sahil",
                        "last_name": "Chawla",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12348,
                        "first_name": "Ali",
                        "last_name": "Afoud",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12349,
                        "first_name": "Aliasgar",
                        "last_name": "Sakarwala",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12350,
                        "first_name": "Arjun",
                        "last_name": "Sampat",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12351,
                        "first_name": "Christian",
                        "last_name": "Eziekwu",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12352,
                        "first_name": "Cooper",
                        "last_name": "Ross",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12353,
                        "first_name": "John",
                        "last_name": "Smith",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12354,
                        "first_name": "Jane",
                        "last_name": "Doe",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12355,
                        "first_name": "Jacob",
                        "last_name": "Mathew",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12357,
                        "first_name": "Robert",
                        "last_name": "De Niro",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12358,
                        "first_name": "Jill",
                        "last_name": "Hitchins",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12359,
                        "first_name": "Jackie",
                        "last_name": "Chan",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12360,
                        "first_name": "Chris",
                        "last_name": "Evans",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12361,
                        "first_name": "Chris",
                        "last_name": "Pratt",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12362,
                        "first_name": "James",
                        "last_name": "Rodriguez",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12363,
                        "first_name": "Willy",
                        "last_name": "Wonka",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12364,
                        "first_name": "Jill",
                        "last_name": "Goodacre",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12365,
                        "first_name": "People",
                        "last_name": "Person",
                        "is_active": true,
                        "created_at": "2025-07-03 16:26:18.513712+05:30"
                    },
                    {
                        "student_id": 12345,
                        "first_name": "Johnny",
                        "last_name": "Depp",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    },
                    {
                        "student_id": 12356,
                        "first_name": "Tammy",
                        "last_name": "Wilkerson",
                        "is_active": true,
                        "created_at": "2025-07-03 15:36:07.883709+05:30"
                    }
                ],
                "total": 26,
                "columns_meta": [
                    {
                        "column_name": "student_id",
                        "data_type": "integer",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "first_name",
                        "data_type": "character varying",
                        "character_maximum_length": 50,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "last_name",
                        "data_type": "character varying",
                        "character_maximum_length": 50,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "is_active",
                        "data_type": "boolean",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    },
                    {
                        "column_name": "created_at",
                        "data_type": "timestamp with time zone",
                        "character_maximum_length": null,
                        "is_nullable": "NO"
                    }
                ]
            }
        };
        getTables.mockResolvedValue({ status: 200, data: { data: tablesData } });

        render(<DatabaseVisualizer />);
        // Should show loading initially
        expect(screen.getByTestId('loading')).toBeInTheDocument();

        // Wait for DataTable
        await waitFor(() => screen.getByTestId('datatable-0'));

        // Stats cards: Tables Loaded = 2, Total Records = 5
        expect(screen.getByTestId('viz-tables-loaded')).toHaveTextContent('4');
        expect(screen.getByTestId('viz-total-records')).toHaveTextContent('40');

        expect(screen.getByText('classroom')).toBeInTheDocument();
        expect(screen.getByText('student')).toBeInTheDocument();

        // Toggle dark mode
        const toggleBtn = screen.getByTitle('Switch to dark mode');
        const container = screen.getByTestId('viz');
        fireEvent.click(toggleBtn);
        expect(container).toHaveClass('bg-gray-900');

        // Now title button shows 'Switch to light mode' title
        expect(screen.getByTitle('Switch to light mode')).toBeInTheDocument();
    });

    it('filters tables via search and shows no-results UI', async () => {
        useAuth.mockReturnValue({ user: { role: 'Admin' } });

        const tablesData = { OnlyTable: { total: 1, headers: ['a'], rows: [{ a: 'v' }] } };
        getTables.mockResolvedValue({ status: 200, data: { data: tablesData } });

        render(<DatabaseVisualizer />);
        await waitFor(() => screen.getByTestId('datatable-0'));

        // Type non-matching
        const input = screen.getByPlaceholderText('Search tables...');
        fireEvent.change(input, { target: { value: 'XYZ' } });
        expect(screen.getByText(/No matching tables found/i)).toBeInTheDocument();
    });

    // it('allows exporting CSV', async () => {
    //     jest.useFakeTimers();
    //     useAuth.mockReturnValue({ user: { role: 'Admin' } });

    //     const tablesData = {
    //         "classroom": {
    //             "headers": [
    //                 "classroom_id",
    //                 "name",
    //                 "code",
    //                 "description",
    //                 "professor_id",
    //                 "is_archived",
    //                 "end_date",
    //                 "student_count",
    //                 "created_at",
    //                 "updated_at",
    //                 "class_colour"
    //             ],
    //             "rows": [
    //                 {
    //                     "classroom_id": 2,
    //                     "name": "Database Systems",
    //                     "code": "CS320",
    //                     "description": "Relational database design",
    //                     "professor_id": 3,
    //                     "is_archived": false,
    //                     "end_date": "2025-12-20",
    //                     "student_count": 30,
    //                     "created_at": "2025-07-03 12:36:51.137424+05:30",
    //                     "updated_at": null,
    //                     "class_colour": "#CCCCFF"
    //                 },
    //                 {
    //                     "classroom_id": 3,
    //                     "name": "Advanced Algorithms",
    //                     "code": "CS450",
    //                     "description": "Algorithm analysis and design",
    //                     "professor_id": 2,
    //                     "is_archived": true,
    //                     "end_date": "2025-05-15",
    //                     "student_count": 25,
    //                     "created_at": "2025-07-03 12:36:51.137424+05:30",
    //                     "updated_at": null,
    //                     "class_colour": "#CCCCFF"
    //                 },
    //                 {
    //                     "classroom_id": 4,
    //                     "name": "Intro to Javascript",
    //                     "code": "111",
    //                     "description": null,
    //                     "professor_id": 6,
    //                     "is_archived": false,
    //                     "end_date": "2025-08-29",
    //                     "student_count": 0,
    //                     "created_at": "2025-07-03 12:40:42.862245+05:30",
    //                     "updated_at": null,
    //                     "class_colour": "#d92222"
    //                 },
    //                 {
    //                     "classroom_id": 1,
    //                     "name": "Introduction to Computer Science",
    //                     "code": "CS101",
    //                     "description": "Basic programming concepts",
    //                     "professor_id": 2,
    //                     "is_archived": false,
    //                     "end_date": "2025-12-15",
    //                     "student_count": 50,
    //                     "created_at": "2025-07-03 12:36:51.137424+05:30",
    //                     "updated_at": null,
    //                     "class_colour": "#CCCCFF"
    //                 }
    //             ],
    //             "total": 4,
    //             "columns_meta": [
    //                 {
    //                     "column_name": "classroom_id",
    //                     "data_type": "integer",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "name",
    //                     "data_type": "character varying",
    //                     "character_maximum_length": 100,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "code",
    //                     "data_type": "character varying",
    //                     "character_maximum_length": 20,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "description",
    //                     "data_type": "text",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "YES"
    //                 },
    //                 {
    //                     "column_name": "professor_id",
    //                     "data_type": "integer",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "is_archived",
    //                     "data_type": "boolean",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "end_date",
    //                     "data_type": "date",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "student_count",
    //                     "data_type": "integer",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "created_at",
    //                     "data_type": "timestamp with time zone",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "updated_at",
    //                     "data_type": "timestamp with time zone",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "YES"
    //                 },
    //                 {
    //                     "column_name": "class_colour",
    //                     "data_type": "character varying",
    //                     "character_maximum_length": 7,
    //                     "is_nullable": "NO"
    //                 }
    //             ]
    //         },
    //         "professor": {
    //             "headers": [
    //                 "user_id",
    //                 "created_at"
    //             ],
    //             "rows": [
    //                 {
    //                     "user_id": 2,
    //                     "created_at": "2025-07-03 12:36:51.13579+05:30"
    //                 },
    //                 {
    //                     "user_id": 3,
    //                     "created_at": "2025-07-03 12:36:51.13579+05:30"
    //                 },
    //                 {
    //                     "user_id": 6,
    //                     "created_at": "2025-07-03 12:40:42.85892+05:30"
    //                 }
    //             ],
    //             "total": 3,
    //             "columns_meta": [
    //                 {
    //                     "column_name": "user_id",
    //                     "data_type": "integer",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "created_at",
    //                     "data_type": "timestamp with time zone",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 }
    //             ]
    //         },
    //         "question_bank": {
    //             "headers": [
    //                 "question_bank_id",
    //                 "description",
    //                 "created_at",
    //                 "name",
    //                 "professor_id",
    //                 "updated_at",
    //                 "classroom_id"
    //             ],
    //             "rows": [
    //                 {
    //                     "question_bank_id": 3,
    //                     "description": "Imported via upload",
    //                     "created_at": "2025-07-04 17:07:30+05:30",
    //                     "name": "test_question_bank_2",
    //                     "professor_id": 7,
    //                     "updated_at": "2025-07-04 17:07:30",
    //                     "classroom_id": 4
    //                 },
    //                 {
    //                     "question_bank_id": 4,
    //                     "description": "Imported via upload",
    //                     "created_at": "2025-07-04 17:07:30+05:30",
    //                     "name": "test_question_bank_3",
    //                     "professor_id": 7,
    //                     "updated_at": "2025-07-04 17:07:30",
    //                     "classroom_id": 4
    //                 },
    //                 {
    //                     "question_bank_id": 5,
    //                     "description": "Imported via upload",
    //                     "created_at": "2025-07-04 17:07:30+05:30",
    //                     "name": "test_question_bank_4",
    //                     "professor_id": 7,
    //                     "updated_at": "2025-07-04 17:07:30",
    //                     "classroom_id": 4
    //                 },
    //                 {
    //                     "question_bank_id": 6,
    //                     "description": "Imported via upload",
    //                     "created_at": "2025-07-04 19:39:04+05:30",
    //                     "name": "test_question_bank_4",
    //                     "professor_id": 7,
    //                     "updated_at": "2025-07-04 19:39:04",
    //                     "classroom_id": 4
    //                 },
    //                 {
    //                     "question_bank_id": 7,
    //                     "description": "Imported via upload",
    //                     "created_at": "2025-07-04 19:39:04+05:30",
    //                     "name": "test_question_bank_3",
    //                     "professor_id": 7,
    //                     "updated_at": "2025-07-04 19:39:04",
    //                     "classroom_id": 4
    //                 },
    //                 {
    //                     "question_bank_id": 8,
    //                     "description": "Imported via upload",
    //                     "created_at": "2025-07-04 19:39:04+05:30",
    //                     "name": "test_question_bank_2",
    //                     "professor_id": 7,
    //                     "updated_at": "2025-07-04 19:39:04",
    //                     "classroom_id": 4
    //                 },
    //                 {
    //                     "question_bank_id": 9,
    //                     "description": "Imported via upload",
    //                     "created_at": "2025-07-05 23:05:09+05:30",
    //                     "name": "Midterm 1 Bank",
    //                     "professor_id": 6,
    //                     "updated_at": "2025-07-05 23:05:09",
    //                     "classroom_id": 4
    //                 }
    //             ],
    //             "total": 7,
    //             "columns_meta": [
    //                 {
    //                     "column_name": "question_bank_id",
    //                     "data_type": "integer",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "description",
    //                     "data_type": "text",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "YES"
    //                 },
    //                 {
    //                     "column_name": "created_at",
    //                     "data_type": "timestamp with time zone",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "name",
    //                     "data_type": "character varying",
    //                     "character_maximum_length": 255,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "professor_id",
    //                     "data_type": "bigint",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "updated_at",
    //                     "data_type": "timestamp without time zone",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "YES"
    //                 },
    //                 {
    //                     "column_name": "classroom_id",
    //                     "data_type": "bigint",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "YES"
    //                 }
    //             ]
    //         },
    //         "student": {
    //             "headers": [
    //                 "student_id",
    //                 "first_name",
    //                 "last_name",
    //                 "is_active",
    //                 "created_at"
    //             ],
    //             "rows": [
    //                 {
    //                     "student_id": 1001,
    //                     "first_name": "Alice",
    //                     "last_name": "Johnson",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 12:36:51.138848+05:30"
    //                 },
    //                 {
    //                     "student_id": 1002,
    //                     "first_name": "Bob",
    //                     "last_name": "Williams",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 12:36:51.138848+05:30"
    //                 },
    //                 {
    //                     "student_id": 1003,
    //                     "first_name": "Charlie",
    //                     "last_name": "Brown",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 12:36:51.138848+05:30"
    //                 },
    //                 {
    //                     "student_id": 1004,
    //                     "first_name": "Diana",
    //                     "last_name": "Miller",
    //                     "is_active": false,
    //                     "created_at": "2025-07-03 12:36:51.138848+05:30"
    //                 },
    //                 {
    //                     "student_id": 1005,
    //                     "first_name": "Ethan",
    //                     "last_name": "Davis",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 12:36:51.138848+05:30"
    //                 },
    //                 {
    //                     "student_id": 12346,
    //                     "first_name": "Samyak",
    //                     "last_name": "Jain",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12347,
    //                     "first_name": "Sahil",
    //                     "last_name": "Chawla",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12348,
    //                     "first_name": "Ali",
    //                     "last_name": "Afoud",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12349,
    //                     "first_name": "Aliasgar",
    //                     "last_name": "Sakarwala",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12350,
    //                     "first_name": "Arjun",
    //                     "last_name": "Sampat",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12351,
    //                     "first_name": "Christian",
    //                     "last_name": "Eziekwu",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12352,
    //                     "first_name": "Cooper",
    //                     "last_name": "Ross",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12353,
    //                     "first_name": "John",
    //                     "last_name": "Smith",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12354,
    //                     "first_name": "Jane",
    //                     "last_name": "Doe",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12355,
    //                     "first_name": "Jacob",
    //                     "last_name": "Mathew",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12357,
    //                     "first_name": "Robert",
    //                     "last_name": "De Niro",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12358,
    //                     "first_name": "Jill",
    //                     "last_name": "Hitchins",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12359,
    //                     "first_name": "Jackie",
    //                     "last_name": "Chan",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12360,
    //                     "first_name": "Chris",
    //                     "last_name": "Evans",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12361,
    //                     "first_name": "Chris",
    //                     "last_name": "Pratt",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12362,
    //                     "first_name": "James",
    //                     "last_name": "Rodriguez",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12363,
    //                     "first_name": "Willy",
    //                     "last_name": "Wonka",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12364,
    //                     "first_name": "Jill",
    //                     "last_name": "Goodacre",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12365,
    //                     "first_name": "People",
    //                     "last_name": "Person",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 16:26:18.513712+05:30"
    //                 },
    //                 {
    //                     "student_id": 12345,
    //                     "first_name": "Johnny",
    //                     "last_name": "Depp",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 },
    //                 {
    //                     "student_id": 12356,
    //                     "first_name": "Tammy",
    //                     "last_name": "Wilkerson",
    //                     "is_active": true,
    //                     "created_at": "2025-07-03 15:36:07.883709+05:30"
    //                 }
    //             ],
    //             "total": 26,
    //             "columns_meta": [
    //                 {
    //                     "column_name": "student_id",
    //                     "data_type": "integer",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "first_name",
    //                     "data_type": "character varying",
    //                     "character_maximum_length": 50,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "last_name",
    //                     "data_type": "character varying",
    //                     "character_maximum_length": 50,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "is_active",
    //                     "data_type": "boolean",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 },
    //                 {
    //                     "column_name": "created_at",
    //                     "data_type": "timestamp with time zone",
    //                     "character_maximum_length": null,
    //                     "is_nullable": "NO"
    //                 }
    //             ]
    //         }
    //     };
    //     getTables.mockResolvedValue({ status: 200, data: { data: tablesData } });

    //     render(<DatabaseVisualizer />);
    //     await waitFor(() => screen.getByTestId('datatable-0'));

    //     // Open export modal
    //     fireEvent.click(screen.getByTestId('export-button-0'));
    //     // Click CSV card
    //     fireEvent.click(screen.getByTestId('export-card-CSV'));
    //     // Click Download
    //     // Spy on anchor click
    //     const clickSpy = jest.fn();
    //     jest.spyOn(document, 'createElement').mockImplementation((tag) => {
    //         if (tag === 'a') return { href: '', download: '', click: clickSpy, remove: jest.fn(), style: {} };
    //         return document.createElement.call(document, tag);
    //     });

    //     fireEvent.click(screen.getByText('Download'));
    //     // Advance timers so cleanup runs
    //     act(() => { jest.runAllTimers(); });
    //     expect(URL.createObjectURL).toHaveBeenCalled();
    //     expect(clickSpy).toHaveBeenCalled();
    //     jest.useRealTimers();
    // });
});
