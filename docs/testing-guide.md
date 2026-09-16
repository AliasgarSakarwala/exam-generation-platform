# Testing Guide for User Management (TA Management) System

## Table of Contents
1. [Overview](#overview)
2. [Testing Structure](#testing-structure)
3. [Backend Tests](#backend-tests)
4. [Frontend Tests](#frontend-tests)
5. [Running Tests](#running-tests)
6. [Test Categories Explained](#test-categories-explained)
7. [Writing New Tests](#writing-new-tests)
8. [Best Practices](#best-practices)

## Overview

This guide explains the comprehensive testing setup for the User Management (TA Management) system. The testing approach follows a **3-tier architecture**:

- **Backend Tests (Laravel/PHP)**: Test API endpoints, database operations, and business logic
- **Frontend Tests (Next.js/React)**: Test user interactions, component behavior, and UI functionality
- **Integration Tests**: Test the complete flow from frontend to backend

## Testing Structure

```
app/
├── backend/
│   ├── tests/
│   │   ├── Feature/
│   │   │   └── UserManagement/
│   │   │       └── UserManagementTest.php    # API endpoint tests
│   │   └── Unit/
│   │       └── UserManagementTest.php        # Model and logic tests
│   └── phpunit.xml                           # Test configuration
└── frontend/
    ├── __tests__/
    │   └── user-management.test.jsx          # Component tests
    ├── jest.config.ts                        # Jest configuration
    └── package.json                          # Test scripts
```

## Backend Tests

### Feature Tests (`UserManagementTest.php`)

**Purpose**: Test complete API endpoints and user workflows

**Key Test Categories**:

#### 1. **Authentication & Authorization Tests**
```php
public function test_professor_can_view_user_management_records(): void
public function test_professor_cannot_access_other_professors_records(): void
public function test_unauthenticated_requests_are_rejected(): void
```

**What they test**:
- ✅ Professors can see their own TA assignments
- ❌ Professors cannot see other professors' TA assignments
- ❌ Unauthenticated users cannot access any endpoints

#### 2. **CRUD Operation Tests**
```php
public function test_professor_can_create_user_management_record(): void
public function test_professor_can_update_user_management_record(): void
public function test_professor_can_delete_user_management_record(): void
public function test_cannot_create_duplicate_user_management_record(): void
```

**What they test**:
- ✅ Create new TA assignments
- ✅ Update existing TA assignments
- ✅ Delete TA assignments
- ❌ Prevent duplicate assignments (same TA in same course)

#### 3. **Helper Endpoint Tests**
```php
public function test_can_get_available_classrooms(): void
public function test_can_get_available_users(): void
public function test_can_search_tas(): void
```

**What they test**:
- ✅ Course filter dropdown data
- ✅ TA selection dropdown data
- ✅ TA search functionality

#### 4. **Validation Tests**
```php
public function test_validation_errors_for_invalid_data(): void
public function test_sequence_reset_when_table_becomes_empty(): void
```

**What they test**:
- ❌ Invalid input data is rejected
- ✅ Database sequence management

### Unit Tests (`UserManagementTest.php`)

**Purpose**: Test individual model methods and relationships

**Key Test Categories**:

#### 1. **Model Creation & Properties**
```php
public function test_can_create_user_management_record(): void
public function test_has_correct_table_and_primary_key(): void
public function test_has_correct_fillable_properties(): void
```

**What they test**:
- ✅ Model can be created with valid data
- ✅ Correct table name and primary key
- ✅ Fillable properties are set correctly

#### 2. **Relationships**
```php
public function test_user_management_has_correct_relationships(): void
```

**What they test**:
- ✅ Model can access related classroom data
- ✅ Model can access related user data

#### 3. **Data Type Casting**
```php
public function test_boolean_fields_are_correctly_cast(): void
public function test_validates_status_enum_values(): void
public function test_handles_null_responsibility(): void
```

**What they test**:
- ✅ Boolean fields are properly cast
- ✅ Enum values are validated
- ✅ Null values are handled correctly

#### 4. **Database Constraints**
```php
public function test_enforces_unique_constraint(): void
```

**What they test**:
- ❌ Duplicate records cannot be created

## Frontend Tests

### Component Tests (`user-management.test.jsx`)

**Purpose**: Test user interactions and component behavior

**Key Test Categories**:

#### 1. **Page Rendering Tests**
```javascript
it('should render the main page with correct title', async () => {
it('should render all three status columns', async () => {
it('should load and display TA data from the backend', async () => {
```

**What they test**:
- ✅ Page loads with correct title
- ✅ All three columns (Invited, Active, Archived) are displayed
- ✅ TA data is fetched and displayed from backend

#### 2. **API Integration Tests**
```javascript
it('should call getAll on component mount', async () => {
it('should handle API errors gracefully', async () => {
it('should handle empty data from API', async () => {
```

**What they test**:
- ✅ API calls are made on component mount
- ✅ Errors are handled gracefully
- ✅ Empty data states are handled

#### 3. **User Interaction Tests**
```javascript
it('should open Add TA dropdown when Add TA button is clicked', async () => {
it('should search for TAs when typing in email field', async () => {
it('should create new TA assignment when form is submitted', async () => {
```

**What they test**:
- ✅ Add TA dropdown opens correctly
- ✅ TA search functionality works
- ✅ Form submission creates new assignments

#### 4. **CRUD Operation Tests**
```javascript
it('should open edit modal when edit button is clicked', async () => {
it('should update TA information when edit form is submitted', async () => {
it('should show delete confirmation when delete button is clicked', async () => {
it('should delete TA when confirmation is accepted', async () => {
```

**What they test**:
- ✅ Edit functionality works
- ✅ Update operations work
- ✅ Delete confirmation and execution work

#### 5. **Filtering Tests**
```javascript
it('should filter TAs by selected course', async () => {
it('should show all TAs when "All courses" is selected', async () => {
```

**What they test**:
- ✅ Course filtering works correctly
- ✅ "All courses" option shows all TAs

#### 6. **Error Handling Tests**
```javascript
it('should display error message when API calls fail', async () => {
it('should handle validation errors from API', async () => {
```

**What they test**:
- ✅ Network errors are displayed
- ✅ Validation errors are handled

## Running Tests

### Backend Tests

```bash
# Navigate to backend directory
cd app/backend

# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/UserManagement/UserManagementTest.php
php artisan test tests/Unit/UserManagementTest.php

# Run tests with coverage
php artisan test --coverage

# Run tests in watch mode (for development)
php artisan test --watch
```

### Frontend Tests

```bash
# Navigate to frontend directory
cd app/frontend

# Run all tests
npm test

# Run specific test file
npm test user-management.test.jsx

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Commands Explained

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `php artisan test` | Run all backend tests | Before committing changes |
| `php artisan test --coverage` | Run tests with coverage report | To check test coverage |
| `php artisan test --watch` | Run tests in watch mode | During development |
| `npm test` | Run all frontend tests | Before committing changes |
| `npm run test:watch` | Run tests in watch mode | During development |
| `npm run test:coverage` | Run tests with coverage report | To check test coverage |

## Test Categories Explained

### 1. **Feature Tests vs Unit Tests**

**Feature Tests**:
- Test complete workflows
- Test API endpoints
- Test user interactions
- Test integration between components

**Unit Tests**:
- Test individual functions
- Test model properties
- Test business logic
- Test data validation

### 2. **Test Naming Conventions**

**Backend (PHP)**:
```php
public function test_professor_can_view_user_management_records(): void
public function test_cannot_create_duplicate_user_management_record(): void
public function test_validation_errors_for_invalid_data(): void
```

**Frontend (JavaScript)**:
```javascript
it('should render the main page with correct title', async () => {
it('should open Add TA dropdown when Add TA button is clicked', async () => {
it('should handle API errors gracefully', async () => {
```

### 3. **Test Structure Pattern**

**Backend Feature Test Pattern**:
```php
public function test_something(): void
{
    // 1. Setup test data
    $user = User::create([...]);
    
    // 2. Authenticate user
    $token = $user->createToken('test-token')->plainTextToken;
    
    // 3. Make API request
    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
    ])->getJson('/api/endpoint');
    
    // 4. Assert response
    $response->assertStatus(200);
    
    // 5. Clean up test data
    User::where('user_id', $user->user_id)->delete();
}
```

**Frontend Component Test Pattern**:
```javascript
it('should do something', async () => {
  // 1. Setup mocks
  userManagementService.getAll.mockResolvedValue(mockData);
  
  // 2. Render component
  render(<TaManagementPage />);
  
  // 3. Wait for async operations
  await waitFor(() => {
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  // 4. Perform user actions
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /button text/i }));
  
  // 5. Assert results
  expect(userManagementService.getAll).toHaveBeenCalled();
});
```

## Writing New Tests

### When to Write Tests

1. **New Features**: Always write tests for new functionality
2. **Bug Fixes**: Write tests to prevent regression
3. **Refactoring**: Ensure existing functionality still works
4. **Edge Cases**: Test boundary conditions and error scenarios

### Test-Driven Development (TDD) Process

1. **Write a failing test** for the feature you want to implement
2. **Write the minimum code** to make the test pass
3. **Refactor** the code while keeping tests green
4. **Repeat** for the next feature

### Example: Adding a New Feature

Let's say you want to add a "Bulk Delete" feature:

#### Step 1: Write the Backend Test
```php
public function test_professor_can_bulk_delete_ta_assignments(): void
{
    // Setup test data
    $user = User::create([...]);
    $token = $user->createToken('test-token')->plainTextToken;
    
    // Create multiple TA assignments
    $assignments = [
        UserManagement::create([...]),
        UserManagement::create([...]),
    ];
    
    // Test bulk delete endpoint
    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
    ])->postJson('/api/user-management/bulk-delete', [
        'ids' => [$assignments[0]->um_id, $assignments[1]->um_id]
    ]);
    
    // Assert response
    $response->assertStatus(200);
    
    // Verify records were deleted
    $this->assertDatabaseMissing('user_management', [
        'um_id' => $assignments[0]->um_id,
    ]);
}
```

#### Step 2: Write the Frontend Test
```javascript
it('should bulk delete selected TAs', async () => {
  const user = userEvent.setup();
  userManagementService.bulkDelete.mockResolvedValue({ success: true });
  
  render(<TaManagementPage />);
  
  // Select multiple TAs
  const checkboxes = screen.getAllByRole('checkbox');
  await user.click(checkboxes[0]);
  await user.click(checkboxes[1]);
  
  // Click bulk delete button
  const bulkDeleteButton = screen.getByRole('button', { name: /bulk delete/i });
  await user.click(bulkDeleteButton);
  
  // Confirm deletion
  const confirmButton = screen.getByRole('button', { name: /confirm/i });
  await user.click(confirmButton);
  
  expect(userManagementService.bulkDelete).toHaveBeenCalledWith([1, 2]);
});
```

#### Step 3: Implement the Feature
```php
// Backend: Add controller method
public function bulkDelete(Request $request): JsonResponse
{
    $ids = $request->input('ids');
    UserManagement::whereIn('um_id', $ids)->delete();
    return response()->json(['success' => true]);
}
```

```javascript
// Frontend: Add service method
async bulkDelete(ids: number[]): Promise<any> {
  const response = await api.post('/user-management/bulk-delete', { ids });
  return response.data;
}
```

## Best Practices

### 1. **Test Organization**
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern

### 2. **Test Data Management**
- Use factories for creating test data
- Clean up test data after each test
- Use unique identifiers to avoid conflicts

### 3. **Mocking**
- Mock external dependencies (APIs, databases)
- Don't mock the code you're testing
- Use realistic mock data

### 4. **Assertions**
- Test one thing per test
- Use specific assertions
- Test both positive and negative cases

### 5. **Error Handling**
- Test error scenarios
- Test edge cases
- Test validation errors

### 6. **Performance**
- Keep tests fast
- Use in-memory databases for testing
- Avoid unnecessary setup/teardown

### 7. **Maintenance**
- Update tests when features change
- Remove obsolete tests
- Keep test data up to date

## Common Testing Patterns

### 1. **Testing API Endpoints**
```php
// Test successful request
$response = $this->withHeaders([
    'Authorization' => 'Bearer ' . $token,
])->getJson('/api/endpoint');

$response->assertStatus(200)
         ->assertJsonStructure(['data']);

// Test error response
$response = $this->getJson('/api/endpoint');
$response->assertStatus(401);
```

### 2. **Testing User Interactions**
```javascript
// Test button clicks
const user = userEvent.setup();
await user.click(screen.getByRole('button', { name: /add/i }));

// Test form inputs
await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');

// Test dropdowns
await user.click(screen.getByText('Select option'));
await user.click(screen.getByText('Option 1'));
```

### 3. **Testing Async Operations**
```javascript
// Wait for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded data')).toBeInTheDocument();
});

// Test loading states
expect(screen.getByText('Loading...')).toBeInTheDocument();
await waitFor(() => {
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
});
```

### 4. **Testing Error States**
```javascript
// Mock API error
userManagementService.getAll.mockRejectedValue(new Error('Network error'));

// Test error display
await waitFor(() => {
  expect(screen.getByText(/error/i)).toBeInTheDocument();
});
```

This comprehensive testing guide should help you understand, run, and extend the tests for the User Management system. Remember to run tests frequently during development to catch issues early! 