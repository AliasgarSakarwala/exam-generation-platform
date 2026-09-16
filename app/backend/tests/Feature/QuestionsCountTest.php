<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\QuestionBank;
use App\Models\Question;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuestionsCountTest extends TestCase
{

    // -------------------------------------------PROFESSOR GETS CORRECT QUESTIONS COUNT-------------------------------------------
    public function test_professor_gets_correct_questions_count()
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
        
        // Create question banks directly in database
        $bank1Id = rand(10000, 99999);
        $bank2Id = rand(10000, 99999);
        
        DB::table('question_bank')->insert([
            [
                'question_bank_id' => $bank1Id,
                'user_id' => $professorUserId,
                'name' => 'Test Bank 1 ' . $uniqueId,
                'description' => 'Test question bank 1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question_bank_id' => $bank2Id,
                'user_id' => $professorUserId,
                'name' => 'Test Bank 2 ' . $uniqueId,
                'description' => 'Test question bank 2',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
        
        // Create questions directly in database
        $questions = [];
        for ($i = 1; $i <= 3; $i++) {
            $questions[] = [
                'question_id' => rand(10000, 99999),
                'question_bank_id' => $bank1Id,
                'question_text' => "Test question {$i} for bank 1",
                'question_type' => 'MultipleChoice',
                'difficulty_level' => 1, // Use integer for difficulty level
                'tags' => '[]',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        for ($i = 1; $i <= 2; $i++) {
            $questions[] = [
                'question_id' => rand(10000, 99999),
                'question_bank_id' => $bank2Id,
                'question_text' => "Test question {$i} for bank 2",
                'question_type' => 'MultipleChoice',
                'difficulty_level' => 2, // Use integer for difficulty level
                'tags' => '[]',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        DB::table('question')->insert($questions);
        
        Sanctum::actingAs($professor);

        $response = $this->getJson('/api/activity-logs/kpi-stats');
        $response->assertStatus(200);
        
        $responseData = $response->json();
        $questionStats = collect($responseData)->firstWhere('title', 'Total Questions');
        $this->assertNotNull($questionStats, 'Total Questions stats not found');
        $this->assertGreaterThanOrEqual(5, $questionStats['value'], 'Expected at least 5 questions but got ' . $questionStats['value']);
            
        // Clean up
        Question::where('question_bank_id', $bank1Id)->delete();
        Question::where('question_bank_id', $bank2Id)->delete();
        QuestionBank::whereIn('question_bank_id', [$bank1Id, $bank2Id])->delete();
        User::where('user_id', $professorUserId)->delete();
    }

    // -------------------------------------------UNAUTHENTICATED USER CANNOT ACCESS QUESTIONS COUNT-------------------------------------------
    public function test_unauthenticated_user_cannot_access_questions_count()
    {
        $response = $this->getJson('/api/activity-logs/kpi-stats');
        $response->assertStatus(401);
    }
} 