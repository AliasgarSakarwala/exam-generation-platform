import React, { Suspense } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event';
import SettingsComponents from '../app/components/SettingsComponents'

// Same mocking pattern as registration.test.jsx
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

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

// Additional mocks for settings-specific dependencies
jest.mock('../services/profile', () => ({
  getUserData: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}))

jest.mock('../services/classroom', () => ({
  getClassroomStats: jest.fn(),
}));
jest.mock('../services/question', () => ({
  getQuestionsCount: jest.fn(),
}));

import { getClassroomStats } from '../services/classroom';
import { getQuestionsCount } from '../services/question';

// Mock user data matching the UserData interface
const mockUserData = {
  user_id: 1,
  role: 'Professor',
  username: 'John Doe',
  email: 'john@example.com',
  language: 'en',
  mode: 'light',
  is_active: true,
};

// Mock API responses
const mockApiResponses = {
  getUserData: {
    success: { status: 200, data: mockUserData },
    error: { status: 500, data: { message: 'Failed to fetch user data' } }
  },
  updateProfile: {
    success: { status: 200, data: { message: 'Profile updated successfully', user: mockUserData } },
    validationError: { status: 422, data: { message: 'Validation failed' } },
    networkError: { response: { data: { message: 'Network error' } } }
  },
  changePassword: {
    success: { status: 200, data: { message: 'Password changed successfully' } },
    invalidPassword: { status: 400, data: { message: 'Invalid old password' } },
    networkError: { response: { data: { message: 'Network error' } } }
  }
};

describe('SettingsComponents', () => {
  // Import mocked functions
  const { getUserData, updateProfile, changePassword } = require('../services/profile');
  const { success: toastSuccess, error: toastError } = require('react-hot-toast');

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set default successful response for getUserData
    getUserData.mockResolvedValue(mockApiResponses.getUserData.success);
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  it('renders the settings page with all sections', async () => {
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <SettingsComponents />
        </Suspense>
      )
    })

    // Verify page title
    const title = screen.getByText('Settings');
    expect(title).toBeInTheDocument();

    // Verify main sections
    const userDetailsSection = screen.getByText('User Details');
    const passwordSection = screen.getByText('Change Password');
    const systemSettingsSection = screen.getByText('System Settings');

    expect(userDetailsSection).toBeInTheDocument();
    expect(passwordSection).toBeInTheDocument();
    expect(systemSettingsSection).toBeInTheDocument();
  });

  it('displays user information correctly', async () => {
    await act(async () => {
      render(<SettingsComponents />)
    })

    // Verify user data displays
    const username = screen.getByDisplayValue('John Doe');
    const email = screen.getByDisplayValue('john@example.com');

    expect(username).toBeInTheDocument();
    expect(email).toBeInTheDocument();
  });

  it('displays user statistics correctly', async () => {
    await act(async () => {
      render(<SettingsComponents />)
    })

    // Verify statistics cards are present
    const courseCreated = screen.getByText('Course Created');
    const questionsAdded = screen.getByText('Questions Added');
    const totalStudents = screen.getByText('Total Students');

    expect(courseCreated).toBeInTheDocument();
    expect(questionsAdded).toBeInTheDocument();
    expect(totalStudents).toBeInTheDocument();

    // Verify statistics numbers using more specific selectors
    // Look for the numbers within their specific card contexts
    const courseCard = screen.getByText('Course Created').closest('div');
    const questionsCard = screen.getByText('Questions Added').closest('div');
    const studentsCard = screen.getByText('Total Students').closest('div');

    expect(courseCard).toHaveTextContent('1');
    expect(questionsCard).toHaveTextContent('0');
    expect(studentsCard).toHaveTextContent('0');
  });

  it('displays user profile header correctly', async () => {
    await act(async () => {
      render(<SettingsComponents />)
    })

    // Verify profile header elements
    const username = screen.getByText('John Doe');
    const email = screen.getByText('john@example.com');
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const editButton = editButtons[0]; // First button is the profile edit

    expect(username).toBeInTheDocument();
    expect(email).toBeInTheDocument();
    expect(editButton).toBeInTheDocument();
  });

  it('loads user data on component mount', async () => {
    await act(async () => {
      render(<SettingsComponents />)
    })

    // Verify API was called
    expect(getUserData).toHaveBeenCalledTimes(1);

    // Verify data is displayed
    const username = screen.getByDisplayValue('John Doe');
    expect(username).toBeInTheDocument();
  });

  it('handles data loading error gracefully', async () => {
    // Mock API failure
    getUserData.mockRejectedValue(mockApiResponses.getUserData.error);

    await act(async () => {
      render(<SettingsComponents />)
    })

    // Verify API was called
    expect(getUserData).toHaveBeenCalledTimes(1);

    // When API fails, component should not show settings content
    // (it stays in loading state, which is the expected behavior)
    expect(screen.queryByText('User Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Change Password')).not.toBeInTheDocument();
  });

  // ==== PROFILE MANAGEMENT TESTS ==== //

  it('toggles edit mode when Edit button is clicked', async () => {
    await act(async () => {
      render(<SettingsComponents />)
    })

    // Initially in view mode - fields should be readonly
    const usernameInput = screen.getByDisplayValue('John Doe');
    const emailInput = screen.getByDisplayValue('john@example.com');
    expect(usernameInput).toHaveAttribute('readonly');
    expect(emailInput).toHaveAttribute('readonly');

    // Click Edit button
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const editButton = editButtons[0]; // First button is the profile edit
    await userEvent.click(editButton);

    // Should now be in edit mode - fields should be editable
    const updatedUsernameInput = screen.getByDisplayValue('John Doe');
    const updatedEmailInput = screen.getByDisplayValue('john@example.com');
    expect(updatedUsernameInput).not.toHaveAttribute('readonly');
    expect(updatedEmailInput).not.toHaveAttribute('readonly');

    // Button should change to Save
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('allows editing user data in edit mode', async () => {
    await act(async () => {
      render(<SettingsComponents />)
    })

    // Enter edit mode
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const editButton = editButtons[0]; // First button is the profile edit
    await userEvent.click(editButton);

    // Change username
    const usernameInput = screen.getByDisplayValue('John Doe');
    await userEvent.clear(usernameInput);
    await userEvent.type(usernameInput, 'Jane Doe');

    // Verify the change
    expect(usernameInput).toHaveValue('Jane Doe');
  });

  it('saves profile changes successfully', async () => {
    updateProfile.mockResolvedValue(mockApiResponses.updateProfile.success);

    await act(async () => {
      render(<SettingsComponents />)
    })

    // Enter edit mode
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const editButton = editButtons[0]; // First button is the profile edit
    await userEvent.click(editButton);

    // Change username
    const usernameInput = screen.getByDisplayValue('John Doe');
    await userEvent.clear(usernameInput);
    await userEvent.type(usernameInput, 'Jane Doe');

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    // Verify API was called with correct data
    expect(updateProfile).toHaveBeenCalledWith({
      username: 'Jane Doe',
      email: 'john@example.com'
    });

    // Verify success toast
    expect(toastSuccess).toHaveBeenCalledWith('Profile updated successfully');
  });

  it('handles profile update failure', async () => {
    updateProfile.mockRejectedValue(mockApiResponses.updateProfile.networkError);

    await act(async () => {
      render(<SettingsComponents />)
    })

    // Enter edit mode and try to save
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const editButton = editButtons[0]; // First button is the profile edit
    await userEvent.click(editButton);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    // Should show error toast
    expect(toastError).toHaveBeenCalledWith('Network error');

    // Should revert to edit mode (button should still say Save)
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  // ==== PASSWORD MANAGEMENT TESTS ==== //

  it('renders password change form correctly', async () => {
    await act(async () => {
      render(<SettingsComponents />)
    })

    // Verify password fields exist
    const oldPasswordInput = screen.getByPlaceholderText('Enter Old Password');
    const newPasswordInput = screen.getByPlaceholderText('Enter New Password');

    expect(oldPasswordInput).toBeInTheDocument();
    expect(newPasswordInput).toBeInTheDocument();
    expect(oldPasswordInput).toHaveAttribute('type', 'password');
    expect(newPasswordInput).toHaveAttribute('type', 'password');
  });

  it('allows typing in password fields', async () => {
    await act(async () => {
      render(<SettingsComponents />)
    })

    const oldPasswordInput = screen.getByPlaceholderText('Enter Old Password');
    const newPasswordInput = screen.getByPlaceholderText('Enter New Password');

    // Type in both fields
    await userEvent.type(oldPasswordInput, 'oldpassword123');
    await userEvent.type(newPasswordInput, 'newpassword123');

    // Verify the values
    expect(oldPasswordInput).toHaveValue('oldpassword123');
    expect(newPasswordInput).toHaveValue('newpassword123');
  });

  it('submits password change successfully', async () => {
    changePassword.mockResolvedValue(mockApiResponses.changePassword.success);

    await act(async () => {
      render(<SettingsComponents />)
    })

    // Fill password form
    const oldPasswordInput = screen.getByPlaceholderText('Enter Old Password');
    const newPasswordInput = screen.getByPlaceholderText('Enter New Password');

    await userEvent.type(oldPasswordInput, 'oldpassword123');
    await userEvent.type(newPasswordInput, 'newpassword123');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    await userEvent.click(submitButton);

    // Verify API was called with correct data
    expect(changePassword).toHaveBeenCalledWith({
      oldPassword: 'oldpassword123',
      newPassword: 'newpassword123'
    });

    // Verify success toast
    expect(toastSuccess).toHaveBeenCalledWith('Password changed successfully');
  });

  it('handles password change failure', async () => {
    changePassword.mockRejectedValue(mockApiResponses.changePassword.networkError);

    await act(async () => {
      render(<SettingsComponents />)
    })

    // Fill and submit password form
    const oldPasswordInput = screen.getByPlaceholderText('Enter Old Password');
    const newPasswordInput = screen.getByPlaceholderText('Enter New Password');

    await userEvent.type(oldPasswordInput, 'oldpassword123');
    await userEvent.type(newPasswordInput, 'newpassword123');

    const submitButton = screen.getByRole('button', { name: /submit request/i });
    await userEvent.click(submitButton);

    // Should show error toast
    expect(toastError).toHaveBeenCalledWith('Network error');
  });

  // ==== SYSTEM SETTINGS TESTS ==== //

  it('renders system settings cards correctly', async () => {
    await act(async () => {
      render(<SettingsComponents />)
    })

    // Verify system cards exist
    const languageCard = screen.getByText('Change Language');
    const reportCard = screen.getByText('Report a Problem');

    expect(languageCard).toBeInTheDocument();
    expect(reportCard).toBeInTheDocument();
  });

  it('allows clicking on system setting cards', async () => {
    await act(async () => {
      render(<SettingsComponents />)
    })

    const languageCard = screen.getByText('Change Language');

    // Click the card
    await userEvent.click(languageCard);

    // The card should be clickable (we can't easily test the visual selection
    // without complex DOM queries, but we can verify the click doesn't crash)
    expect(languageCard).toBeInTheDocument();
  });

  it('displays system settings section header', async () => {
    await act(async () => {
      render(<SettingsComponents />)
    })

    const systemSettingsHeader = screen.getByText('System Settings');
    expect(systemSettingsHeader).toBeInTheDocument();
  });
})

describe('SettingsComponents - StatCard values', () => {
  beforeEach(() => {
    getClassroomStats.mockResolvedValue({
      status: 200,
      data: { courses_created: 5, total_students: 42 }
    });
    getQuestionsCount.mockResolvedValue({
      status: 200,
      data: { questions_added: 17 }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays correct StatCard values', async () => {
    await act(async () => {
      render(<SettingsComponents />);
    });
    expect(screen.getByText('Courses Created').closest('div')).toHaveTextContent('5');
    expect(screen.getByText('Total Students').closest('div')).toHaveTextContent('42');
    expect(screen.getByText('Questions Added').closest('div')).toHaveTextContent('17');
  });
}); 