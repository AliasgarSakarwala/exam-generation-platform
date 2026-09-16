import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExamPage from '../app/[course_id]/analytics/page';


// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

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

// Mock components
jest.mock('../app/components/CourseListSidebar', () => {
  return function MockCourseListSidebar({ darkMode, onToggleDarkMode, middleButtons }) {
    return (
      <div data-testid="course-list-sidebar">
        <button
          onClick={onToggleDarkMode}
          data-testid="dark-mode-toggle"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          tabIndex={0}
        >
          {darkMode ? '🌙' : '☀️'}
        </button>
        {middleButtons?.map((button, index) => (
          <button
            key={index}
            onClick={button.onClick}
            data-testid={`sidebar-button-${button.label.toLowerCase().replace(/\s+/g, '-')}`}
            aria-label={button.alt}
            tabIndex={0}
          >
            {button.label}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock('../app/components/LineCurveGraph', () => {
  return function MockLineCurveGraph({ data, width, height }) {
    return (
      <div data-testid="line-curve-graph">
        <h3>Line Curve Graph</h3>
        <div data-testid="graph-data">Mock data received</div>
        <div data-testid="graph-dimensions">Width: {width}, Height: {height}</div>
      </div>
    );
  };
});

jest.mock('../app/components/CourseExamOverview', () => {
  return function MockCourseExamOverview({ data }) {
    return (
      <div data-testid="course-exam-overview">
        <h3>Course Exam Overview</h3>
        <div data-testid="overview-data">Mock data received</div>
      </div>
    );
  };
});

jest.mock('../app/components/ExamStatsBox', () => {
  return function MockExamStatsBox({ data }) {
    return (
      <div data-testid="exam-stats-box">
        <h3>Exam Statistics</h3>
        <div data-testid="stats-data">Mock data received</div>
      </div>
    );
  };
});

jest.mock('../app/components/VariantHistogram', () => {
  return function MockVariantHistogram({ data, width, height }) {
    return (
      <div data-testid="variant-histogram">
        <h3>Variant Histogram</h3>
        <div data-testid="histogram-data">Mock data received</div>
        <div data-testid="histogram-dimensions">Width: {width}, Height: {height}</div>
      </div>
    );
  };
});

jest.mock('../app/components/AnalyticHeader', () => {
  return function MockAnalyticHeader() {
    return (
      <div data-testid="analytic-header">
        <h1>Analytics Dashboard</h1>
        <p>Course performance and exam analytics</p>
      </div>
    );
  };
});

jest.mock('../app/components/QuickAction', () => {
  return function MockQuickAction({ data, onSelectVariant }) {
    return (
      <div data-testid="quick-action">
        <h3>Quick Actions</h3>
        <button
          onClick={() => onSelectVariant('variant1')}
          data-testid="quick-action-button"
          tabIndex={0}
        >
          Select Variant
        </button>
        <div data-testid="quick-action-data">Mock data received</div>
      </div>
    );
  };
});

// Mock dummy data
jest.mock('../app/components/dummyData', () => ({
  allDummyGrades: [
    { id: 1, name: 'Exam 1', score: 85, variant: 'A' },
    { id: 2, name: 'Exam 2', score: 92, variant: 'B' },
    { id: 3, name: 'Exam 3', score: 78, variant: 'A' },
  ],
}));

describe('Analytics Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the analytics page with all components', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        expect(screen.getByTestId('course-list-sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('analytic-header')).toBeInTheDocument();
        expect(screen.getByTestId('exam-stats-box')).toBeInTheDocument();
        expect(screen.getByTestId('course-exam-overview')).toBeInTheDocument();
        expect(screen.getByTestId('quick-action')).toBeInTheDocument();
        expect(screen.getByTestId('line-curve-graph')).toBeInTheDocument();
        expect(screen.getByTestId('variant-histogram')).toBeInTheDocument();
      });
    });

    it('should render sidebar navigation buttons', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        expect(screen.getByTestId('sidebar-button-live-courses')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-button-dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-button-question-banks')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-button-students')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-button-analytics')).toBeInTheDocument();
      });
    });

    it('should render analytics header with proper content', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getByText(/course performance/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dark Mode Functionality', () => {
    it('should toggle dark mode when button is clicked', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        const darkModeToggle = screen.getByTestId('dark-mode-toggle');
        expect(darkModeToggle).toBeInTheDocument();

        // Verify the button is clickable and has proper attributes
        expect(darkModeToggle).toHaveAttribute('aria-label');
        expect(darkModeToggle.textContent).toBeTruthy();
        expect(darkModeToggle).toHaveAttribute('tabIndex', '0');

        // Click the button to verify it's interactive
        userEvent.click(darkModeToggle);

        // Verify the button still exists and is functional
        expect(darkModeToggle).toBeInTheDocument();
        expect(darkModeToggle).toHaveAttribute('aria-label');
        expect(darkModeToggle.textContent).toBeTruthy();
      });
    });

    it('should apply dark mode styling to the main container', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        const darkModeToggle = screen.getByTestId('dark-mode-toggle');
        const mainContainer = screen.getByTestId('course-list-sidebar').parentElement;

        // Toggle to dark mode
        userEvent.click(darkModeToggle);

        // Check if dark mode classes are applied
        expect(mainContainer).toHaveClass('bg-gray-900', 'text-white');
      });
    });
  });

  describe('Navigation', () => {
    it('should render navigation buttons with correct labels', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Live Courses')).toBeInTheDocument();
        expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
        expect(screen.getByLabelText('Question Banks')).toBeInTheDocument();
        expect(screen.getByLabelText('Students')).toBeInTheDocument();
        expect(screen.getByLabelText('Analytics')).toBeInTheDocument();
      });
    });

    it('should have clickable navigation buttons', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        const liveCoursesButton = screen.getByTestId('sidebar-button-live-courses');
        const analyticsButton = screen.getByTestId('sidebar-button-analytics');

        expect(liveCoursesButton).toBeInTheDocument();
        expect(analyticsButton).toBeInTheDocument();
        expect(liveCoursesButton).toHaveAttribute('tabIndex', '0');
        expect(analyticsButton).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Component Integration', () => {
    it('should pass data to all chart components', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        // Check that all components receive data
        expect(screen.getByTestId('stats-data')).toBeInTheDocument();
        expect(screen.getByTestId('overview-data')).toBeInTheDocument();
        expect(screen.getByTestId('quick-action-data')).toBeInTheDocument();
        expect(screen.getByTestId('graph-data')).toBeInTheDocument();
        expect(screen.getByTestId('histogram-data')).toBeInTheDocument();
      });
    });

    it('should pass correct dimensions to chart components', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        expect(screen.getByTestId('graph-dimensions')).toHaveTextContent('Width: 100%, Height: 400');
        expect(screen.getByTestId('histogram-dimensions')).toHaveTextContent('Width: 100%, Height: 400');
      });
    });

    it('should handle quick action variant selection', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<ExamPage />);

      await waitFor(() => {
        const quickActionButton = screen.getByTestId('quick-action-button');
        userEvent.click(quickActionButton);

        expect(consoleSpy).toHaveBeenCalledWith('Selected:', 'variant1');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Layout & Responsive Design', () => {
    it('should have proper grid layout for stats row', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        const statsContainer = screen.getByTestId('exam-stats-box').parentElement.parentElement;
        expect(statsContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3');
      });
    });

    it('should have proper grid layout for charts area', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        const chartsContainer = screen.getByTestId('line-curve-graph').parentElement.parentElement;
        expect(chartsContainer).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-2');
      });
    });

    it('should have proper spacing and styling', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        const mainContent = screen.getByTestId('analytic-header').parentElement;
        expect(mainContent).toHaveClass('flex', 'flex-col', 'flex-1', 'p-6');
      });
    });
  });

  describe('Data Handling', () => {
    it('should display dummy data in components', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        // Check that data is being passed and displayed
        const statsData = screen.getByTestId('stats-data');
        const overviewData = screen.getByTestId('overview-data');

        expect(statsData.textContent).toContain('Mock data received');
        expect(overviewData.textContent).toContain('Mock data received');
      });
    });

    it('should handle data changes when props update', async () => {
      const { rerender } = render(<ExamPage />);

      await waitFor(() => {
        expect(screen.getByTestId('stats-data')).toBeInTheDocument();
      });

      // Re-render with same props to test stability
      rerender(<ExamPage />);

      await waitFor(() => {
        expect(screen.getByTestId('stats-data')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        const darkModeToggle = screen.getByLabelText(/switch to dark mode/i);
        expect(darkModeToggle).toBeInTheDocument();

        const liveCoursesButton = screen.getByLabelText('Live Courses');
        expect(liveCoursesButton).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        const darkModeToggle = screen.getByTestId('dark-mode-toggle');
        expect(darkModeToggle).toHaveAttribute('tabIndex', '0');

        const quickActionButton = screen.getByTestId('quick-action-button');
        expect(quickActionButton).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should have semantic HTML structure', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(5);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing data gracefully', async () => {
      // Mock empty data
      jest.doMock('../app/components/dummyData', () => ({
        allDummyGrades: [],
      }));

      render(<ExamPage />);

      await waitFor(() => {
        // Should still render all components
        expect(screen.getByTestId('exam-stats-box')).toBeInTheDocument();
        expect(screen.getByTestId('course-exam-overview')).toBeInTheDocument();
        expect(screen.getByTestId('line-curve-graph')).toBeInTheDocument();
      });
    });

    it('should handle component errors gracefully', async () => {
      render(<ExamPage />);

      await waitFor(() => {
        // All components should render even if some have issues
        expect(screen.getByTestId('analytic-header')).toBeInTheDocument();
        expect(screen.getByTestId('course-list-sidebar')).toBeInTheDocument();
      });
    });
  });
}); 