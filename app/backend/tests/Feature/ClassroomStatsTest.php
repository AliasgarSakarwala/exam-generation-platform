<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Classroom;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClassroomStatsTest extends TestCase
{

    // -------------------------------------------PROFESSOR GETS CORRECT CLASSROOM STATS-------------------------------------------
    public function test_professor_gets_correct_classroom_stats()
    {
        $uniqueId = substr(uniqid(), -6);
        $professorUserId = rand(10000, 99999);
        
        // Create professor user directly in database
        DB::table('user')->insert([
            'user_id' => $professorUserId,
            'role' => 'Professor',
            'username' => 'test_prof_' . $uniqueId,
            'email' => 'prof_' . $uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        
        $professor = User::find($professorUserId);
        
        // Create classrooms directly in database
        $classroom1Id = rand(10000, 99999);
        $classroom2Id = rand(10000, 99999);
        $classroom3Id = rand(10000, 99999);
        
        DB::table('classroom')->insert([
            [
                'classroom_id' => $classroom1Id,
                'name' => 'Test Course 1',
                'code' => 'T101' . $uniqueId,
                'description' => 'Test course 1',
                'user_id' => $professorUserId,
                'start_date' => now()->format('Y-m-d'),
                'end_date' => now()->addMonths(6)->format('Y-m-d'),
                'student_count' => 10,
                'is_archived' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'classroom_id' => $classroom2Id,
                'name' => 'Test Course 2',
                'code' => 'T102' . $uniqueId,
                'description' => 'Test course 2',
                'user_id' => $professorUserId,
                'start_date' => now()->format('Y-m-d'),
                'end_date' => now()->addMonths(6)->format('Y-m-d'),
                'student_count' => 10,
                'is_archived' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'classroom_id' => $classroom3Id,
                'name' => 'Test Course 3',
                'code' => 'T103' . $uniqueId,
                'description' => 'Test course 3',
                'user_id' => $professorUserId,
                'start_date' => now()->format('Y-m-d'),
                'end_date' => now()->addMonths(6)->format('Y-m-d'),
                'student_count' => 5,
                'is_archived' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
        
        Sanctum::actingAs($professor); // Sanctum acting as professor

        $response = $this->getJson('/api/classrooms/stats');
        $response->assertStatus(200)   //Check if the response is 200
            ->assertJson([
                'courses_created' => 3,
                'total_students' => 25
            ]);
            
        // Clean up
        Classroom::whereIn('classroom_id', [$classroom1Id, $classroom2Id, $classroom3Id])->delete();
        User::where('user_id', $professorUserId)->delete();
    }

    // -------------------------------------------ADMIN GETS ALL CLASSROOM STATS-------------------------------------------
    public function test_admin_gets_all_classroom_stats()
    {
        $uniqueId = substr(uniqid(), -6);
        $adminUserId = rand(10000, 99999);
        $prof1UserId = rand(10000, 99999);
        $prof2UserId = rand(10000, 99999);
        
        // Create users directly in database
        DB::table('user')->insert([
            [
                'user_id' => $adminUserId,
                'role' => 'Admin',
                'username' => 'test_admin_' . $uniqueId,
                'email' => 'admin_' . $uniqueId . '@test.com',
                'password_hash' => bcrypt('password123'),
                'comp_tutorial_pages' => '[]',
                'created_at' => now(),
                'last_updated_at' => now(),
            ],
            [
                'user_id' => $prof1UserId,
                'role' => 'Professor',
                'username' => 'test_prof1_' . $uniqueId,
                'email' => 'prof1_' . $uniqueId . '@test.com',
                'password_hash' => bcrypt('password123'),
                'comp_tutorial_pages' => '[]',
                'created_at' => now(),
                'last_updated_at' => now(),
            ],
            [
                'user_id' => $prof2UserId,
                'role' => 'Professor',
                'username' => 'test_prof2_' . $uniqueId,
                'email' => 'prof2_' . $uniqueId . '@test.com',
                'password_hash' => bcrypt('password123'),
                'comp_tutorial_pages' => '[]',
                'created_at' => now(),
                'last_updated_at' => now(),
            ]
        ]);
        
        $admin = User::find($adminUserId);
        
        // Create classrooms directly in database
        $classroom1Id = rand(10000, 99999);
        $classroom2Id = rand(10000, 99999);
        
        DB::table('classroom')->insert([
            [
                'classroom_id' => $classroom1Id,
                'name' => 'Prof1 Course',
                'code' => 'P1C' . $uniqueId,
                'description' => 'Prof1 course',
                'user_id' => $prof1UserId,
                'start_date' => now()->format('Y-m-d'),
                'end_date' => now()->addMonths(6)->format('Y-m-d'),
                'student_count' => 7,
                'is_archived' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'classroom_id' => $classroom2Id,
                'name' => 'Prof2 Course',
                'code' => 'P2C' . $uniqueId,
                'description' => 'Prof2 course',
                'user_id' => $prof2UserId,
                'start_date' => now()->format('Y-m-d'),
                'end_date' => now()->addMonths(6)->format('Y-m-d'),
                'student_count' => 8,
                'is_archived' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
        
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/classrooms/stats');
        $response->assertStatus(200)
            ->assertJson([
                'courses_created' => 2,
                'total_students' => 15
            ]);
            
        // Clean up
        Classroom::whereIn('classroom_id', [$classroom1Id, $classroom2Id])->delete();
        User::whereIn('user_id', [$adminUserId, $prof1UserId, $prof2UserId])->delete();
    }

    // -------------------------------------------UNAUTHENTICATED USER CANNOT ACCESS STATS-------------------------------------------
    public function test_unauthenticated_user_cannot_access_stats()
    {
        $response = $this->getJson('/api/classrooms/stats');
        $response->assertStatus(401);
    }
} 