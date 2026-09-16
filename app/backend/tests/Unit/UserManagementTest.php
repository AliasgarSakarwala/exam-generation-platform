<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\Classroom;
use App\Models\UserManagement;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class UserManagementTest extends TestCase
{

    private $professorUser;
    private $classroom;
    private $taUser;
    private $uniqueId;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test data with unique identifier
        $this->uniqueId = substr(uniqid(), -6); // Use only last 6 characters
        
        // Create professor user using DB insertion to avoid ID conflicts
        $professorUserId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $professorUserId,
            'role' => 'Professor',
            'username' => 'test_prof_' . $this->uniqueId,
            'email' => 'prof_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $this->professorUser = User::find($professorUserId);

        // Create classroom using DB insertion with all required fields
        $classroomId = rand(10000, 99999);
        DB::table('classroom')->insert([
            'classroom_id' => $classroomId,
            'name' => 'Test Course',
            'code' => 'T101' . $this->uniqueId,
            'section' => 'A',
            'description' => 'Test course description',
            'user_id' => $this->professorUser->user_id,
            'is_archived' => false,
            'start_date' => now()->format('Y-m-d'),
            'end_date' => '2025-12-31',
            'term' => 'Fall 2025',
            'student_count' => 0,
            'class_colour' => '#CCCCFF',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->classroom = Classroom::find($classroomId);

        // Create TA user using DB insertion
        $taUserId = rand(20000, 29999);
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
        $this->taUser = User::find($taUserId);
    }

    protected function tearDown(): void
    {
        // Clean up test data
        if ($this->classroom) {
            UserManagement::where('classroom_id', $this->classroom->classroom_id)->delete();
            Classroom::where('classroom_id', $this->classroom->classroom_id)->delete();
        }
        if ($this->professorUser) {
            User::where('user_id', $this->professorUser->user_id)->delete();
        }
        if ($this->taUser) {
            User::where('user_id', $this->taUser->user_id)->delete();
        }
        
        parent::tearDown();
    }

    /**
     * Test: UserManagement model can be created with valid data
     * Purpose: Verify the model's fillable properties and basic creation
     */
    public function test_can_create_user_management_record(): void
    {
        $userManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $this->taUser->user_id,
            'responsibility' => 'Lead TA',
            'status' => 'active',
            'full_name' => 'Test TA',
            'view_grades' => true,
            'manage_assignments' => false,
        ]);

        $this->assertNotNull($userManagement->um_id);
        $this->assertEquals($this->classroom->classroom_id, $userManagement->classroom_id);
        $this->assertEquals($this->taUser->user_id, $userManagement->user_id);
        $this->assertEquals('Lead TA', $userManagement->responsibility);
        $this->assertEquals('active', $userManagement->status);
        $this->assertEquals('Test TA', $userManagement->full_name);
        $this->assertTrue($userManagement->view_grades);
        $this->assertFalse($userManagement->manage_assignments);

        // Clean up
        UserManagement::where('um_id', $userManagement->um_id)->delete();
    }

    /**
     * Test: UserManagement model has correct relationships
     * Purpose: Verify that the model can access related classroom and user data
     */
    public function test_user_management_has_correct_relationships(): void
    {
        $userManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $this->taUser->user_id,
            'responsibility' => 'Grader',
            'status' => 'invited',
            'full_name' => 'Test TA',
            'view_grades' => false,
            'manage_assignments' => true,
        ]);

        // Test classroom relationship
        $this->assertNotNull($userManagement->classroom);
        $this->assertEquals($this->classroom->classroom_id, $userManagement->classroom->classroom_id);
        $this->assertEquals('Test Course', $userManagement->classroom->name);
        $this->assertEquals('T101' . $this->uniqueId, $userManagement->classroom->code);

        // Test user relationship
        $this->assertNotNull($userManagement->user);
        $this->assertEquals($this->taUser->user_id, $userManagement->user->user_id);
        $this->assertEquals('ta_' . $this->uniqueId . '@test.com', $userManagement->user->email);
        $this->assertEquals('TA', $userManagement->user->role);

        // Clean up
        UserManagement::where('um_id', $userManagement->um_id)->delete();
    }

    /**
     * Test: UserManagement model casts boolean values correctly
     * Purpose: Verify that boolean fields are properly cast
     */
    public function test_boolean_fields_are_correctly_cast(): void
    {
        // Create a second TA user for this test
        $taUser2Id = rand(30000, 39999);
        DB::table('user')->insert([
            'user_id' => $taUser2Id,
            'role' => 'TA',
            'username' => 'test_ta2_' . $this->uniqueId,
            'email' => 'ta2_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $taUser2 = User::find($taUser2Id);

        $userManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $this->taUser->user_id,
            'responsibility' => 'Lab TA',
            'status' => 'active',
            'full_name' => 'Test TA',
            'view_grades' => 1, // Integer 1 should be cast to boolean true
            'manage_assignments' => 0, // Integer 0 should be cast to boolean false
        ]);

        $this->assertTrue($userManagement->view_grades);
        $this->assertFalse($userManagement->manage_assignments);

        // Test with boolean values
        $userManagement2 = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $taUser2->user_id,
            'responsibility' => 'Lead TA',
            'status' => 'invited',
            'full_name' => 'Test TA 2',
            'view_grades' => true, // Boolean true
            'manage_assignments' => false, // Boolean false
        ]);

        $this->assertTrue($userManagement2->view_grades);
        $this->assertFalse($userManagement2->manage_assignments);

        // Clean up
        UserManagement::where('um_id', $userManagement->um_id)->delete();
        UserManagement::where('um_id', $userManagement2->um_id)->delete();
        User::where('user_id', $taUser2->user_id)->delete();
    }

    /**
     * Test: UserManagement model enforces unique constraint
     * Purpose: Verify that the same user cannot be assigned to the same classroom twice
     */
    public function test_enforces_unique_constraint(): void
    {
        // Create first record
        UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $this->taUser->user_id,
            'responsibility' => 'Grader',
            'status' => 'active',
            'full_name' => 'Test TA',
            'view_grades' => true,
            'manage_assignments' => false,
        ]);

        // Try to create duplicate record
        $this->expectException(\Illuminate\Database\QueryException::class);
        
        UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $this->taUser->user_id,
            'responsibility' => 'Lead TA',
            'status' => 'invited',
            'full_name' => 'Test TA Duplicate',
            'view_grades' => false,
            'manage_assignments' => true,
        ]);

        // Clean up
        UserManagement::where('user_id', $this->taUser->user_id)->delete();
    }

    /**
     * Test: UserManagement model validates status enum values
     * Purpose: Verify that only valid status values are accepted
     */
    public function test_validates_status_enum_values(): void
    {
        // Test valid status values
        $validStatuses = ['archived', 'active', 'invited'];
        
        foreach ($validStatuses as $status) {
            $userManagement = UserManagement::create([
                'classroom_id' => $this->classroom->classroom_id,
                'user_id' => $this->taUser->user_id,
                'responsibility' => 'Grader',
                'status' => $status,
                'full_name' => "Test TA {$status}",
                'view_grades' => true,
                'manage_assignments' => false,
            ]);

            $this->assertEquals($status, $userManagement->status);
            
            // Clean up
            UserManagement::where('um_id', $userManagement->um_id)->delete();
        }
    }

    /**
     * Test: UserManagement model can be updated
     * Purpose: Verify that existing records can be modified
     */
    public function test_can_update_user_management_record(): void
    {
        $userManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $this->taUser->user_id,
            'responsibility' => 'Grader',
            'status' => 'invited',
            'full_name' => 'Test TA',
            'view_grades' => false,
            'manage_assignments' => false,
        ]);

        // Update the record
        $userManagement->update([
            'responsibility' => 'Lead TA',
            'status' => 'active',
            'view_grades' => true,
            'manage_assignments' => true,
        ]);

        // Refresh from database
        $userManagement->refresh();

        $this->assertEquals('Lead TA', $userManagement->responsibility);
        $this->assertEquals('active', $userManagement->status);
        $this->assertTrue($userManagement->view_grades);
        $this->assertTrue($userManagement->manage_assignments);

        // Clean up
        UserManagement::where('um_id', $userManagement->um_id)->delete();
    }

    /**
     * Test: UserManagement model can be deleted
     * Purpose: Verify that records can be removed from the database
     */
    public function test_can_delete_user_management_record(): void
    {
        $userManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $this->taUser->user_id,
            'responsibility' => 'Grader',
            'status' => 'active',
            'full_name' => 'Test TA',
            'view_grades' => true,
            'manage_assignments' => false,
        ]);

        $umId = $userManagement->um_id;

        // Delete the record
        $userManagement->delete();

        // Verify it's gone from the database
        $this->assertDatabaseMissing('user_management', [
            'um_id' => $umId,
        ]);
    }

    /**
     * Test: UserManagement model handles null responsibility correctly
     * Purpose: Verify that responsibility can be null (for professors)
     */
    public function test_handles_null_responsibility(): void
    {
        $userManagement = UserManagement::create([
            'classroom_id' => $this->classroom->classroom_id,
            'user_id' => $this->taUser->user_id,
            'responsibility' => null,
            'status' => 'active',
            'full_name' => 'Test TA',
            'view_grades' => true,
            'manage_assignments' => false,
        ]);

        $this->assertNull($userManagement->responsibility);

        // Clean up
        UserManagement::where('um_id', $userManagement->um_id)->delete();
    }

    /**
     * Test: UserManagement model has correct table and primary key
     * Purpose: Verify the model configuration
     */
    public function test_has_correct_table_and_primary_key(): void
    {
        $userManagement = new UserManagement();
        
        $this->assertEquals('user_management', $userManagement->getTable());
        $this->assertEquals('um_id', $userManagement->getKeyName());
    }

    /**
     * Test: UserManagement model has correct fillable properties
     * Purpose: Verify that the correct fields can be mass assigned
     */
    public function test_has_correct_fillable_properties(): void
    {
        $userManagement = new UserManagement();
        
        $expectedFillable = [
            'classroom_id',
            'user_id', 
            'responsibility',
            'status',
            'full_name',
            'view_grades',
            'manage_assignments'
        ];

        $this->assertEquals($expectedFillable, $userManagement->getFillable());
    }
} 