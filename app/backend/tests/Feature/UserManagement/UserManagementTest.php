<?php

namespace Tests\Feature\UserManagement;

use App\Models\User;
use App\Models\Classroom;
use App\Models\UserManagement;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class UserManagementTest extends TestCase
{

    private $professorUser;
    private $classroom;
    private $token;
    private $uniqueId;
    private $testUserId;
    private $testClassroomId;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a professor user for testing with unique identifier
        $this->uniqueId = substr(uniqid(), -6); // Use only last 6 characters
        $this->testUserId = rand(10000, 99999);
        $this->testClassroomId = rand(10000, 99999);
        
        // Insert test user directly into database like other working tests
        DB::table('user')->insert([
            'user_id' => $this->testUserId,
            'role' => 'Professor',
            'username' => 'test_prof_' . $this->uniqueId,
            'email' => 'prof_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);

        $this->professorUser = User::find($this->testUserId);

        // Create a classroom for the professor
        DB::table('classroom')->insert([
            'classroom_id' => $this->testClassroomId,
            'name' => 'Test Course',
            'code' => 'T101' . $this->uniqueId,
            'description' => 'Test course description',
            'user_id' => $this->testUserId,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->classroom = Classroom::find($this->testClassroomId);

        // Create authentication token
        $this->token = $this->professorUser->createToken('test-token')->plainTextToken;
    }

    protected function tearDown(): void
    {
        // Clean up test data
        UserManagement::where('classroom_id', $this->testClassroomId)->delete();
        Classroom::where('classroom_id', $this->testClassroomId)->delete();
        User::where('user_id', $this->testUserId)->delete();
        
        parent::tearDown();
    }

    /**
     * Test: Professor can view all user management records for their classrooms
     * Purpose: Verify that professors can see all TA assignments in their courses
     */
    public function test_professor_can_view_user_management_records(): void
    {
        // Create a TA user
        $taUserId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $taUserId,
            'role' => 'TA',
            'username' => 'test_ta_' . $this->uniqueId,
            'email' => 'ta_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $taUser = User::find($taUserId);

        // Create a user management record
        $userManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Lead TA',
            'status' => 'active',
            'full_name' => 'Test TA',
            'view_grades' => true,
            'manage_assignments' => false,
        ]);

        // Test the endpoint
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/user-management');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'um_id',
                            'classroom_id',
                            'user_id',
                            'responsibility',
                            'status',
                            'full_name',
                            'view_grades',
                            'manage_assignments',
                            'classroom' => [
                                'classroom_id',
                                'name',
                                'code'
                            ],
                            'user' => [
                                'user_id',
                                'email',
                                'role'
                            ]
                        ]
                    ]
                ]);

        $this->assertTrue($response->json('success'));
        $this->assertCount(1, $response->json('data'));

        // Clean up
        UserManagement::where('um_id', $userManagement->um_id)->delete();
        User::where('user_id', $taUser->user_id)->delete();
    }

    /**
     * Test: Professor cannot access other professors' user management records
     * Purpose: Verify authorization - professors can only see their own TA assignments
     */
    public function test_professor_cannot_access_other_professors_records(): void
    {
        // Create another professor
        $otherProfUserId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $otherProfUserId,
            'role' => 'Professor',
            'username' => 'other_prof_' . $this->uniqueId,
            'email' => 'other_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $otherProfessorUser = User::find($otherProfUserId);

        // Create another classroom for the other professor
        $otherClassroomId = rand(10000, 99999);
        DB::table('classroom')->insert([
            'classroom_id' => $otherClassroomId,
            'name' => 'Other Course',
            'code' => 'OTHER' . $this->uniqueId,
            'description' => 'Other course description',
            'user_id' => $otherProfUserId,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $otherClassroom = Classroom::find($otherClassroomId);

        // Create a TA user
        $taUserId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $taUserId,
            'role' => 'TA',
            'username' => 'other_ta_' . $this->uniqueId,
            'email' => 'other_ta_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $taUser = User::find($taUserId);

        // Create a user management record for the other professor's classroom
        $userManagement = UserManagement::create([
            'classroom_id' => $otherClassroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Grader',
            'status' => 'active',
            'full_name' => 'Other TA',
            'view_grades' => false,
            'manage_assignments' => true,
        ]);

        // Test that our professor cannot see the other professor's records
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/user-management');

        $response->assertStatus(200);
        
        // Should not contain the other professor's records
        $data = $response->json('data');
        $this->assertEmpty($data);

        // Clean up
        UserManagement::where('um_id', $userManagement->um_id)->delete();
        User::where('user_id', $taUser->user_id)->delete();
        Classroom::where('classroom_id', $otherClassroom->classroom_id)->delete();
        User::where('user_id', $otherProfessorUser->user_id)->delete();
    }

    /**
     * Test: Professor can create a new user management record
     * Purpose: Verify the ability to assign TAs to courses
     */
    public function test_professor_can_create_user_management_record(): void
    {
        // Create a TA user
        $taUserId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $taUserId,
            'role' => 'TA',
            'username' => 'new_ta_' . $this->uniqueId,
            'email' => 'new_ta_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $taUser = User::find($taUserId);

        $userManagementData = [
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Lab TA',
            'status' => 'invited',
            'full_name' => 'New TA',
            'view_grades' => true,
            'manage_assignments' => true,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/user-management', $userManagementData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'um_id',
                        'classroom_id',
                        'user_id',
                        'responsibility',
                        'status',
                        'full_name',
                        'view_grades',
                        'manage_assignments'
                    ]
                ]);

        $this->assertTrue($response->json('success'));
        
        // Verify the record was created in the database
        $this->assertDatabaseHas('user_management', [
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Lab TA',
            'status' => 'invited',
            'full_name' => 'New TA',
            'view_grades' => true,
            'manage_assignments' => true,
        ]);

        // Clean up
        UserManagement::where('user_id', $taUser->user_id)->delete();
        User::where('user_id', $taUser->user_id)->delete();
    }

    /**
     * Test: Cannot create duplicate user management record
     * Purpose: Verify that the same TA cannot be assigned to the same course twice
     */
    public function test_cannot_create_duplicate_user_management_record(): void
    {
        // Create a TA user
        $taUserId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $taUserId,
            'role' => 'TA',
            'username' => 'duplicate_ta_' . $this->uniqueId,
            'email' => 'duplicate_ta_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $taUser = User::find($taUserId);

        // Create first record
        UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Grader',
            'status' => 'active',
            'full_name' => 'Duplicate TA',
            'view_grades' => false,
            'manage_assignments' => true,
        ]);

        // Try to create duplicate record
        $duplicateData = [
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Lead TA',
            'status' => 'invited',
            'full_name' => 'Duplicate TA',
            'view_grades' => true,
            'manage_assignments' => false,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/user-management', $duplicateData);

        $response->assertStatus(409)
                ->assertJson([
                    'success' => false,
                    'message' => 'User is already assigned to this classroom'
                ]);

        // Clean up
        UserManagement::where('user_id', $taUser->user_id)->delete();
        User::where('user_id', $taUser->user_id)->delete();
    }

    /**
     * Test: Professor can update a user management record
     * Purpose: Verify the ability to modify TA assignments and permissions
     */
    public function test_professor_can_update_user_management_record(): void
    {
        // Create a TA user
        $taUserId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $taUserId,
            'role' => 'TA',
            'username' => 'update_ta_' . $this->uniqueId,
            'email' => 'update_ta_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $taUser = User::find($taUserId);

        // Create initial record
        $userManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Grader',
            'status' => 'invited',
            'full_name' => 'Update TA',
            'view_grades' => false,
            'manage_assignments' => false,
        ]);

        // Update the record
        $updateData = [
            'responsibility' => 'Lead TA',
            'status' => 'active',
            'view_grades' => true,
            'manage_assignments' => true,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->patchJson("/api/user-management/{$userManagement->um_id}", $updateData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'um_id',
                        'classroom_id',
                        'user_id',
                        'responsibility',
                        'status',
                        'full_name',
                        'view_grades',
                        'manage_assignments'
                    ]
                ]);

        $this->assertTrue($response->json('success'));
        
        // Verify the record was updated in the database
        $this->assertDatabaseHas('user_management', [
            'um_id' => $userManagement->um_id,
            'responsibility' => 'Lead TA',
            'status' => 'active',
            'view_grades' => true,
            'manage_assignments' => true,
        ]);

        // Clean up
        UserManagement::where('um_id', $userManagement->um_id)->delete();
        User::where('user_id', $taUser->user_id)->delete();
    }

    /**
     * Test: Professor can delete a user management record
     * Purpose: Verify the ability to remove TA assignments
     */
    public function test_professor_can_delete_user_management_record(): void
    {
        // Create a TA user
        $taUserId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $taUserId,
            'role' => 'TA',
            'username' => 'delete_ta_' . $this->uniqueId,
            'email' => 'delete_ta_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $taUser = User::find($taUserId);

        // Create a record to delete
        $userManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Grader',
            'status' => 'active',
            'full_name' => 'Delete TA',
            'view_grades' => true,
            'manage_assignments' => false,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson("/api/user-management/{$userManagement->um_id}");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'User management record deleted successfully'
                ]);

        // Verify the record was deleted from the database
        $this->assertDatabaseMissing('user_management', [
            'um_id' => $userManagement->um_id,
        ]);

        // Clean up
        User::where('user_id', $taUser->user_id)->delete();
    }

    /**
     * Test: Can get available classrooms for the authenticated professor
     * Purpose: Verify the course filter dropdown functionality
     */
    public function test_can_get_available_classrooms(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/user-management/available/classrooms');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'classroom_id',
                            'name',
                            'color',
                            'full_name'
                        ]
                    ]
                ]);

        $this->assertTrue($response->json('success'));
        $this->assertCount(1, $response->json('data'));
        
        $classroom = $response->json('data')[0];
        $this->assertEquals($this->classroom->classroom_id, $classroom['classroom_id']);
        $this->assertEquals($this->classroom->code, $classroom['name']); // Controller uses code as name
        $this->assertEquals($this->classroom->name, $classroom['full_name']); // Controller uses name as full_name
    }

    /**
     * Test: Can get available users (TAs) for assignment
     * Purpose: Verify the TA selection dropdown functionality
     */
    public function test_can_get_available_users(): void
    {
        // Create some TA users
        $ta1Id = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $ta1Id,
            'role' => 'TA',
            'username' => 'available_ta1_' . $this->uniqueId,
            'email' => 'available_ta1_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $ta1 = User::find($ta1Id);

        $ta2Id = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $ta2Id,
            'role' => 'TA',
            'username' => 'available_ta2_' . $this->uniqueId,
            'email' => 'available_ta2_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $ta2 = User::find($ta2Id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/user-management/available/users');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'user_id',
                            'email',
                            'role'
                        ]
                    ]
                ]);

        $this->assertTrue($response->json('success'));
        
        $users = $response->json('data');
        $this->assertGreaterThanOrEqual(2, count($users));

        // Verify TAs are in the response
        $taEmails = array_column($users, 'email');
        $this->assertContains('available_ta1_' . $this->uniqueId . '@test.com', $taEmails);
        $this->assertContains('available_ta2_' . $this->uniqueId . '@test.com', $taEmails);

        // Clean up
        User::where('user_id', $ta1->user_id)->delete();
        User::where('user_id', $ta2->user_id)->delete();
    }

    /**
     * Test: Can search TAs by name or email
     * Purpose: Verify the TA search functionality in the dropdown
     */
    public function test_can_search_tas(): void
    {
        // Create some TA users
        $ta1Id = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $ta1Id,
            'role' => 'TA',
            'username' => 'search_ta1_' . $this->uniqueId,
            'email' => 'john.doe_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $ta1 = User::find($ta1Id);

        $ta2Id = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $ta2Id,
            'role' => 'TA',
            'username' => 'search_ta2_' . $this->uniqueId,
            'email' => 'jane.smith_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $ta2 = User::find($ta2Id);

        // Search by email
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/user-management/search/tas?query=john.doe_' . $this->uniqueId);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'user_id',
                            'username',
                            'email'
                        ]
                    ]
                ]);

        $this->assertTrue($response->json('success'));
        
        $users = $response->json('data');
        $this->assertCount(1, $users);
        $this->assertEquals('john.doe_' . $this->uniqueId . '@test.com', $users[0]['email']);

        // Clean up
        User::where('user_id', $ta1->user_id)->delete();
        User::where('user_id', $ta2->user_id)->delete();
    }

    /**
     * Test: Validation errors for invalid data
     * Purpose: Verify that the API properly validates input data
     */
    public function test_validation_errors_for_invalid_data(): void
    {
        // Test missing required fields
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/user-management', []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['classroom_id', 'user_id', 'status', 'full_name']);

        // Test invalid status
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/user-management', [
            'classroom_id' => 999, // Non-existent classroom
            'user_id' => 999, // Non-existent user
            'status' => 'invalid_status',
            'full_name' => 'Test TA',
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['classroom_id', 'user_id', 'status']);

        // Test invalid boolean values
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/user-management', [
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => 999,
            'status' => 'invited',
            'full_name' => 'Test TA',
            'view_grades' => 'not_boolean',
            'manage_assignments' => 'not_boolean',
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['user_id', 'view_grades', 'manage_assignments']);
    }

    /**
     * Test: Unauthenticated requests are rejected
     * Purpose: Verify that authentication is required for all endpoints
     */
    public function test_unauthenticated_requests_are_rejected(): void
    {
        // Test without token
        $response = $this->getJson('/api/user-management');
        $response->assertStatus(401);

        $response = $this->postJson('/api/user-management', []);
        $response->assertStatus(401);

        $response = $this->patchJson('/api/user-management/1', []);
        $response->assertStatus(401);

        $response = $this->deleteJson('/api/user-management/1');
        $response->assertStatus(401);

        $response = $this->getJson('/api/user-management/available/classrooms');
        $response->assertStatus(401);

        $response = $this->getJson('/api/user-management/available/users');
        $response->assertStatus(401);

        $response = $this->getJson('/api/user-management/search/tas?query=test');
        $response->assertStatus(401);
    }

    /**
     * Test: Sequence reset when table becomes empty
     * Purpose: Verify that the UM_ID sequence resets to 1 when the table is empty
     */
    public function test_sequence_reset_when_table_becomes_empty(): void
    {
        // Create a TA user
        $taUserId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $taUserId,
            'role' => 'TA',
            'username' => 'sequence_ta_' . $this->uniqueId,
            'email' => 'sequence_ta_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $taUser = User::find($taUserId);

        // Create a record
        $userManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Grader',
            'status' => 'active',
            'full_name' => 'Sequence TA',
            'view_grades' => true,
            'manage_assignments' => false,
        ]);

        // Verify the record was created with an ID
        $this->assertNotNull($userManagement->um_id);

        // Delete the record
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson("/api/user-management/{$userManagement->um_id}");

        $response->assertStatus(200);

        // Create a new record - it should get ID 1 if sequence was reset
        $newUserManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Lead TA',
            'status' => 'invited',
            'full_name' => 'Sequence TA 2',
            'view_grades' => false,
            'manage_assignments' => true,
        ]);

        // Clean up
        UserManagement::where('um_id', $newUserManagement->um_id)->delete();
        User::where('user_id', $taUser->user_id)->delete();
    }

    /**
     * Test: Professor can view individual user management record
     * Purpose: Verify the show method functionality
     */
    public function test_professor_can_view_individual_user_management_record(): void
    {
        // Create a TA user
        $taUserId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $taUserId,
            'role' => 'TA',
            'username' => 'show_ta_' . $this->uniqueId,
            'email' => 'show_ta_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $taUser = User::find($taUserId);

        // Create a user management record
        $userManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Lead TA',
            'status' => 'active',
            'full_name' => 'Show TA',
            'view_grades' => true,
            'manage_assignments' => true,
        ]);

        // Test the show endpoint
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/user-management/{$userManagement->um_id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'um_id',
                        'classroom_id',
                        'user_id',
                        'responsibility',
                        'status',
                        'full_name',
                        'view_grades',
                        'manage_assignments',
                        'classroom',
                        'user'
                    ]
                ]);

        $this->assertTrue($response->json('success'));
        $this->assertEquals($userManagement->um_id, $response->json('data.um_id'));
        $this->assertEquals('Show TA', $response->json('data.full_name'));

        // Clean up
        UserManagement::where('um_id', $userManagement->um_id)->delete();
        User::where('user_id', $taUser->user_id)->delete();
    }

    /**
     * Test: Show method returns 404 for non-existent record
     * Purpose: Verify error handling for show method
     */
    public function test_show_method_returns_404_for_nonexistent_record(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/user-management/99999');

        $response->assertStatus(404)
                ->assertJson([
                    'success' => false,
                    'message' => 'User management record not found'
                ]);
    }







    /**
     * Test: Update method returns 404 for non-existent record
     * Purpose: Verify error handling for update method
     */
    public function test_update_method_returns_404_for_nonexistent_record(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->patchJson('/api/user-management/99999', [
            'status' => 'active'
        ]);

        $response->assertStatus(404)
                ->assertJson([
                    'success' => false,
                    'message' => 'User management record not found'
                ]);
    }

    /**
     * Test: Delete method returns 404 for non-existent record
     * Purpose: Verify error handling for delete method
     */
    public function test_delete_method_returns_404_for_nonexistent_record(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson('/api/user-management/99999');

        $response->assertStatus(404)
                ->assertJson([
                    'success' => false,
                    'message' => 'User management record not found'
                ]);
    }

    /**
     * Test: Search TAs with empty query returns empty results
     * Purpose: Verify edge case handling for search functionality
     */
    public function test_search_tas_with_empty_query_returns_empty_results(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/user-management/search/tas?query=');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => []
                ]);
    }

    /**
     * Test: Search TAs with short query returns empty results
     * Purpose: Verify minimum query length validation
     */
    public function test_search_tas_with_short_query_returns_empty_results(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/user-management/search/tas?query=a');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => []
                ]);
    }

    /**
     * Test: Create user management record with all optional fields
     * Purpose: Verify complete data creation with all fields
     */
    public function test_create_user_management_record_with_all_optional_fields(): void
    {
        // Create a TA user
        $taUserId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $taUserId,
            'role' => 'TA',
            'username' => 'optional_ta_' . $this->uniqueId,
            'email' => 'optional_ta_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $taUser = User::find($taUserId);

        $userManagementData = [
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Lab Assistant with Special Duties',
            'status' => 'invited',
            'full_name' => 'Optional Fields TA',
            'view_grades' => true,
            'manage_assignments' => true,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/user-management', $userManagementData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'um_id',
                        'classroom_id',
                        'user_id',
                        'responsibility',
                        'status',
                        'full_name',
                        'view_grades',
                        'manage_assignments'
                    ]
                ]);

        $this->assertTrue($response->json('success'));
        
        // Verify all fields were saved correctly
        $this->assertDatabaseHas('user_management', [
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Lab Assistant with Special Duties',
            'status' => 'invited',
            'full_name' => 'Optional Fields TA',
            'view_grades' => true,
            'manage_assignments' => true,
        ]);

        // Clean up
        UserManagement::where('user_id', $taUser->user_id)->delete();
        User::where('user_id', $taUser->user_id)->delete();
    }

    /**
     * Test: Update user management record with partial data
     * Purpose: Verify partial updates work correctly
     */
    public function test_update_user_management_record_with_partial_data(): void
    {
        // Create a TA user
        $taUserId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $taUserId,
            'role' => 'TA',
            'username' => 'partial_ta_' . $this->uniqueId,
            'email' => 'partial_ta_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $taUser = User::find($taUserId);

        // Create initial record
        $userManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Grader',
            'status' => 'invited',
            'full_name' => 'Partial Update TA',
            'view_grades' => false,
            'manage_assignments' => false,
        ]);

        // Update only the status
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->patchJson("/api/user-management/{$userManagement->um_id}", [
            'status' => 'active'
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'um_id',
                        'classroom_id',
                        'user_id',
                        'responsibility',
                        'status',
                        'full_name',
                        'view_grades',
                        'manage_assignments'
                    ]
                ]);

        $this->assertTrue($response->json('success'));
        $this->assertEquals('active', $response->json('data.status'));
        
        // Verify only status was updated, other fields remain unchanged
        $this->assertDatabaseHas('user_management', [
            'um_id' => $userManagement->um_id,
            'status' => 'active',
            'responsibility' => 'Grader', // Should remain unchanged
            'view_grades' => false, // Should remain unchanged
        ]);

        // Clean up
        UserManagement::where('um_id', $userManagement->um_id)->delete();
        User::where('user_id', $taUser->user_id)->delete();
    }

    /**
     * Test: Validation errors for update method
     * Purpose: Verify validation works correctly for updates
     */
    public function test_validation_errors_for_update_method(): void
    {
        // Create a TA user
        $taUserId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $taUserId,
            'role' => 'TA',
            'username' => 'update_validation_ta_' . $this->uniqueId,
            'email' => 'update_validation_ta_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $taUser = User::find($taUserId);

        // Create initial record
        $userManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser->user_id,
            'responsibility' => 'Grader',
            'status' => 'active',
            'full_name' => 'Update Validation TA',
            'view_grades' => true,
            'manage_assignments' => false,
        ]);

        // Test invalid status
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->patchJson("/api/user-management/{$userManagement->um_id}", [
            'status' => 'invalid_status'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['status']);

        // Test invalid boolean values
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->patchJson("/api/user-management/{$userManagement->um_id}", [
            'view_grades' => 'not_boolean',
            'manage_assignments' => 'not_boolean'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['view_grades', 'manage_assignments']);

        // Clean up
        UserManagement::where('um_id', $userManagement->um_id)->delete();
        User::where('user_id', $taUser->user_id)->delete();
    }

    /**
     * Test: Get available users filters inactive users
     * Purpose: Verify that only active users are returned
     */
    public function test_get_available_users_filters_inactive_users(): void
    {
        // Create active TA user
        $activeTaId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $activeTaId,
            'role' => 'TA',
            'username' => 'active_ta_' . $this->uniqueId,
            'email' => 'active_ta_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'is_active' => true,
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $activeTa = User::find($activeTaId);

        // Create inactive TA user
        $inactiveTaId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $inactiveTaId,
            'role' => 'TA',
            'username' => 'inactive_ta_' . $this->uniqueId,
            'email' => 'inactive_ta_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'is_active' => false,
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $inactiveTa = User::find($inactiveTaId);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/user-management/available/users');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'user_id',
                            'email',
                            'role'
                        ]
                    ]
                ]);

        $this->assertTrue($response->json('success'));
        
        $users = $response->json('data');
        $userEmails = array_column($users, 'email');
        
        // Should include active TA
        $this->assertContains('active_ta_' . $this->uniqueId . '@test.com', $userEmails);
        
        // Should not include inactive TA
        $this->assertNotContains('inactive_ta_' . $this->uniqueId . '@test.com', $userEmails);

        // Clean up
        User::whereIn('user_id', [$activeTa->user_id, $inactiveTa->user_id])->delete();
    }


} 