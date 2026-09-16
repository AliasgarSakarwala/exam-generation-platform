<?php

namespace Tests\Feature\Student;

use App\Models\User;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\ClassroomStudent;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamVariant;
use Tests\TestCase;
use Illuminate\Support\Str;

class StudentManagementTest extends TestCase
{
    public function test_professor_can_view_students_in_their_classroom(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999), // Dynamic ID
            'role' => 'Professor',

            'username' => 'test_professor_' . uniqid(),
            'email' => 'professor_' . uniqid() . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course',
            'code' => 'TEST101',
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create a test student
        $student = Student::create([
            'student_id' => rand(20000, 99999), // Dynamic ID
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        // Enroll student in classroom
        ClassroomStudent::create([
            'classroom_id' => $classroom->classroom_id,
            'student_id' => $student->student_id,
            'enrolled_at' => now(),
            'enrollment_status' => 'Active',
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Test the endpoint
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'student_id',
                            'first_name',
                            'last_name',
                            'enrollment_status',
                            'exam_results'
                        ]
                    ],
                    'exams'
                ]);

        $this->assertEquals(1, $response->json('total'));

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::where('student_id', $student->student_id)->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_professor_cannot_access_other_professors_classroom(): void
    {
        // Create first professor
        $user1 = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'professor1_' . uniqid(),
            'email' => 'professor1_' . uniqid() . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create second professor
        $user2 = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'professor2_' . uniqid(),
            'email' => 'professor2_' . uniqid() . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create classroom for first professor
        $classroom = Classroom::create([
            'name' => 'Test Course',
            'code' => 'TEST102',
            'description' => 'Test course description',
            'user_id' => $user1->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create token for second professor
        $token = $user2->createToken('test-token')->plainTextToken;

        // Try to access first professor's classroom
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students");

        $response->assertStatus(403);

        // Clean up test data
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user1->user_id)->delete();
        User::where('user_id', $user2->user_id)->delete();
    }

    public function test_professor_can_add_single_student_to_classroom(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'test_professor_single_' . uniqid(),
            'email' => 'professor_single_' . uniqid() . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Single',
            'code' => 'TEST103',
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Test adding a single student
        $studentData = [
            'student_id' => 2002,
            'first_name' => 'Alice',
            'last_name' => 'Johnson',
            'is_active' => true,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/classrooms/{$classroom->classroom_id}/students", $studentData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'count',
                    'students'
                ]);

        $this->assertEquals(1, $response->json('count'));
        $this->assertStringContainsString('1 student(s) enrolled successfully', $response->json('message'));

        // Verify student was created and enrolled
        $this->assertDatabaseHas('student', [
            'student_id' => 2002,
            'first_name' => 'Alice',
            'last_name' => 'Johnson',
        ]);

        $this->assertDatabaseHas('classroom_student', [
            'classroom_id' => $classroom->classroom_id,
            'student_id' => 2002,
            'enrollment_status' => 'Active',
        ]);

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::where('student_id', 2002)->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_professor_can_add_multiple_students_to_classroom(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'test_professor_multiple_' . uniqid(),
            'email' => 'professor_multiple_' . uniqid() . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Multiple',
            'code' => 'TEST104',
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Test adding multiple students (simulating CSV import)
        $studentsData = [
            'students' => [
                [
                    'student_id' => 2003,
                    'first_name' => 'Bob',
                    'last_name' => 'Smith',
                    'is_active' => true,
                ],
                [
                    'student_id' => 2004,
                    'first_name' => 'Carol',
                    'last_name' => 'Davis',
                    'is_active' => true,
                ],
                [
                    'student_id' => 2005,
                    'first_name' => 'David',
                    'last_name' => 'Wilson',
                    'is_active' => false,
                ],
            ]
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/classrooms/{$classroom->classroom_id}/students", $studentsData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'count',
                    'students'
                ]);

        $this->assertEquals(3, $response->json('count'));
        $this->assertStringContainsString('3 student(s) enrolled successfully', $response->json('message'));

        // Verify all students were created and enrolled
        $this->assertDatabaseHas('student', [
            'student_id' => 2003,
            'first_name' => 'Bob',
            'last_name' => 'Smith',
        ]);

        $this->assertDatabaseHas('student', [
            'student_id' => 2004,
            'first_name' => 'Carol',
            'last_name' => 'Davis',
        ]);

        $this->assertDatabaseHas('student', [
            'student_id' => 2005,
            'first_name' => 'David',
            'last_name' => 'Wilson',
        ]);

        $this->assertDatabaseHas('classroom_student', [
            'classroom_id' => $classroom->classroom_id,
            'student_id' => 2003,
        ]);

        $this->assertDatabaseHas('classroom_student', [
            'classroom_id' => $classroom->classroom_id,
            'student_id' => 2004,
        ]);

        $this->assertDatabaseHas('classroom_student', [
            'classroom_id' => $classroom->classroom_id,
            'student_id' => 2005,
        ]);

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::whereIn('student_id', [2003, 2004, 2005])->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_professor_can_view_single_student_in_classroom(): void
    {
        // Create a professor user with random ID
        $user = User::create([
            'user_id' => 9991,
            'role' => 'Professor',
            'username' => 'prof_show_' . rand(1000, 9999),
            'email' => 'prof_show_' . rand(1000, 9999) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Show',
            'code' => 'SHOW' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create a test student
        $student = Student::create([
            'student_id' => 9991 + rand(1000, 9999),
            'first_name' => 'Grace',
            'last_name' => 'Taylor',
        ]);

        // Enroll student in classroom
        ClassroomStudent::create([
            'classroom_id' => $classroom->classroom_id,
            'student_id' => $student->student_id,
            'enrolled_at' => now(),
            'enrollment_status' => 'Active',
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Test viewing the single student
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students/{$student->student_id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'student_id',
                        'first_name',
                        'last_name',
                        'enrollment' => [
                            'classroom_id',
                            'student_id',
                            'enrollment_status',
                            'enrolled_at'
                        ]
                    ],
                    'message'
                ]);

        // Verify the response contains correct data

        $responseData = $response->json('data');
        $this->assertEquals($student->student_id, $responseData['student_id']);
        $this->assertEquals('Grace', $responseData['first_name']);
        $this->assertEquals('Taylor', $responseData['last_name']);
        $this->assertEquals('Active', $responseData['enrollment']['enrollment_status']);

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::where('student_id', $student->student_id)->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_professor_cannot_view_student_in_other_professors_classroom(): void
    {
        // Create first professor
        $user1 = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_other_' . Str::random(6),
            'email' => 'prof_other_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create second professor
        $user2 = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_other2_' . Str::random(6),
            'email' => 'prof_other2_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create classroom for first professor
        $classroom = Classroom::create([
            'name' => 'Test Course Other',
            'code' => 'OTHER' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $user1->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create a test student
        $student = Student::create([
            'student_id' => rand(20000, 99999),
            'first_name' => 'Alice',
            'last_name' => 'Johnson',
        ]);

        // Enroll student in classroom
        ClassroomStudent::create([
            'classroom_id' => $classroom->classroom_id,
            'student_id' => $student->student_id,
            'enrolled_at' => now(),
            'enrollment_status' => 'Active',
        ]);

        // Create token for second professor
        $token = $user2->createToken('test-token')->plainTextToken;

        // Try to access student in first professor's classroom
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students/{$student->student_id}");

        $response->assertStatus(403)
                ->assertJsonStructure([
                    'data',
                    'message'
                ]);

        $this->assertEquals('Not authorized to access this classroom', $response->json('message'));

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::where('student_id', $student->student_id)->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user1->user_id)->delete();
        User::where('user_id', $user2->user_id)->delete();
    }

    public function test_professor_cannot_view_nonexistent_student_in_classroom(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_nonexistent_' . Str::random(6),
            'email' => 'prof_nonexistent_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Nonexistent',
            'code' => 'NONEXIST' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Try to view a student that doesn't exist in the classroom
        $nonexistentStudentId = rand(50000, 99999);
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students/{$nonexistentStudentId}");

        $response->assertStatus(500)
                ->assertJsonStructure([
                    'data',
                    'message'
                ]);

        $this->assertEquals('Student not found in this classroom', $response->json('message'));

        // Clean up test data
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_show_returns_404_for_nonexistent_classroom(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_404_' . Str::random(6),
            'email' => 'prof_404_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Try to view a student in a classroom that doesn't exist
        $nonexistentClassroomId = rand(50000, 99999);
        $nonexistentStudentId = rand(50000, 99999);
        
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$nonexistentClassroomId}/students/{$nonexistentStudentId}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data',
                    'message'
                ]);

        $this->assertEquals('Classroom not found', $response->json('message'));

        // Clean up test data
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_admin_can_view_student_in_any_classroom(): void
    {
        // Create an admin user
        $admin = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Admin',
            'username' => 'admin_show_' . Str::random(6),
            'email' => 'admin_show_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);

        // Create a professor
        $professor = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_admin_' . Str::random(6),
            'email' => 'prof_admin_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Admin',
            'code' => 'ADMIN' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $professor->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create a test student
        $student = Student::create([
            'student_id' => rand(20000, 99999),
            'first_name' => 'Bob',
            'last_name' => 'Wilson',
        ]);

        // Enroll student in classroom
        ClassroomStudent::create([
            'classroom_id' => $classroom->classroom_id,
            'student_id' => $student->student_id,
            'enrolled_at' => now(),
            'enrollment_status' => 'Active',
        ]);

        // Create token for admin
        $token = $admin->createToken('test-token')->plainTextToken;

        // Admin should be able to view student in any classroom
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students/{$student->student_id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'student_id',
                        'first_name',
                        'last_name',
                        'enrollment'
                    ],
                    'message'
                ]);

        $this->assertEquals($student->student_id, $response->json('data.student_id'));
        $this->assertEquals('Bob', $response->json('data.first_name'));
        $this->assertEquals('Wilson', $response->json('data.last_name'));
        $this->assertEquals('Student found', $response->json('message'));

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::where('student_id', $student->student_id)->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $admin->user_id)->delete();
        User::where('user_id', $professor->user_id)->delete();
    }

    public function test_professor_can_update_student_in_classroom(): void
    {
        // Create a professor user with random ID
        $user = User::create([
            'user_id' => 9994,
            'role' => 'Professor',
            'username' => 'prof_update_' . rand(1000, 9999),
            'email' => 'prof_update_' . rand(1000, 9999) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Update',
            'code' => 'UPDATE' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create a test student
        $student = Student::create([
            'student_id' => 9994,
            'first_name' => 'Emma',
            'last_name' => 'Brown',
        ]);

        // Enroll student in classroom
        ClassroomStudent::create([
            'classroom_id' => $classroom->classroom_id,
            'student_id' => $student->student_id,
            'enrolled_at' => now(),
            'enrollment_status' => 'Active',
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Test updating the student
        $updateData = [
            'first_name' => 'Emma Updated',
            'last_name' => 'Brown Updated',
            'enrollment_status' => 'Completed',
            'is_active' => false,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->patchJson("/api/classrooms/{$classroom->classroom_id}/students/{$student->student_id}", $updateData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'student_id',
                    'first_name',
                    'last_name',
                    'enrollment'
                ]);

        // Verify student was updated
        $this->assertDatabaseHas('student', [
            'student_id' => 9994,
            'first_name' => 'Emma Updated',
            'last_name' => 'Brown Updated',
        ]);

        $this->assertDatabaseHas('classroom_student', [
            'classroom_id' => $classroom->classroom_id,
            'student_id' => 9994,
            'enrollment_status' => 'Completed',
        ]);

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::where('student_id', 9994)->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_professor_can_remove_student_from_classroom(): void
    {
        // Create a professor user with random ID
        $user = User::create([
            'user_id' => 9995,
            'role' => 'Professor',
            'username' => 'prof_remove_' . rand(1000, 9999),
            'email' => 'prof_remove_' . rand(1000, 9999) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Remove',
            'code' => 'REMOVE' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create a test student
        $student = Student::create([
            'student_id' => 9995,
            'first_name' => 'Frank',
            'last_name' => 'Miller',
        ]);

        // Enroll student in classroom
        ClassroomStudent::create([
            'classroom_id' => $classroom->classroom_id,
            'student_id' => $student->student_id,
            'enrolled_at' => now(),
            'enrollment_status' => 'Active',
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Test removing the student from classroom (but keeping student record)
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->deleteJson("/api/classrooms/{$classroom->classroom_id}/students/{$student->student_id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'message'
                ]);

        $this->assertStringContainsString('Student removed from classroom successfully', $response->json('message'));

        // Verify student was removed from classroom but student record still exists
        $this->assertDatabaseMissing('classroom_student', [
            'classroom_id' => $classroom->classroom_id,
            'student_id' => 9995,
        ]);

        $this->assertDatabaseHas('student', [
            'student_id' => 9995,
            'first_name' => 'Frank',
            'last_name' => 'Miller',
        ]);

        // Test removing student with delete_student_record flag
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->deleteJson("/api/classrooms/{$classroom->classroom_id}/students/{$student->student_id}?delete_student_record=true");

        $response->assertStatus(200);

        // Verify student record was also deleted
        $this->assertDatabaseMissing('student', [
            'student_id' => 9995,
        ]);

        // Clean up test data
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }



    public function test_index_supports_status_filtering(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_status_' . Str::random(6),
            'email' => 'prof_status_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Status',
            'code' => 'STATUS' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create test students
        $activeStudent = Student::create([
            'student_id' => rand(20000, 99999),
            'first_name' => 'Active',
            'last_name' => 'Student',
        ]);

        $droppedStudent = Student::create([
            'student_id' => rand(20000, 99999),
            'first_name' => 'Dropped',
            'last_name' => 'Student',
        ]);

        $completedStudent = Student::create([
            'student_id' => rand(20000, 99999),
            'first_name' => 'Completed',
            'last_name' => 'Student',
        ]);

        // Enroll students with different statuses
        ClassroomStudent::create([
            'classroom_id' => $classroom->classroom_id,
            'student_id' => $activeStudent->student_id,
            'enrolled_at' => now(),
            'enrollment_status' => 'Active',
        ]);

        ClassroomStudent::create([
            'classroom_id' => $classroom->classroom_id,
            'student_id' => $droppedStudent->student_id,
            'enrolled_at' => now(),
            'enrollment_status' => 'Dropped',
        ]);

        ClassroomStudent::create([
            'classroom_id' => $classroom->classroom_id,
            'student_id' => $completedStudent->student_id,
            'enrolled_at' => now(),
            'enrollment_status' => 'Completed',
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Test Active status filter
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students?status=Active");

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('total'));

        // Test Dropped status filter
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students?status=Dropped");

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('total'));

        // Test Completed status filter
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students?status=Completed");

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('total'));

        // Test invalid status (should return all students)
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students?status=Invalid");

        $response->assertStatus(200);
        $this->assertEquals(3, $response->json('total'));

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::whereIn('student_id', [$activeStudent->student_id, $droppedStudent->student_id, $completedStudent->student_id])->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_admin_can_view_students_in_any_classroom(): void
    {
        // Create an admin user
        $admin = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Admin',
            'username' => 'admin_index_' . Str::random(6),
            'email' => 'admin_index_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);

        // Create a professor
        $professor = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_admin_index_' . Str::random(6),
            'email' => 'prof_admin_index_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Admin Index',
            'code' => 'ADMINIDX' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $professor->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create a test student
        $student = Student::create([
            'student_id' => rand(20000, 99999),
            'first_name' => 'Admin',
            'last_name' => 'Student',
        ]);

        // Enroll student in classroom
        ClassroomStudent::create([
            'classroom_id' => $classroom->classroom_id,
            'student_id' => $student->student_id,
            'enrolled_at' => now(),
            'enrollment_status' => 'Active',
        ]);

        // Create token for admin
        $token = $admin->createToken('test-token')->plainTextToken;

        // Admin should be able to view students in any classroom
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data',
                    'current_page',
                    'per_page',
                    'total',
                    'last_page',
                    'exams'
                ]);

        $this->assertEquals(1, $response->json('total'));

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::where('student_id', $student->student_id)->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $admin->user_id)->delete();
        User::where('user_id', $professor->user_id)->delete();
    }

    public function test_admin_can_add_students_to_any_classroom(): void
    {
        // Create an admin user
        $admin = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Admin',
            'username' => 'admin_store_' . Str::random(6),
            'email' => 'admin_store_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);

        // Create a professor
        $professor = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_admin_store_' . Str::random(6),
            'email' => 'prof_admin_store_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Admin Store',
            'code' => 'ADMINSTORE' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $professor->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create token for admin
        $token = $admin->createToken('test-token')->plainTextToken;

        // Admin should be able to add students to any classroom
        $studentData = [
            'student_id' => rand(20000, 99999),
            'first_name' => 'Admin',
            'last_name' => 'Student',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/classrooms/{$classroom->classroom_id}/students", $studentData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'count',
                    'students'
                ]);

        $this->assertEquals(1, $response->json('count'));

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::where('student_id', $studentData['student_id'])->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $admin->user_id)->delete();
        User::where('user_id', $professor->user_id)->delete();
    }

    public function test_store_single_student_with_is_active(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_isactive_' . Str::random(6),
            'email' => 'prof_isactive_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course IsActive',
            'code' => 'ISACTIVE' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Test adding student with is_active = true
        $studentData = [
            'student_id' => rand(20000, 99999),
            'first_name' => 'Active',
            'last_name' => 'Student',
            'is_active' => true,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/classrooms/{$classroom->classroom_id}/students", $studentData);

        $response->assertStatus(201);

        // Verify student was created with is_active = true
        $this->assertDatabaseHas('student', [
            'student_id' => $studentData['student_id'],
            'first_name' => 'Active',
            'last_name' => 'Student',
            'is_active' => true,
        ]);

        // Test adding student with is_active = false
        $studentData2 = [
            'student_id' => rand(20000, 99999),
            'first_name' => 'Inactive',
            'last_name' => 'Student',
            'is_active' => false,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/classrooms/{$classroom->classroom_id}/students", $studentData2);

        $response->assertStatus(201);

        // Verify student was created with is_active = false
        $this->assertDatabaseHas('student', [
            'student_id' => $studentData2['student_id'],
            'first_name' => 'Inactive',
            'last_name' => 'Student',
            'is_active' => false,
        ]);

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::whereIn('student_id', [$studentData['student_id'], $studentData2['student_id']])->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_store_multiple_students_with_is_active(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_multi_isactive_' . Str::random(6),
            'email' => 'prof_multi_isactive_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Multi IsActive',
            'code' => 'MULTIACTIVE' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Test adding multiple students with is_active
        $studentsData = [
            'students' => [
                [
                    'student_id' => rand(20000, 99999),
                    'first_name' => 'MultiActive1',
                    'last_name' => 'Student1',
                    'is_active' => true,
                ],
                [
                    'student_id' => rand(20000, 99999),
                    'first_name' => 'MultiActive2',
                    'last_name' => 'Student2',
                    'is_active' => false,
                ],
            ]
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/classrooms/{$classroom->classroom_id}/students", $studentsData);

        $response->assertStatus(201);
        $this->assertEquals(2, $response->json('count'));

        // Verify students were created with correct is_active values
        $this->assertDatabaseHas('student', [
            'student_id' => $studentsData['students'][0]['student_id'],
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('student', [
            'student_id' => $studentsData['students'][1]['student_id'],
            'is_active' => false,
        ]);

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::whereIn('student_id', [$studentsData['students'][0]['student_id'], $studentsData['students'][1]['student_id']])->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_store_existing_student_not_enrolled(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_existing_' . Str::random(6),
            'email' => 'prof_existing_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Existing',
            'code' => 'EXISTING' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create a student that exists but is not enrolled
        $existingStudent = Student::create([
            'student_id' => rand(20000, 99999),
            'first_name' => 'Existing',
            'last_name' => 'Student',
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Try to enroll the existing student
        $studentData = [
            'student_id' => $existingStudent->student_id,
            'first_name' => 'Existing',
            'last_name' => 'Student',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/classrooms/{$classroom->classroom_id}/students", $studentData);

        $response->assertStatus(201);
        $this->assertEquals(1, $response->json('count'));

        // Verify student was enrolled
        $this->assertDatabaseHas('classroom_student', [
            'classroom_id' => $classroom->classroom_id,
            'student_id' => $existingStudent->student_id,
        ]);

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::where('student_id', $existingStudent->student_id)->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_store_already_enrolled_student(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_enrolled_' . Str::random(6),
            'email' => 'prof_enrolled_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Enrolled',
            'code' => 'ENROLLED' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create and enroll a student
        $student = Student::create([
            'student_id' => rand(20000, 99999),
            'first_name' => 'Enrolled',
            'last_name' => 'Student',
        ]);

        ClassroomStudent::create([
            'classroom_id' => $classroom->classroom_id,
            'student_id' => $student->student_id,
            'enrolled_at' => now(),
            'enrollment_status' => 'Active',
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Try to enroll the same student again
        $studentData = [
            'student_id' => $student->student_id,
            'first_name' => 'Enrolled',
            'last_name' => 'Student',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/classrooms/{$classroom->classroom_id}/students", $studentData);

        $response->assertStatus(201);
        
        // Should have errors for duplicate enrollment
        $this->assertArrayHasKey('errors', $response->json());
        $this->assertStringContainsString('already enrolled', $response->json('errors')[0]);

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::where('student_id', $student->student_id)->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_store_validation_errors(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_validation_' . Str::random(6),
            'email' => 'prof_validation_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Validation',
            'code' => 'VALIDATION' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Test missing required fields
        $invalidData = [
            'first_name' => 'Invalid',
            // Missing student_id and last_name
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/classrooms/{$classroom->classroom_id}/students", $invalidData);

        $response->assertStatus(422)
                ->assertJsonStructure([
                    'error',
                    'messages'
                ]);

        // Test invalid multiple students format
        $invalidMultipleData = [
            'students' => 'not_an_array'
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/classrooms/{$classroom->classroom_id}/students", $invalidMultipleData);

        $response->assertStatus(422);

        // Clean up test data
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_store_nonexistent_classroom(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_nonexistent_' . Str::random(6),
            'email' => 'prof_nonexistent_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Try to add student to non-existent classroom
        $nonexistentClassroomId = rand(50000, 99999);
        $studentData = [
            'student_id' => rand(20000, 99999),
            'first_name' => 'Nonexistent',
            'last_name' => 'Student',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/classrooms/{$nonexistentClassroomId}/students", $studentData);

        $response->assertStatus(404)
                ->assertJsonStructure([
                    'error'
                ]);

        $this->assertEquals('Classroom not found', $response->json('error'));

        // Clean up test data
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_index_supports_pagination(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_pagination_' . Str::random(6),
            'email' => 'prof_pagination_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Course Pagination',
            'code' => 'PAGINATION' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create multiple students
        $students = [];
        for ($i = 1; $i <= 5; $i++) {
            $student = Student::create([
                'student_id' => rand(20000, 99999),
                'first_name' => "Pagination{$i}",
                'last_name' => "Student{$i}",
            ]);

            ClassroomStudent::create([
                'classroom_id' => $classroom->classroom_id,
                'student_id' => $student->student_id,
                'enrolled_at' => now(),
                'enrollment_status' => 'Active',
            ]);

            $students[] = $student;
        }

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Test custom per_page
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students?per_page=3");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data',
                    'current_page',
                    'per_page',
                    'total',
                    'last_page',
                    'exams'
                ]);

        $this->assertEquals(3, $response->json('per_page'));
        $this->assertEquals(5, $response->json('total'));
        $this->assertEquals(2, $response->json('last_page')); // 5 students / 3 per page = 2 pages

        // Test second page
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students?per_page=3&page=2");

        $response->assertStatus(200);
        $this->assertEquals(2, $response->json('current_page'));
        $this->assertEquals(2, count($response->json('data'))); // Should have 2 students on page 2

        // Clean up test data
        ClassroomStudent::where('classroom_id', $classroom->classroom_id)->delete();
        Student::whereIn('student_id', array_column($students, 'student_id'))->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }



    public function test_index_empty_classroom(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_empty_' . Str::random(6),
            'email' => 'prof_empty_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create an empty classroom
        $classroom = Classroom::create([
            'name' => 'Test Course Empty',
            'code' => 'EMPTY' . rand(1000, 9999),
            'description' => 'Test course description',
            'user_id' => $user->user_id,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
        ]);

        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Test index with empty classroom
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$classroom->classroom_id}/students");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data',
                    'current_page',
                    'per_page',
                    'total',
                    'last_page',
                    'exams'
                ]);

        $this->assertEquals(0, $response->json('total'));
        $this->assertEquals([], $response->json('data'));
        $this->assertEquals([], $response->json('exams'));

        // Clean up test data
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $user->user_id)->delete();
    }

    public function test_index_nonexistent_classroom(): void
    {
        // Create a professor user
        $user = User::create([
            'user_id' => rand(10000, 99999),
            'role' => 'Professor',
            'username' => 'prof_404_' . Str::random(6),
            'email' => 'prof_404_' . Str::random(6) . '@test.com',
            'password_hash' => bcrypt('password123'),
        ]);


        // Create token for authentication
        $token = $user->createToken('test-token')->plainTextToken;

        // Try to access non-existent classroom
        $nonexistentClassroomId = rand(50000, 99999);
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/classrooms/{$nonexistentClassroomId}/students");

        $response->assertStatus(404)
                ->assertJsonStructure([
                    'error'
                ]);

        $this->assertEquals('Classroom not found', $response->json('error'));

        // Clean up test data
        User::where('user_id', $user->user_id)->delete();
    }
} 