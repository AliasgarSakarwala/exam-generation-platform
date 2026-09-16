// Onboarding steps configuration for different pages

export enum OnboardingPages {
  course,
  exam,
  questionBank,
  questionBankDetails,
  analytics,
  studentManagement,
  examVariant,
  examParameter,
  courseAnalytics,
  gradeAnalytics,
  userManagement
}

export interface OnboardingStepConfig {
  id: string;
  message: string;
  targetSelector: string;
  cardPosition: { side: 'top' | 'bottom' | 'left' | 'right'; alignment: 'start' | 'center' | 'end' };
}

// Course page onboarding steps
export const coursePageSteps: OnboardingStepConfig[] = [
  {
    id: 'add-course',
    message: 'Start by creating your first course. Click here to add a new course with students and course specific settings.',
    targetSelector: '[data-onboarding="add-course"]',
    cardPosition: { side: 'left', alignment: 'center' },
  },
  {
    id: 'ellipsis-menu',
    message: 'Use this menu to access course settings, edit details, or archive courses when they\'re complete.',
    targetSelector: '[data-onboarding="ellipsis-menu"]',
    cardPosition: { side: 'right', alignment: 'center' },
  },
  {
    id: 'archived-button',
    message: 'View and manage your completed courses here. Archived courses are kept for reference but can\'t be modified.',
    targetSelector: '[data-onboarding="archived-button"]',
    cardPosition: { side: 'right', alignment: 'center' },
  },
];

// Future: Exam dashboard steps
export const examDashboardSteps: OnboardingStepConfig[] = [
  {
    id: 'question-bank',
    message: 'Add, View and Manage your Question Banks here. Required for exam creation.',
    targetSelector: '[data-onboarding="question-bank"]',
    cardPosition: { side: 'right', alignment: 'center' },
  },
  {
    id: 'students',
    message: 'Add, View and Manage your Students here. Required for exam creation.',
    targetSelector: '[data-onboarding="students"]',
    cardPosition: { side: 'right', alignment: 'center' },
  },
  {
    id: 'add-exam',
    message: 'Create an exam by clicking here.',
    targetSelector: '[data-onboarding="add-exam"]',
    cardPosition: { side: 'left', alignment: 'center' },
  },
  {
    id: 'exam-card-0',
    message: 'View and Manage your exam here. Click on this card to view exam details.',
    targetSelector: '[data-onboarding="exam-card-0"]',
    cardPosition: { side: 'right', alignment: 'center' },
  },
  {
    id: 'course-analytics-section',
    message: 'View analytics for your course here. These statistics are across all exams.',
    targetSelector: '[data-onboarding="course-analytics-section"]',
    cardPosition: { side: 'right', alignment: 'center' },
  },
];

// Future: Question bank steps
export const questionBankSteps: OnboardingStepConfig[] = [
  {
    id: 'export-template',
    message: 'Export a template for the accurate format of the question bank.',
    targetSelector: '[data-onboarding="export-template"]',
    cardPosition: { side: 'left', alignment: 'center' },
  },
  {
    id: 'add-question-banks',
    message: 'Add a Question Bank by clicking here. You can upload upto 10 question banks at a time.',
    targetSelector: '[data-onboarding="add-question-banks"]',
    cardPosition: { side: 'left', alignment: 'center' },
  },
  {
    id: 'question-bank-card-0',
    message: 'View and Manage your question bank here. Click on this card to view question bank details.',
    targetSelector: '[data-onboarding="question-bank-card-0"]',
    cardPosition: { side: 'right', alignment: 'center' },
  }
];

export const questionBankDetailsSteps: OnboardingStepConfig[] = [
  {
    id: 'ellipsis-menu-qb',
    message: 'Use this menu to access question bank settings, edit details or delete question banks.',
    targetSelector: '[data-onboarding="ellipsis-menu-qb"]',
    cardPosition: { side: 'right', alignment: 'center' },
  },
  {
    id: 'add-new-questions',
    message: 'Add new questions to your question bank here. This will append questions to the existing question bank.',
    targetSelector: '[data-onboarding="add-new-questions"]',
    cardPosition: { side: 'left', alignment: 'center' },
  },
  {
    id: 'view-questionBankDetails-0',
    message: 'View question with options and correct answer by clicking on the eye icon.',
    targetSelector: '[data-onboarding="view-questionBankDetails-0"]',
    cardPosition: { side: 'bottom', alignment: 'center' },
  },
  {
    id: 'edit-questionBankDetails-0',
    message: 'Edit question with options and correct answer by clicking on the edit icon.',
    targetSelector: '[data-onboarding="edit-questionBankDetails-0"]',
    cardPosition: { side: 'bottom', alignment: 'center' },
  },
  {
    id: 'delete-questionBankDetails-0',
    message: 'Delete question by clicking on the delete icon.',
    targetSelector: '[data-onboarding="delete-questionBankDetails-0"]',
    cardPosition: { side: 'bottom', alignment: 'center' },
  }
];

export const studentManagementSteps: OnboardingStepConfig[] = [
  {
    id: 'add-students',
    message: 'Add new students to your course here. You can only Import 1 CSV File at a time.',
    targetSelector: '[data-onboarding="add-students"]',
    cardPosition: { side: 'left', alignment: 'center' },
  },
  {
    id: 'edit-studentManagement-0',
    message: 'Edit student details here. Click on the edit icon to edit student details.',
    targetSelector: '[data-onboarding="edit-studentManagement-0"]',
    cardPosition: { side: 'bottom', alignment: 'center' },
  },
  {
    id: 'delete-studentManagement-0',
    message: 'Delete student by clicking on the delete icon.',
    targetSelector: '[data-onboarding="delete-studentManagement-0"]',
    cardPosition: { side: 'bottom', alignment: 'center' },
  }
];

export const examVariantSteps: OnboardingStepConfig[] = [
  {
    id: 'exam-statistics',
    message: 'Visual Comparison of Similarity of the exam variants.',
    targetSelector: '[data-onboarding="exam-statistics"]',
    cardPosition: { side: 'right', alignment: 'center' },
  },
  {
    id: 'download-exams',
    message: 'Download the exam variants here. You can either download A single variant or All variants in a ZIP.',
    targetSelector: '[data-onboarding="download-exams"]',
    cardPosition: { side: 'left', alignment: 'center' },
  },
];

export const examParameterSteps: OnboardingStepConfig[] = [
  {
    id: 'num-of-questions',
    message: 'Number of questions you want in every exam variant.',
    targetSelector: '[data-onboarding="num-of-questions"]',
    cardPosition: { side: 'bottom', alignment: 'center' },
  },
  {
    id: 'num-of-variants',
    message: 'You can create multiple variants of the exam here. Upto 10 variants are permitted per exam.',
    targetSelector: '[data-onboarding="num-of-variants"]',
    cardPosition: { side: 'bottom', alignment: 'center' },
  },
  {
    id: 'difficulty-distribution',
    message: 'Every Exam Variant is a combination of Easy, Medium and Hard questions. You can adjust the difficulty distribution of questions here by adding weightage to each difficulty level. (Note: Should add up to 100)',
    targetSelector: '[data-onboarding="difficulty-distribution"]',
    cardPosition: { side: 'bottom', alignment: 'center' },
  },
  {
    id: 'add-questions',
    message: 'Clicking on this will open a modal to add questions to the exam. You can select questions from all your question banks.',
    targetSelector: '[data-onboarding="add-questions"]',
    cardPosition: { side: 'top', alignment: 'center' },
  }
]

export const courseAnalyticsSteps: OnboardingStepConfig[] = [
  {
    id: 'stats-overview',
    message: 'View key statistics for your course including exam participation, course statistics, and exam selection.',
    targetSelector: '[data-onboarding="stats-overview"]',
    cardPosition: { side: 'bottom', alignment: 'center' },
  },
  {
    id: 'performance-line-chart',
    message: 'This chart shows performance trends across all exams. Use the exam selector above to filter specific exams.',
    targetSelector: '[data-onboarding="performance-line-chart"]',
    cardPosition: { side: 'top', alignment: 'center' },
  },
  {
    id: 'performance-histogram',
    message: 'This histogram displays the distribution of average scores across all exams.',
    targetSelector: '[data-onboarding="performance-histogram"]',
    cardPosition: { side: 'left', alignment: 'center' },
  },
];

export const gradeAnalyticsSteps: OnboardingStepConfig[] = [
  {
    id: 'upload-weights',
    message: 'Upload exam weights to customize how much each exam contributes to the final grade calculation. This helps you balance the importance of different exams.',
    targetSelector: '[data-onboarding="upload-weights"]',
    cardPosition: { side: 'left', alignment: 'center' },
  },
  {
    id: 'student-avg-0',
    message: 'Click on any average score to see a comprehensive analysis of that student\'s overall performance across all exams.',
    targetSelector: '[data-onboarding="student-avg-0"]',
    cardPosition: { side: 'left', alignment: 'center' },
  },
];

export const userManagementSteps: OnboardingStepConfig[] = [
  {
    id: 'add-user',
    message: 'Click here to add new users to the system. You can invite professors, TAs, and other administrators.',
    targetSelector: '[data-onboarding="add-user"]',
    cardPosition: { side: 'left', alignment: 'center' },
  },
  {
    id: 'delete-user-0',
    message: 'Click the trash icon to remove users from the system. This action cannot be undone.',
    targetSelector: '[data-onboarding="delete-user-0"]',
    cardPosition: { side: 'left', alignment: 'center' },
  },
  {
    id: 'activity-monitor',
    message: 'Access the activity monitor to view system usage and user activity across the platform.',
    targetSelector: '[data-onboarding="activity-monitor"]',
    cardPosition: { side: 'right', alignment: 'center' },
  },
];

// Future: Analytics steps
export const analyticsSteps: OnboardingStepConfig[] = [
  // Will be defined when we implement analytics onboarding
];

// Helper function to get steps for a specific page
export const getOnboardingSteps = (
  page: OnboardingPages
): OnboardingStepConfig[] => {
  switch (page) {
    case OnboardingPages.course:
      return coursePageSteps;
    case OnboardingPages.exam:
      return examDashboardSteps;
    case OnboardingPages.questionBank:
      return questionBankSteps;
    case OnboardingPages.questionBankDetails:
      return questionBankDetailsSteps;
    case OnboardingPages.analytics:
      return analyticsSteps;
    case OnboardingPages.studentManagement:
      return studentManagementSteps;
    case OnboardingPages.examVariant:
      return examVariantSteps;
    case OnboardingPages.examParameter:
      return examParameterSteps;
    case OnboardingPages.courseAnalytics:
      return courseAnalyticsSteps;
    case OnboardingPages.gradeAnalytics:
      return gradeAnalyticsSteps;
    case OnboardingPages.userManagement:
      return userManagementSteps;
    default:
      return [];
  }
}; 