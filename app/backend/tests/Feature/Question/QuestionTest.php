<?php

namespace Tests\Feature\Question;

use App\Models\User;
use App\Models\Classroom;
use App\Models\QuestionBank;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\QuestionTag;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;


class QuestionTest extends TestCase
{
    public function test_professor_can_update_question(): void
    {
        // Create a professor user
        $professor = User::create([
            'username' => 'test_professor_q_update_' . time(),
            'email' => 'professor_q_update_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Classroom Question',
            'code' => 'TEST_Q_' . substr(time(), -6),
            'description' => 'Test classroom for question tests',
            'user_id' => $professor->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Create a question bank
        $questionBank = QuestionBank::create([
            'name' => 'Math Quiz',
            'description' => 'Question bank for testing',
            'user_id' => $professor->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        // Create a question
        $question = Question::create([
            'question_bank_id' => $questionBank->question_bank_id,
            'question_text' => 'What is 2+2?',
            'question_type' => 'MultipleChoice',
            'difficulty_level' => 1,
        ]);

        // Create options for the question
        QuestionOption::create([
            'question_id' => $question->question_id,
            'option_letter' => 'A',
            'option_text' => '3',
            'is_correct' => false,
        ]);

        QuestionOption::create([
            'question_id' => $question->question_id,
            'option_letter' => 'B',
            'option_text' => '4',
            'is_correct' => true,
        ]);

        QuestionOption::create([
            'question_id' => $question->question_id,
            'option_letter' => 'C',
            'option_text' => '5',
            'is_correct' => false,
        ]);

        // Prepare update data
        $updateData = [
            'Question' => 'What is 3+3?',
            'Option 1' => '5',
            'Option 2' => '6',
            'Option 3' => '7',
            'Answer' => '6',
            'Difficulty' => 'Medium'
        ];

        // Authenticate the professor and update question
        $response = $this->actingAs($professor, 'sanctum')
            ->patchJson("/api/questions/{$question->question_id}", $updateData);

        // Assert successful response
        $response->assertStatus(200);

        // Assert response message
        $response->assertJson([
            'message' => 'Question updated successfully'
        ]);

        // Verify question was updated
        $updatedQuestion = Question::find($question->question_id);
        $this->assertEquals('What is 3+3?', $updatedQuestion->question_text);
        $this->assertEquals(2, $updatedQuestion->difficulty_level); // Medium = 2

        // Verify options were updated
        $options = QuestionOption::where('question_id', $question->question_id)->get();
        $this->assertCount(3, $options);

        // Verify correct answer is marked
        $correctOption = $options->where('option_text', '6')->first();
        $this->assertTrue($correctOption->is_correct);

        // Verify incorrect answers are not marked
        $incorrectOption = $options->where('option_text', '5')->first();
        $this->assertFalse($incorrectOption->is_correct);

        // Verify option letters are correct
        $this->assertEquals('A', $options->where('option_text', '5')->first()->option_letter);
        $this->assertEquals('B', $options->where('option_text', '6')->first()->option_letter);
        $this->assertEquals('C', $options->where('option_text', '7')->first()->option_letter);

        // Clean up - delete in order to respect foreign key constraints
        // Delete question options
        QuestionOption::where('question_id', $question->question_id)->delete();
        
        // Delete question
        Question::where('question_id', $question->question_id)->delete();
        
        // Delete question bank
        QuestionBank::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete user
        User::where('user_id', $professor->user_id)->delete();
    }

    public function test_professor_cannot_update_other_professors_question(): void
    {
        // Create two different professors
        $professor1 = User::create([
            'username' => 'professor1_q_update_' . time(),
            'email' => 'professor1_q_update_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);

        $professor2 = User::create([
            'username' => 'professor2_q_update_' . time(),
            'email' => 'professor2_q_update_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for professor1
        $classroom = Classroom::create([
            'name' => 'Professor1 Classroom Question',
            'code' => 'PROF1_Q_' . substr(time(), -6),
            'description' => 'Professor1 classroom for question test',
            'user_id' => $professor1->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Create a question bank for professor1
        $questionBank = QuestionBank::create([
            'name' => 'Professor1 Quiz',
            'description' => 'Question bank owned by professor1',
            'user_id' => $professor1->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        // Create a question for professor1
        $question = Question::create([
            'question_bank_id' => $questionBank->question_bank_id,
            'question_text' => 'What is 2+2?',
            'question_type' => 'MultipleChoice',
            'difficulty_level' => 1,
        ]);

        // Create options for the question
        QuestionOption::create([
            'question_id' => $question->question_id,
            'option_letter' => 'A',
            'option_text' => '3',
            'is_correct' => false,
        ]);

        QuestionOption::create([
            'question_id' => $question->question_id,
            'option_letter' => 'B',
            'option_text' => '4',
            'is_correct' => true,
        ]);

        // Prepare update data
        $updateData = [
            'Question' => 'Hacked question',
            'Option 1' => 'Wrong',
            'Option 2' => 'Also wrong',
            'Answer' => 'Wrong',
            'Difficulty' => 'Hard'
        ];

        // Authenticate as professor2 and try to update professor1's question
        $response = $this->actingAs($professor2, 'sanctum')
            ->patchJson("/api/questions/{$question->question_id}", $updateData);

        // Assert unauthorized response
        $response->assertStatus(403);

        // Assert error message
        $response->assertJson([
            'error' => 'Unauthorized'
        ]);

        // Verify that professor1's question was NOT updated
        $this->assertDatabaseHas('question', [
            'question_id' => $question->question_id,
            'question_text' => 'What is 2+2?', // Original text, not updated
            'difficulty_level' => 1, // Original difficulty, not updated
        ]);

        // Verify the options were NOT updated
        $this->assertDatabaseHas('question_option', [
            'question_id' => $question->question_id,
            'option_text' => '4', // Original correct answer, not updated
            'is_correct' => true,
        ]);

        // Clean up - delete in order to respect foreign key constraints
        // Delete question options
        QuestionOption::where('question_id', $question->question_id)->delete();
        
        // Delete question
        Question::where('question_id', $question->question_id)->delete();
        
        // Delete question bank
        QuestionBank::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete users
        User::whereIn('user_id', [$professor1->user_id, $professor2->user_id])->delete();
    }

    public function test_professor_can_delete_question(): void
    {
        // Create a professor user
        $professor = User::create([
            'username' => 'test_professor_q_delete_' . time(),
            'email' => 'professor_q_delete_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Classroom Question Delete',
            'code' => 'TEST_Q_DEL_' . substr(time(), -6),
            'description' => 'Test classroom for question delete test',
            'user_id' => $professor->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Create a question bank
        $questionBank = QuestionBank::create([
            'name' => 'Math Quiz',
            'description' => 'Question bank for delete test',
            'user_id' => $professor->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        // Create multiple questions for the question bank
        $question1 = Question::create([
            'question_bank_id' => $questionBank->question_bank_id,
            'question_text' => 'What is 2+2?',
            'question_type' => 'MultipleChoice',
            'difficulty_level' => 1,
        ]);

        $question2 = Question::create([
            'question_bank_id' => $questionBank->question_bank_id,
            'question_text' => 'What is 3+3?',
            'question_type' => 'MultipleChoice',
            'difficulty_level' => 2,
        ]);

        $question3 = Question::create([
            'question_bank_id' => $questionBank->question_bank_id,
            'question_text' => 'What is 4+4?',
            'question_type' => 'MultipleChoice',
            'difficulty_level' => 3,
        ]);

        // Create options for question1 (the one we'll delete)
        QuestionOption::create([
            'question_id' => $question1->question_id,
            'option_letter' => 'A',
            'option_text' => '3',
            'is_correct' => false,
        ]);

        QuestionOption::create([
            'question_id' => $question1->question_id,
            'option_letter' => 'B',
            'option_text' => '4',
            'is_correct' => true,
        ]);

        QuestionOption::create([
            'question_id' => $question1->question_id,
            'option_letter' => 'C',
            'option_text' => '5',
            'is_correct' => false,
        ]);

        // Create options for question2
        QuestionOption::create([
            'question_id' => $question2->question_id,
            'option_letter' => 'A',
            'option_text' => '5',
            'is_correct' => false,
        ]);

        QuestionOption::create([
            'question_id' => $question2->question_id,
            'option_letter' => 'B',
            'option_text' => '6',
            'is_correct' => true,
        ]);

        // Verify question1 exists before deletion
        $this->assertDatabaseHas('question', [
            'question_id' => $question1->question_id,
            'question_text' => 'What is 2+2?',
        ]);

        // Verify question1 has options before deletion
        $this->assertDatabaseHas('question_option', [
            'question_id' => $question1->question_id,
            'option_text' => '4',
        ]);

        // Count questions before deletion
        $questionsBefore = Question::where('question_bank_id', $questionBank->question_bank_id)->count();
        $this->assertEquals(3, $questionsBefore);

        // Authenticate the professor and delete question1
        $response = $this->actingAs($professor, 'sanctum')
            ->deleteJson("/api/questions/{$question1->question_id}");

        // Assert successful response
        $response->assertStatus(200);

        // Assert response structure
        $response->assertJsonStructure([
            'deleted',
            'remaining_questions'
        ]);

        // Assert response content
        $response->assertJson([
            'deleted' => true,
            'remaining_questions' => 2
        ]);

        // Verify question1 was deleted
        $this->assertDatabaseMissing('question', [
            'question_id' => $question1->question_id,
        ]);

        // Verify question1's options were cascade deleted
        $this->assertDatabaseMissing('question_option', [
            'question_id' => $question1->question_id,
        ]);

        // Verify other questions still exist
        $this->assertDatabaseHas('question', [
            'question_id' => $question2->question_id,
            'question_text' => 'What is 3+3?',
        ]);

        $this->assertDatabaseHas('question', [
            'question_id' => $question3->question_id,
            'question_text' => 'What is 4+4?',
        ]);

        // Verify question2's options still exist
        $this->assertDatabaseHas('question_option', [
            'question_id' => $question2->question_id,
            'option_text' => '6',
        ]);

        // Count questions after deletion
        $questionsAfter = Question::where('question_bank_id', $questionBank->question_bank_id)->count();
        $this->assertEquals(2, $questionsAfter);

        // Clean up - delete in order to respect foreign key constraints
        // Delete question options for remaining questions
        QuestionOption::whereIn('question_id', [$question2->question_id, $question3->question_id])->delete();
        
        // Delete remaining questions
        Question::whereIn('question_id', [$question2->question_id, $question3->question_id])->delete();
        
        // Delete question bank
        QuestionBank::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete user
        User::where('user_id', $professor->user_id)->delete();
    }

    public function test_professor_cannot_delete_other_professors_question(): void
    {
        // Create two different professors
        $professor1 = User::create([
            'username' => 'professor1_q_delete_' . time(),
            'email' => 'professor1_q_delete_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);

        $professor2 = User::create([
            'username' => 'professor2_q_delete_' . time(),
            'email' => 'professor2_q_delete_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for professor1
        $classroom = Classroom::create([
            'name' => 'Professor1 Classroom Question Delete',
            'code' => 'PROF1_Q_DEL_' . substr(time(), -6),
            'description' => 'Professor1 classroom for question delete test',
            'user_id' => $professor1->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Create a question bank for professor1
        $questionBank = QuestionBank::create([
            'name' => 'Professor1 Quiz',
            'description' => 'Question bank owned by professor1',
            'user_id' => $professor1->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        // Create a question for professor1
        $question = Question::create([
            'question_bank_id' => $questionBank->question_bank_id,
            'question_text' => 'What is 2+2?',
            'question_type' => 'MultipleChoice',
            'difficulty_level' => 1,
        ]);

        // Create options for the question
        QuestionOption::create([
            'question_id' => $question->question_id,
            'option_letter' => 'A',
            'option_text' => '3',
            'is_correct' => false,
        ]);

        QuestionOption::create([
            'question_id' => $question->question_id,
            'option_letter' => 'B',
            'option_text' => '4',
            'is_correct' => true,
        ]);

        // Verify question exists before attempted deletion
        $this->assertDatabaseHas('question', [
            'question_id' => $question->question_id,
            'question_text' => 'What is 2+2?',
        ]);

        // Verify question bank belongs to professor1
        $this->assertDatabaseHas('question_bank', [
            'question_bank_id' => $questionBank->question_bank_id,
            'user_id' => $professor1->user_id,
        ]);

        // Authenticate as professor2 and try to delete professor1's question
        $response = $this->actingAs($professor2, 'sanctum')
            ->deleteJson("/api/questions/{$question->question_id}");

        // Assert unauthorized response
        $response->assertStatus(403);

        // Assert error message
        $response->assertJson([
            'error' => 'Unauthorized'
        ]);

        // Verify that professor1's question was NOT deleted
        $this->assertDatabaseHas('question', [
            'question_id' => $question->question_id,
            'question_text' => 'What is 2+2?',
        ]);

        // Verify the options were NOT deleted
        $this->assertDatabaseHas('question_option', [
            'question_id' => $question->question_id,
            'option_text' => '4',
        ]);

        // Clean up - delete in order to respect foreign key constraints
        // Delete question options
        QuestionOption::where('question_id', $question->question_id)->delete();
        
        // Delete question
        Question::where('question_id', $question->question_id)->delete();
        
        // Delete question bank
        QuestionBank::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete users
        User::whereIn('user_id', [$professor1->user_id, $professor2->user_id])->delete();
    }
    public function test_admin_can_update_any_question(): void
    {
        // 1) Create the owning professor user & record
        $professor = User::create([
            'username'      => 'owner_' . time(),
            'email'         => 'owner_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role'          => 'Professor',
        ]);

        // 2) Create a classroom for that professor
        $classroom = Classroom::create([
            'name'          => 'Owner Classroom',
            'code'          => 'OWN_' . substr(time(), -6),
            'description'   => 'Class for admin update test',
            'user_id'  => $professor->user_id,
            'is_archived'   => false,
            'start_date'    => now(),
            'end_date'      => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // 3) Create a question bank under that classroom
        $questionBank = QuestionBank::create([
            'name'          => 'Admin Bank',
            'description'   => 'Bank for admin update test',
            'user_id'  => $professor->user_id,
            'classroom_id'  => $classroom->classroom_id,
        ]);

        // 4) Create a question in that bank
        $question = Question::create([
            'question_bank_id' => $questionBank->question_bank_id,
            'question_text'    => 'Original text?',
            'question_type'    => 'MultipleChoice',
            'difficulty_level' => 1,
        ]);

        // 5) Spin up an Admin user
        $admin = User::create([
            'username'      => 'admin_' . time(),
            'email'         => 'admin_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role'          => 'Admin',
        ]);

        // 6) Perform the update as Admin
        $payload = ['Question' => 'Edited by admin!'];
        $response = $this->actingAs($admin, 'sanctum')
                         ->patchJson("/api/questions/{$question->question_id}", $payload);

        // 7) Assert success response
        $response->assertStatus(200)
                 ->assertJson(['message' => 'Question updated successfully']);

        // 8) Verify the database was updated
        $fresh = Question::find($question->question_id);
        $this->assertEquals('Edited by admin!', $fresh->question_text);

        // --- Clean up (respecting FKs) ---
        QuestionOption::where('question_id', $question->question_id)->delete();
        Question::where('question_id', $question->question_id)->delete();
        QuestionBank::where('question_bank_id', $questionBank->question_bank_id)->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::whereIn('user_id', [$professor->user_id, $admin->user_id])->delete();
    }
    public function test_update_rolls_back_and_returns_500_on_exception(): void
    {
        // 1) Create the owning professor user & record
        $professor = User::create([
            'username'      => 'ex_' . time(),
            'email'         => 'ex_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role'          => 'Professor',
        ]);

        // 2) Create a classroom for that professor
        $classroom = Classroom::create([
            'name'          => 'Exception Class',
            'code'          => 'EXC_' . substr(time(), -6),
            'description'   => 'Class to force exception',
            'user_id'  => $professor->user_id,
            'is_archived'   => false,
            'start_date'    => now(),
            'end_date'      => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // 3) Create a question bank under that classroom
        $questionBank = QuestionBank::create([
            'name'          => 'Exception Bank',
            'description'   => 'Bank to force exception',
            'user_id'  => $professor->user_id,
            'classroom_id'  => $classroom->classroom_id,
        ]);

        // 4) Create a question in that bank
        $question = Question::create([
            'question_bank_id' => $questionBank->question_bank_id,
            'question_text'    => 'Will fail?',
            'question_type'    => 'MultipleChoice',
            'difficulty_level' => 1,
        ]);

        // 5) Mock DB to throw on commit
        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->andThrow(new \Exception('Forced failure'));
        DB::shouldReceive('rollBack')->once();

        // 6) Hit the update endpoint
        $payload = ['Question' => 'Trigger exception'];
        $response = $this->actingAs($professor, 'sanctum')
                         ->patchJson("/api/questions/{$question->question_id}", $payload);

        // 7) Assert we hit the catch block
        $response->assertStatus(500)
                 ->assertJson([
                     'error'   => 'Update failed',
                     'details' => 'Forced failure',
                 ]);

        // --- Teardown (respecting foreign keys) ---
        QuestionOption::where('question_id', $question->question_id)->delete();
        Question::where('question_id', $question->question_id)->delete();
        QuestionBank::where('question_bank_id', $questionBank->question_bank_id)->delete();
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        User::where('user_id', $professor->user_id)->delete();
    }
} 