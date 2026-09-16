"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types for onboarding state
interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  completedSteps: string[];
  currentPage: 'course' | 'exam' | 'questionBank' | 'questionBankDetails' | 'analytics' | 'studentManagement' | 'examVariant' | 'examParameter' | 'courseAnalytics' | 'gradeAnalytics' | 'userManagement';
}

interface OnboardingContextType {
  state: OnboardingState;
  startOnboarding: (page: OnboardingState['currentPage']) => void;
  completeStep: (stepId: string) => void;
  skipTour: () => void;
  isStepCompleted: (stepId: string) => boolean;
  getNextIncompleteStep: () => number;
  isOnboardingComplete: () => boolean;
}

// Local storage keys for different pages
const ONBOARDING_KEYS = {
  course: {
    'add-course': 'onboarding_course_add_course_completed',
    'ellipsis-menu': 'onboarding_course_ellipsis_completed',
    'archived-button': 'onboarding_course_archived_completed',
  },
  exam: {
    'question-bank': 'onboarding_exam_question_bank_completed',
    'students': 'onboarding_exam_students_completed',
    'add-exam': 'onboarding_exam_add_exam_completed',
    'exam-card-0': 'onboarding_exam_exam_card_completed',
    'course-analytics-section': 'onboarding_exam_course_analytics_section_completed',
  },
  questionBank: {
    'export-template': 'onboarding_questionBank_export_template_completed',
    'add-question-banks': 'onboarding_questionBank_add_question_banks_completed',
    'question-bank-card-0': 'onboarding_questionBank_question_bank_card_completed',
  },
  questionBankDetails: {
    'ellipsis-menu-qb': 'onboarding_questionBank_ellipsis_menu_completed',
    'add-new-questions': 'onboarding_questionBank_add_new_questions_completed',
    'view-question-0': 'onboarding_questionBank_view_question_completed',
    'edit-question-0': 'onboarding_questionBank_edit_question_completed',
    'delete-question-0': 'onboarding_questionBank_delete_question_completed',
  },
  studentManagement: {
    'add-students': 'onboarding_studentManagement_add_students_completed',
    'edit-student-0': 'onboarding_studentManagement_edit_student_completed',
    'delete-student-0': 'onboarding_studentManagement_delete_student_completed',
  },
  examVariant: {
    'exam-statistics': 'onboarding_examVariant_exam_statistics_completed',
    'download-exams': 'onboarding_examVariant_download_exams_completed',
  },
  examParameter: {
    'num-of-questions': 'onboarding_examParameter_num_of_questions_completed',
    'num-of-variants': 'onboarding_examParameter_num_of_variants_completed',
    'difficulty-distribution': 'onboarding_examParameter_difficulty_distribution_completed',
    'add-questions': 'onboarding_examParameter_add_questions_completed',
  },
  courseAnalytics: {
    'stats-overview': 'onboarding_courseAnalytics_stats_overview_completed',
    'performance-line-chart': 'onboarding_courseAnalytics_performance_line_chart_completed',
    'performance-histogram': 'onboarding_courseAnalytics_performance_histogram_completed',
  },
  gradeAnalytics: {
    'upload-weights': 'onboarding_gradeAnalytics_upload_weights_completed',
    'student-avg-0': 'onboarding_gradeAnalytics_student_avg_0_completed',
  },
  userManagement: {
    'add-user': 'onboarding_userManagement_add_user_completed',
    'delete-user-0': 'onboarding_userManagement_delete_user_0_completed',
    'activity-monitor': 'onboarding_userManagement_activity_monitor_completed',
  },
  analytics: {
    // Future analytics steps
  }
};

// Course page step IDs
const COURSE_STEPS = [
  'add-course',
  'ellipsis-menu',
  'archived-button',
];

// Exam page step IDs
const EXAM_STEPS = [
  'question-bank',
  'students',
  'add-exam',
  'exam-card-0',
  'course-analytics-section',
];

// Question bank page step IDs
const QUESTION_BANK_STEPS = [
  'export-template',
  'add-question-banks',
  'question-bank-card-0',
];

// Question bank details page step IDs
const QUESTION_BANK_DETAILS_STEPS = [
  'ellipsis-menu-qb',
  'add-new-questions',
  'view-questionBankDetails-0',
  'edit-questionBankDetails-0',
  'delete-questionBankDetails-0',
];

// Student management page step IDs
const STUDENT_MANAGEMENT_STEPS = [
  'add-students',
  'edit-studentManagement-0',
  'delete-studentManagement-0',
];

// Exam variant page step IDs
const EXAM_VARIANT_STEPS = [
  'exam-statistics',
  'download-exams',
];

// Exam parameter page step IDs
const EXAM_PARAMETER_STEPS = [
  'num-of-questions',
  'num-of-variants',
  'difficulty-distribution',
  'add-questions',
];

// Course analytics page step IDs
const COURSE_ANALYTICS_STEPS = [
  'stats-overview',
  'performance-line-chart',
  'performance-histogram',
];

// Grade analytics page step IDs
const GRADE_ANALYTICS_STEPS = [
  'upload-weights',
  'student-avg-0',
];

// User management page step IDs
const USER_MANAGEMENT_STEPS = [
  'add-user',
  'delete-user-0',
  'activity-monitor',
];

// Create context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Provider component
export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>({
    isActive: false,
    currentStep: 0,
    completedSteps: [],
    currentPage: 'course'
  });



  // Load completed steps from localStorage on mount and when currentPage changes
  useEffect(() => {
    loadCompletedSteps();
  }, [state.currentPage]);

  // Load completed steps from localStorage
  const loadCompletedSteps = () => {
    const completedSteps: string[] = [];

    switch (state.currentPage) {
      case 'course':
        COURSE_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.course[stepId as keyof typeof ONBOARDING_KEYS.course];
          const value = localStorage.getItem(key);
          if (key && value === 'true') {
            completedSteps.push(stepId);
          }
        });
        break;
      case 'exam':
        EXAM_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.exam[stepId as keyof typeof ONBOARDING_KEYS.exam];
          const value = localStorage.getItem(key);
          if (key && value === 'true') {
            completedSteps.push(stepId);
          }
        });
        break;
      case 'questionBank':
        QUESTION_BANK_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.questionBank[stepId as keyof typeof ONBOARDING_KEYS.questionBank];
          const value = localStorage.getItem(key);
          if (key && value === 'true') {
            completedSteps.push(stepId);
          }
        });
        break;
      case 'questionBankDetails':
        QUESTION_BANK_DETAILS_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.questionBankDetails[stepId as keyof typeof ONBOARDING_KEYS.questionBankDetails];
          const value = localStorage.getItem(key);
          if (key && value === 'true') {
            completedSteps.push(stepId);
          }
        });
        break;
      case 'studentManagement':
        STUDENT_MANAGEMENT_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.studentManagement[stepId as keyof typeof ONBOARDING_KEYS.studentManagement];
          const value = localStorage.getItem(key);
          if (key && value === 'true') {
            completedSteps.push(stepId);
          }
        });
        break;
      case 'examVariant':
        EXAM_VARIANT_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.examVariant[stepId as keyof typeof ONBOARDING_KEYS.examVariant];
          const value = localStorage.getItem(key);
          if (key && value === 'true') {
            completedSteps.push(stepId);
          }
        });
        break;
      case 'examParameter':
        EXAM_PARAMETER_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.examParameter[stepId as keyof typeof ONBOARDING_KEYS.examParameter];
          const value = localStorage.getItem(key);
          if (key && value === 'true') {
            completedSteps.push(stepId);
          }
        });
        break;
             case 'courseAnalytics':
         COURSE_ANALYTICS_STEPS.forEach(stepId => {
           const key = ONBOARDING_KEYS.courseAnalytics[stepId as keyof typeof ONBOARDING_KEYS.courseAnalytics];
           const value = localStorage.getItem(key);
           if (key && value === 'true') {
             completedSteps.push(stepId);
           }
         });
         break;
       case 'gradeAnalytics':
         GRADE_ANALYTICS_STEPS.forEach(stepId => {
           const key = ONBOARDING_KEYS.gradeAnalytics[stepId as keyof typeof ONBOARDING_KEYS.gradeAnalytics];
           const value = localStorage.getItem(key);
           if (key && value === 'true') {
             completedSteps.push(stepId);
           }
         });
         break;
       case 'userManagement':
         USER_MANAGEMENT_STEPS.forEach(stepId => {
           const key = ONBOARDING_KEYS.userManagement[stepId as keyof typeof ONBOARDING_KEYS.userManagement];
           const value = localStorage.getItem(key);
           if (key && value === 'true') {
             completedSteps.push(stepId);
           }
         });
         break;
      default:
        COURSE_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.course[stepId as keyof typeof ONBOARDING_KEYS.course];
          const value = localStorage.getItem(key);
          if (key && value === 'true') {
            completedSteps.push(stepId);
          }
        });
        break;
    }

    setState(prev => ({
      ...prev,
      completedSteps
    }));
  };

  // Start onboarding for a specific page
  const startOnboarding = (page: OnboardingState['currentPage']) => {
    // reset any prior progress
    setState(prev => ({
      ...prev,
      isActive: true,
      currentPage: page,
      completedSteps: [],   // clear out old completions
      currentStep: 0        // start at the very first step
    }));
  };

  // Complete a specific step
  const completeStep = (stepId: string) => {
    // Save to localStorage
    const pageKeys = ONBOARDING_KEYS[state.currentPage];
    if (pageKeys && stepId in pageKeys) {
      const key = pageKeys[stepId as keyof typeof pageKeys];
      if (key) {
        localStorage.setItem(key, 'true');
      }
    }

    // Update state
    setState(prev => {
      // Prevent duplicate entries
      if (prev.completedSteps.includes(stepId)) {
        return prev;
      }

      const newCompletedSteps = [...prev.completedSteps, stepId];

      // Find next incomplete step
      let nextStepIndex;

      switch (state.currentPage) {
        case 'course':
          nextStepIndex = COURSE_STEPS.findIndex(step => !newCompletedSteps.includes(step));
          break;
        case 'exam':
          nextStepIndex = EXAM_STEPS.findIndex(step => !newCompletedSteps.includes(step));
          break;
        case 'questionBank':
          nextStepIndex = QUESTION_BANK_STEPS.findIndex(step => !newCompletedSteps.includes(step));
          break;
        case 'questionBankDetails':
          nextStepIndex = QUESTION_BANK_DETAILS_STEPS.findIndex(step => !newCompletedSteps.includes(step));
          break;
        case 'studentManagement':
          nextStepIndex = STUDENT_MANAGEMENT_STEPS.findIndex(step => !newCompletedSteps.includes(step));
          break;
        case 'examVariant':
          nextStepIndex = EXAM_VARIANT_STEPS.findIndex(step => !newCompletedSteps.includes(step));
          break;
        case 'examParameter':
          nextStepIndex = EXAM_PARAMETER_STEPS.findIndex(step => !newCompletedSteps.includes(step));
          break;
                 case 'courseAnalytics':
           nextStepIndex = COURSE_ANALYTICS_STEPS.findIndex(step => !newCompletedSteps.includes(step));
           break;
         case 'gradeAnalytics':
           nextStepIndex = GRADE_ANALYTICS_STEPS.findIndex(step => !newCompletedSteps.includes(step));
           break;
         case 'userManagement':
           nextStepIndex = USER_MANAGEMENT_STEPS.findIndex(step => !newCompletedSteps.includes(step));
           break;
        default:
          nextStepIndex = COURSE_STEPS.findIndex(step => !newCompletedSteps.includes(step));
          break;
      };

      return {
        ...prev,
        completedSteps: newCompletedSteps,
        currentStep: nextStepIndex >= 0 ? nextStepIndex : -1,
        isActive: nextStepIndex >= 0 // Close if no more steps
      };
    });
  };

  // Skip entire tour
  const skipTour = () => {
    // Mark all steps as completed
    let completedSteps: string[];
    switch (state.currentPage) {
      case 'course':
        COURSE_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.course[stepId as keyof typeof ONBOARDING_KEYS.course];
          if (key) {
            localStorage.setItem(key, 'true');
          }
        });
        completedSteps = COURSE_STEPS;
        break;
      case 'exam':
        EXAM_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.exam[stepId as keyof typeof ONBOARDING_KEYS.exam];
          if (key) {
            localStorage.setItem(key, 'true');
          }
        });
        completedSteps = EXAM_STEPS;
        break;
      case 'questionBank':
        QUESTION_BANK_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.questionBank[stepId as keyof typeof ONBOARDING_KEYS.questionBank];
          if (key) {
            localStorage.setItem(key, 'true');
          }
        });
        completedSteps = QUESTION_BANK_STEPS;
        break;
      case 'questionBankDetails':
        QUESTION_BANK_DETAILS_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.questionBankDetails[stepId as keyof typeof ONBOARDING_KEYS.questionBankDetails];
          if (key) {
            localStorage.setItem(key, 'true');
          }
        });
        completedSteps = QUESTION_BANK_DETAILS_STEPS;
        break;
      case 'studentManagement':
        STUDENT_MANAGEMENT_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.studentManagement[stepId as keyof typeof ONBOARDING_KEYS.studentManagement];
          if (key) {
            localStorage.setItem(key, 'true');
          }
        });
        completedSteps = STUDENT_MANAGEMENT_STEPS;
        break;
      case 'examVariant':
        EXAM_VARIANT_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.examVariant[stepId as keyof typeof ONBOARDING_KEYS.examVariant];
          if (key) {
            localStorage.setItem(key, 'true');
          }
        });
        completedSteps = EXAM_VARIANT_STEPS;
        break;
      case 'examParameter':
        EXAM_PARAMETER_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.examParameter[stepId as keyof typeof ONBOARDING_KEYS.examParameter];
          if (key) {
            localStorage.setItem(key, 'true');
          }
        });
        completedSteps = EXAM_PARAMETER_STEPS;
        break;
             case 'courseAnalytics':
         COURSE_ANALYTICS_STEPS.forEach(stepId => {
           const key = ONBOARDING_KEYS.courseAnalytics[stepId as keyof typeof ONBOARDING_KEYS.courseAnalytics];
           if (key) {
             localStorage.setItem(key, 'true');
           }
         });
         completedSteps = COURSE_ANALYTICS_STEPS;
         break;
       case 'gradeAnalytics':
         GRADE_ANALYTICS_STEPS.forEach(stepId => {
           const key = ONBOARDING_KEYS.gradeAnalytics[stepId as keyof typeof ONBOARDING_KEYS.gradeAnalytics];
           if (key) {
             localStorage.setItem(key, 'true');
           }
         });
         completedSteps = GRADE_ANALYTICS_STEPS;
         break;
       case 'userManagement':
         USER_MANAGEMENT_STEPS.forEach(stepId => {
           const key = ONBOARDING_KEYS.userManagement[stepId as keyof typeof ONBOARDING_KEYS.userManagement];
           if (key) {
             localStorage.setItem(key, 'true');
           }
         });
         completedSteps = USER_MANAGEMENT_STEPS;
         break;
      default:
        COURSE_STEPS.forEach(stepId => {
          const key = ONBOARDING_KEYS.course[stepId as keyof typeof ONBOARDING_KEYS.course];
          if (key) {
            localStorage.setItem(key, 'true');
          }
        });
        completedSteps = COURSE_STEPS;
        break;
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      completedSteps: completedSteps
    }));
  };

  // Check if a step is completed
  const isStepCompleted = (stepId: string): boolean => {
    return state.completedSteps.includes(stepId);
  };

  // Check if all steps are completed
  const isOnboardingComplete = (): boolean => {
    switch (state.currentPage) {
      case 'course':
        return COURSE_STEPS.every(step => state.completedSteps.includes(step));
      case 'exam':
        return EXAM_STEPS.every(step => state.completedSteps.includes(step));
      case 'questionBank':
        return QUESTION_BANK_STEPS.every(step => state.completedSteps.includes(step));
      case 'questionBankDetails':
        return QUESTION_BANK_DETAILS_STEPS.every(step => state.completedSteps.includes(step));
      case 'studentManagement':
        return STUDENT_MANAGEMENT_STEPS.every(step => state.completedSteps.includes(step));
      case 'examVariant':
        return EXAM_VARIANT_STEPS.every(step => state.completedSteps.includes(step));
      case 'examParameter':
        return EXAM_PARAMETER_STEPS.every(step => state.completedSteps.includes(step));
             case 'courseAnalytics':
         return COURSE_ANALYTICS_STEPS.every(step => state.completedSteps.includes(step));
       case 'gradeAnalytics':
         return GRADE_ANALYTICS_STEPS.every(step => state.completedSteps.includes(step));
       case 'userManagement':
         return USER_MANAGEMENT_STEPS.every(step => state.completedSteps.includes(step));
      default:
        return COURSE_STEPS.every(step => state.completedSteps.includes(step));
    }
  };

  // Get next incomplete step index
  const getNextIncompleteStep = (): number => {
    let steps: string[];
    switch (state.currentPage) {
      case 'course':
        steps = COURSE_STEPS;
        break;

      case 'exam':
        steps = EXAM_STEPS;
        break;
      case 'questionBank':
        steps = QUESTION_BANK_STEPS;
        break;
      case 'questionBankDetails':
        steps = QUESTION_BANK_DETAILS_STEPS;
        break;
      case 'studentManagement':
        steps = STUDENT_MANAGEMENT_STEPS;
        break;
      case 'examVariant':
        steps = EXAM_VARIANT_STEPS;
        break;
      case 'examParameter':
        steps = EXAM_PARAMETER_STEPS;
        break;
             case 'courseAnalytics':
         steps = COURSE_ANALYTICS_STEPS;
         break;
       case 'gradeAnalytics':
         steps = GRADE_ANALYTICS_STEPS;
         break;
       case 'userManagement':
         steps = USER_MANAGEMENT_STEPS;
         break;
      default:
        steps = COURSE_STEPS;
        break;
    }

    for (let i = 0; i < steps.length; i++) {
      if (!state.completedSteps.includes(steps[i])) {
        return i;
      }
    }
    return -1; // All completed, return -1
  };

  const value: OnboardingContextType = {
    state,
    startOnboarding,
    completeStep,
    skipTour,
    isStepCompleted,
    getNextIncompleteStep,
    isOnboardingComplete
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

// Custom hook to use onboarding context
export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export default OnboardingContext; 