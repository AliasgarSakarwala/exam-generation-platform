/**
 * __tests__/ExamDashboard.test.tsx
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExamDashboard from '../app/[course_id]/page';
import * as nextNav from 'next/navigation';

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


describe('ExamDashboard page', () => {
    const push = jest.fn();

    beforeEach(() => {
        jest.spyOn(nextNav, 'useRouter').mockReturnValue({ push });

        const exams = [
            {
                id: 'e1',
                title: 'Exam One',
                courseTitle: 'Math',
                questions: [1, 2, 3],
            },
            {
                id: 'e2',
                title: 'Second Exam',
                courseTitle: 'History',
                questions: [1],
            },
        ];

        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                pathname: '/42',
                reload: jest.fn(),
            },
        });


        window.localStorage.setItem('selectedVariant', JSON.stringify(exams));
        window.localStorage.setItem('examData', JSON.stringify([]));
    });

    it('renders header search input with correct placeholder', async () => {
        render(<ExamDashboard />);
        // wait for useEffect to run
        await waitFor(() => {
            expect(screen.getByTestId('header-search')).toHaveAttribute(
                'placeholder',
                'Search Exams...'
            );
        });
    });

    it('renders two past-exam cards with their details', async () => {
        render(<ExamDashboard />);

        // confirm the titles appear
        await waitFor(() => {
            expect(screen.getByText('Exam Name: Exam One')).toBeInTheDocument();
            expect(screen.getByText('Course: Math')).toBeInTheDocument();
            expect(screen.getByText('Version: 1')).toBeInTheDocument();

            expect(screen.getByText('Exam Name: Second Exam')).toBeInTheDocument();
            expect(screen.getByText('Course: History')).toBeInTheDocument();
            expect(screen.getByText('Version: 2')).toBeInTheDocument();
        });
    });

    it('fires router.push when Live Courses is clicked', async () => {
        render(<ExamDashboard />);
        await waitFor(() => screen.getByText('Live Courses'));

        fireEvent.click(screen.getByText('Live Courses'));
        expect(push).toHaveBeenCalledWith('/');
    });

    it('calls window.location.reload when Dashboard is clicked', async () => {
        render(<ExamDashboard />);
        await waitFor(() => screen.getByText('Dashboard'));

        fireEvent.click(screen.getByText('Dashboard'));
        expect(window.location.reload).toHaveBeenCalled();
    });

    it('navigates to questions, students, analytics via sidebar buttons', async () => {
        render(<ExamDashboard />);
        await waitFor(() => screen.getByText('Question Banks'));

        fireEvent.click(screen.getByText('Question Banks'));
        expect(push).toHaveBeenCalledWith('/42/questions');

        fireEvent.click(screen.getByText('Students'));
        expect(push).toHaveBeenCalledWith('/42/students');

        fireEvent.click(screen.getByText('Course Analytics'));
        expect(push).toHaveBeenCalledWith('/42/analytics');
    });

    it('navigates to examparameter when Add Exam button is clicked', async () => {
        render(<ExamDashboard />);
        await waitFor(() => screen.getByText('Add Exam'));

        fireEvent.click(screen.getByText('Add Exam'));
        expect(push).toHaveBeenCalledWith('/42/examparameter');
    });

    it('always shows the Overall Analytics placeholder', async () => {
        render(<ExamDashboard />);
        expect(
            await screen.findByText('Under Development!')
        ).toBeInTheDocument();
    });
});
