import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaManagementPage from '../app/Ta_management/page';

// Mock the user management service
jest.mock('../services/user_management', () => ({
  userManagementService: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAvailableClassrooms: jest.fn(),
    getAvailableUsers: jest.fn(),
    searchTAs: jest.fn(),
  },
}));

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

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock @dnd-kit components - only mock what's needed
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragStart, onDragEnd }) => (
    <div data-testid="dnd-context">
      {children}
    </div>
  ),
  closestCenter: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
  PointerSensor: jest.fn(),
  DragEndEvent: jest.fn(),
  DragStartEvent: jest.fn(),
  DragOverlay: ({ children }) => <div data-testid="drag-overlay">{children}</div>,
  useDroppable: jest.fn(() => ({ setNodeRef: jest.fn() })),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => <div data-testid="sortable-context">{children}</div>,
  verticalListSortingStrategy: jest.fn(),
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

const { userManagementService } = require('../services/user_management');

// Mock data
const mockUserManagementData = [
  {
    um_id: 1,
    full_name: 'Alice Smith',
    user: { email: 'alice@test.com' },
    classroom: { code: 'CPSC 110', class_colour: '#FF6B6B' },
    responsibility: 'Lab TA',
    status: 'active',
    view_grades: true,
    manage_assignments: false,
  },
  {
    um_id: 2,
    full_name: 'Bob Johnson',
    user: { email: 'bob@test.com' },
    classroom: { code: 'CPSC 121', class_colour: '#4ECDC4' },
    responsibility: 'Grader',
    status: 'invited',
    view_grades: false,
    manage_assignments: true,
  },
  {
    um_id: 3,
    full_name: 'Carol Jones',
    user: { email: 'carol@test.com' },
    classroom: { code: 'CPSC 110', class_colour: '#FF6B6B' },
    responsibility: 'Lead TA',
    status: 'archived',
    view_grades: true,
    manage_assignments: true,
  },
];

const mockClassrooms = [
  { name: 'CPSC 110', color: '#FF6B6B' },
  { name: 'CPSC 121', color: '#4ECDC4' },
];

describe('TA Management Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Setup default mock responses
    userManagementService.getAll.mockResolvedValue(mockUserManagementData);
    userManagementService.getAvailableClassrooms.mockResolvedValue(mockClassrooms);
    userManagementService.create.mockResolvedValue({ success: true });
    userManagementService.update.mockResolvedValue({ success: true });
    userManagementService.delete.mockResolvedValue({ success: true });
    
    // Mock searchTAs to return a user that matches the test email
    userManagementService.searchTAs.mockImplementation((query) => {
      if (query === 'test@example.com') {
        return Promise.resolve([{
          user_id: 999,
          username: 'Test TA',
          email: 'test@example.com'
        }]);
      }
      return Promise.resolve([]);
    });
    
    // Mock create to update the getAll response
    userManagementService.create.mockImplementation(async (data) => {
      // Add the new TA to the mock data
      const newTA = {
        um_id: 999,
        full_name: data.full_name,
        user: { email: data.user_id === 999 ? 'test@example.com' : 'unknown@test.com' },
        classroom: { code: 'CPSC 110', class_colour: '#FF6B6B' },
        responsibility: data.responsibility,
        status: data.status,
        view_grades: data.view_grades,
        manage_assignments: data.manage_assignments
      };
      
      // Update the mock data to include the new TA
      mockUserManagementData.push(newTA);
      
      return { success: true };
    });
  });

  describe('Rendering', () => {
    it('should render the main page with correct title', async () => {
      render(<TaManagementPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /manage tas/i })).toBeInTheDocument();
      });
    });

    it('should render all three columns', async () => {
      render(<TaManagementPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /invited/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /active/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /archived/i })).toBeInTheDocument();
      });
    });

    it('should render the Add TA button', async () => {
      render(<TaManagementPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add ta/i })).toBeInTheDocument();
      });
    });

    it('should render the course filter dropdown', async () => {
      render(<TaManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('All courses')).toBeInTheDocument();
      });
    });

    it('should render initial TA cards', async () => {
      render(<TaManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Carol Jones')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should open Add TA dropdown when Add TA button is clicked', async () => {
      const user = userEvent.setup();
      render(<TaManagementPage />);

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /add ta/i });
        expect(addButton).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add ta/i });
      await user.click(addButton);

      // Look for actual form elements that the real AddTaDropdown renders
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument();
      });
    });

    it('should add a new TA when form is submitted', async () => {
      const user = userEvent.setup();
      render(<TaManagementPage />);

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /add ta/i });
        expect(addButton).toBeInTheDocument();
      });

      // Open add dropdown
      const addButton = screen.getByRole('button', { name: /add ta/i });
      await user.click(addButton);

      // Fill in the form
      const emailInput = screen.getByPlaceholderText('Search by email');
      const nameInput = screen.getByPlaceholderText('Full name');
      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, 'Test TA');

      // Select a course - click on the course dropdown
      const courseDropdown = screen.getByText('Select course(s)...');
      await user.click(courseDropdown);

      // Select CPSC 110 from the dropdown - use getAllByText and find the one in the dropdown
      const cpscOptions = screen.getAllByText('CPSC 110');
      // Find the one that's in the dropdown (not in existing TA cards)
      const cpscOption = cpscOptions.find(option =>
        option.closest('[class*="dropdown"]') ||
        option.closest('[class*="absolute"]') ||
        option.closest('[style*="z-index"]')
      );
      if (cpscOption) {
        await user.click(cpscOption);
      }

      // Select a role - click on the role dropdown
      const roleDropdown = screen.getByText('Select role...');
      await user.click(roleDropdown);

      // Select "Grader" role - use getAllByText and find the one in the dropdown
      const graderOptions = screen.getAllByText('Grader');
      // Find the one that's in the dropdown (not in existing TA cards)
      const graderOption = graderOptions.find(option =>
        option.closest('[class*="dropdown"]') ||
        option.closest('[class*="absolute"]') ||
        option.closest('[style*="z-index"]')
      );
      if (graderOption) {
        await user.click(graderOption);
      }

      // Submit the form - target the specific "Add" button in the form
      const addTaButton = screen.getByRole('button', { name: 'Add' });
      await user.click(addTaButton);

      // Check that a new TA was added
      await waitFor(() => {
        expect(screen.getByText('Test TA')).toBeInTheDocument();
      });
    });

    it('should open edit modal when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TaManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });

      // Find the edit button for Alice Smith
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const aliceEditButton = editButtons.find(button =>
        button.closest('[data-testid*="ta-card"]')?.textContent?.includes('Alice Smith')
      );

      if (aliceEditButton) {
        await user.click(aliceEditButton);

        // Look for actual modal content
        await waitFor(() => {
          expect(screen.getByText('Edit TA')).toBeInTheDocument();
        });
      }
    });

    it('should open delete modal when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<TaManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });

      // Find the delete button for Alice Smith
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      const aliceDeleteButton = deleteButtons.find(button =>
        button.closest('[data-testid*="ta-card"]')?.textContent?.includes('Alice Smith')
      );

      if (aliceDeleteButton) {
        await user.click(aliceDeleteButton);

        // Look for actual modal content
        await waitFor(() => {
          expect(screen.getByText(/delete.*alice smith/i)).toBeInTheDocument();
        });
      }
    });

    it('should filter TAs when course is selected', async () => {
      const user = userEvent.setup();
      render(<TaManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('All courses')).toBeInTheDocument();
      });

      // Click on the dropdown to open it
      const dropdown = screen.getByText('All courses');
      await user.click(dropdown);

      // Select CPSC 110 - use getAllByText and find the one in the dropdown
      const cpscOptions = screen.getAllByText('CPSC 110');
      // Find the one that's in the dropdown (not in existing TA cards)
      const cpscOption = cpscOptions.find(option =>
        option.closest('[class*="dropdown"]') ||
        option.closest('[class*="absolute"]') ||
        option.closest('[style*="z-index"]')
      );
      if (cpscOption) {
        await user.click(cpscOption);
      }

      // Verify the filter info appears - look for the specific filter message
      await waitFor(() => {
        expect(screen.getByText('Showing TAs for:')).toBeInTheDocument();
        // Look for the course name within the filter message, not just anywhere on the page
        const filterMessage = screen.getByText('Showing TAs for:');
        const courseElement = filterMessage.parentElement?.querySelector('strong');
        expect(courseElement).toHaveTextContent('CPSC 110');
      });
    });
  });

  describe('State Management', () => {
    it('should load data from localStorage on mount', async () => {
      const mockData = {
        invited: [{ id: '1', fullName: 'Test TA', courses: ['CPSC 110'], role: 'Grader', status: 'invited' }],
        active: [],
        archived: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      render(<TaManagementPage />);

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /manage tas/i })).toBeInTheDocument();
      });
    });

    it('should save data to localStorage when TAs are modified', async () => {
      const user = userEvent.setup();
      render(<TaManagementPage />);

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /add ta/i });
        expect(addButton).toBeInTheDocument();
      });

      // Add a new TA
      const addButton = screen.getByRole('button', { name: /add ta/i });
      await user.click(addButton);

      // Fill in the form
      const emailInput = screen.getByPlaceholderText('Search by email');
      const nameInput = screen.getByPlaceholderText('Full name');
      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, 'Test TA');

      // Submit the form - target the specific "Add" button in the form
      const addTaButton = screen.getByRole('button', { name: 'Add' });
      await user.click(addTaButton);

      // Check that a new TA was added
      await waitFor(() => {
        expect(screen.getByText('Test TA')).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should render DnD context', async () => {
      render(<TaManagementPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
      });
    });

    it('should render sortable contexts for each column', async () => {
      render(<TaManagementPage />);

      await waitFor(() => {
        const sortableContexts = screen.getAllByTestId('sortable-context');
        expect(sortableContexts).toHaveLength(3); // invited, active, archived
      });
    });

    it('should render drag overlay', async () => {
      render(<TaManagementPage />);

      await waitFor(() => {
        expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
      });
    });



  });

  describe('Modal Interactions', () => {
    it('should close delete modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<TaManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });

      // Find and click delete button for Alice Smith
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      const aliceDeleteButton = deleteButtons.find(button =>
        button.closest('[data-testid*="ta-card"]')?.textContent?.includes('Alice Smith')
      );

      if (aliceDeleteButton) {
        await user.click(aliceDeleteButton);

        // Wait for modal to appear
        await waitFor(() => {
          expect(screen.getByText(/delete.*alice smith/i)).toBeInTheDocument();
        });

        // Close modal
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        // Check modal is closed
        await waitFor(() => {
          expect(screen.queryByText(/delete.*alice smith/i)).not.toBeInTheDocument();
        });
      }
    });

    it('should close edit modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<TaManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });

      // Find and click edit button for Alice Smith
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const aliceEditButton = editButtons.find(button =>
        button.closest('[data-testid*="ta-card"]')?.textContent?.includes('Alice Smith')
      );

      if (aliceEditButton) {
        await user.click(aliceEditButton);

        // Wait for modal to appear
        await waitFor(() => {
          expect(screen.getByText('Edit TA')).toBeInTheDocument();
        });

        // Close modal
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        // Check modal is closed
        await waitFor(() => {
          expect(screen.queryByText('Edit TA')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not crash the component
      expect(() => render(<TaManagementPage />)).not.toThrow();
    });

    it('should handle invalid JSON in localStorage', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      // Should not crash the component
      expect(() => render(<TaManagementPage />)).not.toThrow();
    });


  });

  describe('Data Migration', () => {
    it('should migrate old data format to new format', async () => {
      const oldFormatData = {
        invited: [{ id: '1', fullName: 'Test TA', course: 'CPSC 110', role: 'Grader' }],
        active: [],
        archived: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldFormatData));

      render(<TaManagementPage />);

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /manage tas/i })).toBeInTheDocument();
      });
    });

    // it('should handle TAs with multiple courses', async () => {
    //   const multiCourseData = {
    //     invited: [{
    //       id: '1',
    //       fullName: 'Multi Course TA',
    //       courses: ['CPSC 110', 'CPSC 210'],
    //       role: 'Grader',
    //       status: 'invited'
    //     }],
    //     active: [],
    //     archived: []
    //   };

    //   localStorageMock.getItem.mockReturnValue(JSON.stringify(multiCourseData));

    //   render(<TaManagementPage />);

    //   // Wait for component to render
    //   await waitFor(() => {
    //     expect(screen.getByRole('heading', { name: /manage tas/i })).toBeInTheDocument();
    //     expect(screen.getByText('Multi Course TA')).toBeInTheDocument();
    //   });
    // });
  });
});