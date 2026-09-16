// __tests__/ArchivedCoursesPage.test.tsx
import React from 'react';
import {
    render,
    screen,
    waitFor,
    fireEvent,
} from '@testing-library/react';
import ArchivedCoursesPage from '../app/archived/page';
import { useRouter } from 'next/navigation';
import { getArchivedClassrooms } from '../services/classroom';
import toast from 'react-hot-toast';

// --- MOCKS --- //
// Authenticated is not used here, so we skip useAuth

// Router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// Classroom service
jest.mock('../services/classroom', () => ({
    getArchivedClassrooms: jest.fn(),
}));

// Toast
jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: { error: jest.fn() },
}));

describe('ArchivedCoursesPage', () => {
    const push = jest.fn();

    beforeEach(() => {
        jest.resetAllMocks();
        (useRouter).mockReturnValue({ push });
    });

    it('shows spinner, then renders cards on success', async () => {
        const sample = [
            { classroom_id: 1, name: 'Old 1', code: '11' },
            { classroom_id: 2, name: 'Old 2', code: '22' },
        ];
        (getArchivedClassrooms).mockResolvedValue({
            status: 200,
            data: sample,
        });

        render(<ArchivedCoursesPage />);
        await waitFor(() => {
            expect(screen.getAllByTestId('course-card-name').map(c => c.textContent))
                .toEqual(['Old 1', 'Old 2']);
        });
    });

    it('shows error message and toast on fetch failure', async () => {
        (getArchivedClassrooms).mockRejectedValue(new Error('fail'));

        render(<ArchivedCoursesPage />);
        await waitFor(() => {
            expect(screen.getByText('Failed to load archived courses')).toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith(
                'Failed to load archived courses ❌',
                expect.any(Object),
            );
        });
    });

    it('shows empty state when no archived courses', async () => {
        (getArchivedClassrooms).mockResolvedValue({
            status: 200,
            data: [],
        });

        render(<ArchivedCoursesPage />);
        await waitFor(() => {
            expect(screen.getByText('No archived courses found')).toBeInTheDocument();
        });
    });

    it('filters by search term', async () => {
        const sample = [
            { classroom_id: 1, name: 'Alpha', code: '1' },
            { classroom_id: 2, name: 'Beta', code: '2' },
        ];
        (getArchivedClassrooms).mockResolvedValue({
            status: 200,
            data: sample,
        });

        render(<ArchivedCoursesPage />);
        await waitFor(() => screen.getByText('Alpha'));

        // search for "Beta"
        fireEvent.change(screen.getByTestId('header-search'), { target: { value: 'Beta' } });
        expect(screen.queryByText('Alpha')).toBeNull();
        expect(screen.getByText('Beta')).toBeInTheDocument();
    });

    it('navigates via sidebar buttons', async () => {
        (getArchivedClassrooms).mockResolvedValue({
            status: 200,
            data: [{ classroom_id: 1, name: 'X', code: '1' }],
        });
        render(<ArchivedCoursesPage />);
        await waitFor(() => screen.getByText('X'));

        fireEvent.click(screen.getByText('Live Courses'));
        expect(push).toHaveBeenCalledWith('/');
        fireEvent.click(screen.getByText('Archived'));
        expect(push).toHaveBeenCalledWith('/archived');
    });
});
