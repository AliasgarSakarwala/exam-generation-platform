import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExamPage from '../app/[course_id]/analytics/page';
import * as gradesService from '../services/grades'; // ✅ Import the actual backend function

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
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

jest.mock('../services/grades', () => ({
  getAllGradesByExam: jest.fn(),
}));

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

// Set mock backend response
beforeEach(() => {
  (gradesService.getAllGradesByExam as jest.Mock).mockResolvedValue({
    grouped: {
      1: {
        grades: [
          { raw_score: 85, grade_points: 100 },
          { raw_score: 95, grade_points: 100 },
        ],
        statistics: {
          meanRawScore: 90,
          meanGradePoints: 100,
          count: 2,
        },
      },
    },
  });
});
