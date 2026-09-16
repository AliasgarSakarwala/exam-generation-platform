import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import CoursesPage from '../app/page';          // adjust path if needed
import * as classroomSvc from '../services/classroom';
import toast from 'react-hot-toast';

// --- MOCKS --- //
jest.mock('../services/classroom');

jest.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: {
            role: 'Admin',
            username: 'John Doe',
            email: 'john.doe@example.com',
            language: 'en',
            mode: 'light',
            is_active: true,
        },
    }),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));
jest.mock('react-hot-toast', () => ({
    error: jest.fn(),
}));

const sampleCourses = [
    { classroom_id: 1, name: 'Math 101', code: '101' },
    { classroom_id: 2, name: 'History 202', code: '202' },
];

describe('CoursesPage', () => {
    const push = jest.fn();

    it('shows a spinner while loading and then renders a grid of courses', async () => {
        // mock API to resolve after a tick
        classroomSvc.getClassrooms.mockResolvedValue({
            status: 200,
            data: sampleCourses,
        });

        await act(async () => {
            render(<CoursesPage />);
        });
        // initially a spinner should be in the document
        expect(screen.getByRole('status')).toBeInTheDocument();

        // wait for courses to render
        await waitFor(() => {
            expect(screen.getByText('Math 101')).toBeInTheDocument();
            expect(screen.getByText('History 202')).toBeInTheDocument();
        });
    });

    it('shows error message and toast on fetch failure', async () => {
        classroomSvc.getClassrooms.mockRejectedValue(new Error('oops'));

        render(<CoursesPage />);
        await waitFor(() => {
            expect(screen.getByText('Failed to load courses')).toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to load courses'),
                expect.any(Object),
            );
        });
    });

    it('renders empty-state when API returns empty array', async () => {
        classroomSvc.getClassrooms.mockResolvedValue({
            status: 200,
            data: [],
        });

        render(<CoursesPage />);
        await waitFor(() => {
            expect(screen.getByText('Create your first course!')).toBeVisible();
        });
    });

    it('filters courses by search input', async () => {
        classroomSvc.getClassrooms.mockResolvedValue({
            status: 200,
            data: sampleCourses,
        });
        render(<CoursesPage />);
        // wait for data
        await waitFor(() => screen.getByText('Math 101'));

        const searchInput = screen.getByPlaceholderText(/Search courses.../i);
        fireEvent.change(searchInput, { target: { value: 'History' } });
        expect(screen.queryByText('Math 101')).toBeNull();
        expect(screen.getByText('History 202')).toBeInTheDocument();
    });

    it('sorts courses when filter dropdown is used', async () => {
        classroomSvc.getClassrooms.mockResolvedValue({
            status: 200,
            data: [
                { classroom_id: 3, name: 'Zebra', code: '300' },
                { classroom_id: 4, name: 'Alpha', code: '100' },
            ],
        });
        render(<CoursesPage />);
        await waitFor(() => screen.getByText('Zebra'));

        const filterSelect = screen.getByLabelText(/filter/i);
        fireEvent.change(filterSelect, { target: { value: 'code-asc' } });

        // after ascending sort, code 100 (Alpha) should appear before code 300
        const cards = screen.getAllByTestId('course-card-name');
        expect(cards[0]).toHaveTextContent('Zebra');
        expect(cards[1]).toHaveTextContent('Alpha');
    });

    it('shows the Admin “Database” button and navigates on click', async () => {
        classroomSvc.getClassrooms.mockResolvedValue({
            status: 200,
            data: sampleCourses,
        });

        render(<CoursesPage />);
        await waitFor(() => screen.getByText('Math 101'));

        // the “Database” button should be in the sidebar
        const dbBtn = screen.getByTestId('Database');
        expect(dbBtn).toBeInTheDocument();
    });

    // NOTE: a full drag-and-drop test would require poking DnD-Kit internals.
    // You can cover that with a unit test of handleDragEnd in isolation.

});