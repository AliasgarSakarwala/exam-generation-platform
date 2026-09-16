<?php

namespace Tests\Feature\QuestionBank;

use App\Models\User;
use App\Models\Classroom;
use App\Models\QuestionBank;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\QuestionTag;
use Tests\TestCase;

class QuestionBankTest extends TestCase
{
    public function test_professor_can_view_question_banks_in_classroom(): void
    {
        // Create a professor user
        $professor = User::create([
            'username' => 'test_professor_qb_' . time(),
            'email' => 'professor_qb_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Classroom',
            'code' => 'TEST101_' . time(),
            'description' => 'Test classroom description',
            'user_id' => $professor->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Create question banks for the professor in this classroom
        $questionBank1 = QuestionBank::create([
            'name' => 'Test Question Bank 1',
            'description' => 'First test question bank',
            'user_id' => $professor->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        $questionBank2 = QuestionBank::create([
            'name' => 'Test Question Bank 2',
            'description' => 'Second test question bank',
            'user_id' => $professor->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        // Create some questions for the first question bank
        $question1 = Question::create([
            'question_bank_id' => $questionBank1->question_bank_id,
            'question_text' => 'What is 2+2?',
            'question_type' => 'MultipleChoice',
            'difficulty_level' => 1,
        ]);

        $question2 = Question::create([
            'question_bank_id' => $questionBank1->question_bank_id,
            'question_text' => 'What is the capital of France?',
            'question_type' => 'MultipleChoice',
            'difficulty_level' => 2,
        ]);

        // Authenticate the professor
        $response = $this->actingAs($professor, 'sanctum')
            ->getJson("/api/classrooms/{$classroom->classroom_id}/question-banks");

        // Assert successful response
        $response->assertStatus(200);

        // Assert response structure
        $response->assertJsonStructure([
            '*' => [
                'question_bank_id',
                'name',
                'description',
                'user_id',
                'classroom_id',
                'questions_count',
                'questions' => [
                    '*' => [
                        'question_id',
                        'question_bank_id',
                        'question_text',
                        'question_type',
                        'difficulty_level'
                    ]
                ]
            ]
        ]);

        // Assert we get both question banks
        $responseData = $response->json();
        $this->assertCount(2, $responseData);

        // Assert question count is correct
        $this->assertEquals(2, $responseData[0]['questions_count']);
        $this->assertEquals(0, $responseData[1]['questions_count']);

        // Assert sample questions are included (first 3)
        $this->assertCount(2, $responseData[0]['questions']);
        $this->assertCount(0, $responseData[1]['questions']);

        // Clean up - delete in order to respect foreign key constraints
        // First get all question IDs to clean up related data
        $questionIds = Question::whereIn('question_bank_id', [$questionBank1->question_bank_id, $questionBank2->question_bank_id])
            ->pluck('question_id')
            ->toArray();
        
        // Delete question_tag relationships (pivot table)
        QuestionTag::whereIn('question_id', $questionIds)->delete();
        
        // Delete question options
        QuestionOption::whereIn('question_id', $questionIds)->delete();
        
        // Delete questions
        Question::whereIn('question_bank_id', [$questionBank1->question_bank_id, $questionBank2->question_bank_id])->delete();
        
        // Delete question banks
        QuestionBank::whereIn('question_bank_id', [$questionBank1->question_bank_id, $questionBank2->question_bank_id])->delete();
        
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete user
        User::where('user_id', $professor->user_id)->delete();
    }

    public function test_professor_cannot_view_other_professors_question_banks(): void
    {
        // Create two different professors
        $professor1 = User::create([
            'username' => 'professor1_qb_' . time(),
            'email' => 'professor1_qb_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);

        $professor2 = User::create([
            'username' => 'professor2_qb_' . time(),
            'email' => 'professor2_qb_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for professor1
        $classroom = Classroom::create([
            'name' => 'Professor1 Classroom',
            'code' => 'PROF1_101_' . time(),
            'description' => 'Professor1 classroom description',
            'user_id' => $professor1->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Create a question bank for professor1
        $questionBank = QuestionBank::create([
            'name' => 'Professor1 Question Bank',
            'description' => 'Question bank owned by professor1',
            'user_id' => $professor1->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        // Create some questions for the question bank
        $question = Question::create([
            'question_bank_id' => $questionBank->question_bank_id,
            'question_text' => 'What is 2+2?',
            'question_type' => 'MultipleChoice',
            'difficulty_level' => 1,
        ]);

        // Authenticate as professor2 and try to access professor1's question banks
        $response = $this->actingAs($professor2, 'sanctum')
            ->getJson("/api/classrooms/{$classroom->classroom_id}/question-banks");

        // Assert successful response (should return empty array, not error)
        $response->assertStatus(200);

        // Assert response is empty array since professor2 has no question banks in this classroom
        $responseData = $response->json();
        $this->assertIsArray($responseData);
        $this->assertCount(0, $responseData);

        // Verify that professor1's question bank still exists and is not accessible to professor2
        $this->assertDatabaseHas('question_bank', [
            'question_bank_id' => $questionBank->question_bank_id,
            'user_id' => $professor1->user_id,
        ]);

        // Clean up - delete in order to respect foreign key constraints
        // First get all question IDs to clean up related data
        $questionIds = Question::where('question_bank_id', $questionBank->question_bank_id)
            ->pluck('question_id')
            ->toArray();
        
        // Delete question_tag relationships (pivot table)
        QuestionTag::whereIn('question_id', $questionIds)->delete();
        
        // Delete question options
        QuestionOption::whereIn('question_id', $questionIds)->delete();
        
        // Delete questions
        Question::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete question bank
        QuestionBank::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete users
        User::whereIn('user_id', [$professor1->user_id, $professor2->user_id])->delete();
    }

    public function test_professor_can_view_question_bank_details(): void
    {
        // Create a professor user
        $professor = User::create([
            'username' => 'test_professor_qb_show_' . time(),
            'email' => 'professor_qb_show_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Classroom Show',
            'code' => 'TEST_' . substr(time(), -6),
            'description' => 'Test classroom for show method',
            'user_id' => $professor->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Create a question bank
        $questionBank = QuestionBank::create([
            'name' => 'Test Question Bank Show',
            'description' => 'Question bank for show test',
            'user_id' => $professor->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        // Create questions with options
        $question1 = Question::create([
            'question_bank_id' => $questionBank->question_bank_id,
            'question_text' => 'What is 2+2?',
            'question_type' => 'MultipleChoice',
            'difficulty_level' => 1,
        ]);

        $question2 = Question::create([
            'question_bank_id' => $questionBank->question_bank_id,
            'question_text' => 'What is the capital of France?',
            'question_type' => 'MultipleChoice',
            'difficulty_level' => 2,
        ]);

        // Create options for question1
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
            'option_text' => 'London',
            'is_correct' => false,
        ]);

        QuestionOption::create([
            'question_id' => $question2->question_id,
            'option_letter' => 'B',
            'option_text' => 'Paris',
            'is_correct' => true,
        ]);

        // Authenticate the professor and get question bank details
        $response = $this->actingAs($professor, 'sanctum')
            ->getJson("/api/classrooms/{$classroom->classroom_id}/question-banks/{$questionBank->question_bank_id}");

        // Assert successful response
        $response->assertStatus(200);

        // Assert response structure
        $response->assertJsonStructure([
            'question_bank_id',
            'name',
            'description',
            'user_id',
            'classroom_id',
            'questions' => [
                '*' => [
                    'question_id',
                    'question_bank_id',
                    'question_text',
                    'question_type',
                    'difficulty_level',
                    'options' => [
                        '*' => [
                            'question_option_id',
                            'question_id',
                            'option_letter',
                            'option_text',
                            'is_correct'
                        ]
                    ]
                ]
            ]
        ]);

        // Assert response content
        $responseData = $response->json();
        $this->assertEquals($questionBank->name, $responseData['name']);
        $this->assertEquals($questionBank->description, $responseData['description']);
        $this->assertEquals($professor->user_id, $responseData['user_id']);
        $this->assertEquals($classroom->classroom_id, $responseData['classroom_id']);

        // Assert questions are included
        $this->assertCount(2, $responseData['questions']);

        // Assert first question has options
        $this->assertCount(3, $responseData['questions'][0]['options']);
        $this->assertEquals('What is 2+2?', $responseData['questions'][0]['question_text']);

        // Assert second question has options
        $this->assertCount(2, $responseData['questions'][1]['options']);
        $this->assertEquals('What is the capital of France?', $responseData['questions'][1]['question_text']);

        // Clean up - delete in order to respect foreign key constraints
        // First get all question IDs to clean up related data
        $questionIds = Question::where('question_bank_id', $questionBank->question_bank_id)
            ->pluck('question_id')
            ->toArray();
        
        // Delete question_tag relationships (pivot table)
        QuestionTag::whereIn('question_id', $questionIds)->delete();
        
        // Delete question options
        QuestionOption::whereIn('question_id', $questionIds)->delete();
        
        // Delete questions
        Question::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete question bank
        QuestionBank::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete user
        User::where('user_id', $professor->user_id)->delete();
    }

    public function test_professor_cannot_view_other_professors_question_bank_details(): void
    {
        // Create two different professors
        $professor1 = User::create([
            'username' => 'professor1_qb_show_' . time(),
            'email' => 'professor1_qb_show_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);

        $professor2 = User::create([
            'username' => 'professor2_qb_show_' . time(),
            'email' => 'professor2_qb_show_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for professor1
        $classroom = Classroom::create([
            'name' => 'Professor1 Classroom Show',
            'code' => 'PROF1_' . substr(time(), -6),
            'description' => 'Professor1 classroom for show test',
            'user_id' => $professor1->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Create a question bank for professor1
        $questionBank = QuestionBank::create([
            'name' => 'Professor1 Question Bank Show',
            'description' => 'Question bank owned by professor1 for show test',
            'user_id' => $professor1->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        // Create a question for the question bank
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

        // Authenticate as professor2 and try to access professor1's question bank details
        $response = $this->actingAs($professor2, 'sanctum')
            ->getJson("/api/classrooms/{$classroom->classroom_id}/question-banks/{$questionBank->question_bank_id}");

        // Assert unauthorized response
        $response->assertStatus(403);

        // Assert error message
        $response->assertJson([
            'error' => 'Unauthorized'
        ]);

        // Verify that professor1's question bank still exists and is not accessible to professor2
        $this->assertDatabaseHas('question_bank', [
            'question_bank_id' => $questionBank->question_bank_id,
            'user_id' => $professor1->user_id,
        ]);

        // Clean up - delete in order to respect foreign key constraints
        // First get all question IDs to clean up related data
        $questionIds = Question::where('question_bank_id', $questionBank->question_bank_id)
            ->pluck('question_id')
            ->toArray();
        
        // Delete question_tag relationships (pivot table)
        QuestionTag::whereIn('question_id', $questionIds)->delete();
        
        // Delete question options
        QuestionOption::whereIn('question_id', $questionIds)->delete();
        
        // Delete questions
        Question::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete question bank
        QuestionBank::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete users
        User::whereIn('user_id', [$professor1->user_id, $professor2->user_id])->delete();
    }

    public function test_professor_can_create_question_bank_with_questions(): void
    {
        // Create a professor user
        $professor = User::create([
            'username' => 'test_professor_qb_store_' . time(),
            'email' => 'professor_qb_store_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Classroom Store',
            'code' => 'TEST_STORE_' . substr(time(), -6),
            'description' => 'Test classroom for store method',
            'user_id' => $professor->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Prepare question bank data in the format expected by the controller
        $questionBankData = [
            'Math Quiz' => [
                [
                    'Question' => 'What is 2+2?',
                    'Option 1' => '3',
                    'Option 2' => '4',
                    'Option 3' => '5',
                    'Option 4' => '6',
                    'Answer' => '4',
                    'Difficulty' => 'Easy'
                ],
                [
                    'Question' => 'What is 5*5?',
                    'Option 1' => '20',
                    'Option 2' => '25',
                    'Option 3' => '30',
                    'Option 4' => '35',
                    'Answer' => '25',
                    'Difficulty' => 'Medium'
                ],
                [
                    'Question' => 'What is the square root of 144?',
                    'Option 1' => '10',
                    'Option 2' => '11',
                    'Option 3' => '12',
                    'Option 4' => '13',
                    'Answer' => '12',
                    'Difficulty' => 'Hard'
                ]
            ]
        ];

        // Authenticate the professor and create question bank
        $response = $this->actingAs($professor, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->classroom_id}/question-banks", $questionBankData);

        // Assert successful response
        $response->assertStatus(201);

        // Assert response message
        $response->assertJson([
            'message' => 'Question bank(s) created successfully'
        ]);

        // Verify question bank was created
        $this->assertDatabaseHas('question_bank', [
            'name' => 'Math Quiz',
            'user_id' => $professor->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        // Get the created question bank
        $questionBank = QuestionBank::where('name', 'Math Quiz')
            ->where('user_id', $professor->user_id)
            ->first();

        // Verify questions were created
        $questions = Question::where('question_bank_id', $questionBank->question_bank_id)->get();
        $this->assertCount(3, $questions);

        // Verify difficulty mapping
        $easyQuestion = $questions->where('question_text', 'What is 2+2?')->first();
        $mediumQuestion = $questions->where('question_text', 'What is 5*5?')->first();
        $hardQuestion = $questions->where('question_text', 'What is the square root of 144?')->first();

        $this->assertEquals(1, $easyQuestion->difficulty_level); // Easy = 1
        $this->assertEquals(2, $mediumQuestion->difficulty_level); // Medium = 2
        $this->assertEquals(3, $hardQuestion->difficulty_level); // Hard = 3

        // Verify options were created correctly
        $easyOptions = QuestionOption::where('question_id', $easyQuestion->question_id)->get();
        $this->assertCount(4, $easyOptions);

        // Verify correct answer is marked
        $correctOption = $easyOptions->where('option_text', '4')->first();
        $this->assertTrue($correctOption->is_correct);

        // Verify incorrect answers are not marked
        $incorrectOption = $easyOptions->where('option_text', '3')->first();
        $this->assertFalse($incorrectOption->is_correct);

        // Clean up - delete in order to respect foreign key constraints
        // First get all question IDs to clean up related data
        $questionIds = Question::where('question_bank_id', $questionBank->question_bank_id)
            ->pluck('question_id')
            ->toArray();
        
        // Delete question_tag relationships (pivot table)
        QuestionTag::whereIn('question_id', $questionIds)->delete();
        
        // Delete question options
        QuestionOption::whereIn('question_id', $questionIds)->delete();
        
        // Delete questions
        Question::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete question bank
        QuestionBank::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete user
        User::where('user_id', $professor->user_id)->delete();
    }

    public function test_question_bank_creation_validation(): void
    {
        // Create a professor user
        $professor = User::create([
            'username' => 'test_professor_qb_val_' . time(),
            'email' => 'professor_qb_val_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Classroom Validation',
            'code' => 'TEST_VAL_' . substr(time(), -6),
            'description' => 'Test classroom for validation',
            'user_id' => $professor->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Test with invalid difficulty level
        $invalidData = [
            'Math Quiz' => [
                [
                    'Question' => 'What is 2+2?',
                    'Option 1' => '3',
                    'Option 2' => '4',
                    'Answer' => '4',
                    'Difficulty' => 'Invalid' // Invalid difficulty level
                ]
            ]
        ];

        // Authenticate the professor and try to create question bank with invalid data
        $response = $this->actingAs($professor, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->classroom_id}/question-banks", $invalidData);

        // Assert error response
        $response->assertStatus(500);

        // Assert error message structure
        $response->assertJsonStructure([
            'error',
            'details'
        ]);

        // Verify no question bank was created
        $this->assertDatabaseMissing('question_bank', [
            'name' => 'Math Quiz',
            'user_id' => $professor->user_id,
        ]);

        // Test with empty data
        $emptyData = [];

        $response = $this->actingAs($professor, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->classroom_id}/question-banks", $emptyData);

        // Assert successful response for empty data (controller doesn't validate empty data)
        $response->assertStatus(201);

        // Assert success message
        $response->assertJson([
            'message' => 'Question bank(s) created successfully'
        ]);

        // Clean up
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete user
        User::where('user_id', $professor->user_id)->delete();
    }

    public function test_professor_can_update_question_bank(): void
    {
        // Create a professor user
        $professor = User::create([
            'username' => 'test_professor_qb_update_' . time(),
            'email' => 'professor_qb_update_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Classroom Update',
            'code' => 'TEST_UPDATE_' . substr(time(), -6),
            'description' => 'Test classroom for update method',
            'user_id' => $professor->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Create a question bank
        $questionBank = QuestionBank::create([
            'name' => 'Original Math Quiz',
            'description' => 'Original description',
            'user_id' => $professor->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        // Create a question for the question bank
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
            'name' => 'Updated Math Quiz',
            'description' => 'Updated description',
            'questions' => [
                [
                    'Question' => 'What is 3+3?',
                    'Option 1' => '5',
                    'Option 2' => '6',
                    'Option 3' => '7',
                    'Answer' => '6',
                    'Difficulty' => 'Medium'
                ]
            ]
        ];

        // Authenticate the professor and update question bank
        $response = $this->actingAs($professor, 'sanctum')
            ->patchJson("/api/classrooms/{$classroom->classroom_id}/question-banks/{$questionBank->question_bank_id}", $updateData);

        // Assert successful response
        $response->assertStatus(200);

        // Assert response message
        $response->assertJson([
            'message' => 'Question bank updated successfully'
        ]);

        // Verify question bank metadata was updated
        $this->assertDatabaseHas('question_bank', [
            'question_bank_id' => $questionBank->question_bank_id,
            'name' => 'Updated Math Quiz',
            'description' => 'Updated description',
        ]);

        // Verify new question was created
        $this->assertDatabaseHas('question', [
            'question_bank_id' => $questionBank->question_bank_id,
            'question_text' => 'What is 3+3?',
            'difficulty_level' => 2, // Medium = 2
        ]);

        // Get the updated question bank
        $updatedQuestionBank = QuestionBank::find($questionBank->question_bank_id);

        // Verify the update
        $this->assertEquals('Updated Math Quiz', $updatedQuestionBank->name);
        $this->assertEquals('Updated description', $updatedQuestionBank->description);

        // Clean up - delete in order to respect foreign key constraints
        // First get all question IDs to clean up related data
        $questionIds = Question::where('question_bank_id', $questionBank->question_bank_id)
            ->pluck('question_id')
            ->toArray();
        
        // Delete question_tag relationships (pivot table)
        QuestionTag::whereIn('question_id', $questionIds)->delete();
        
        // Delete question options
        QuestionOption::whereIn('question_id', $questionIds)->delete();
        
        // Delete questions
        Question::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete question bank
        QuestionBank::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete user
        User::where('user_id', $professor->user_id)->delete();
    }

    public function test_professor_cannot_update_other_professors_question_bank(): void
    {
        // Create two different professors
        $professor1 = User::create([
            'username' => 'professor1_qb_update_' . time(),
            'email' => 'professor1_qb_update_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);

        $professor2 = User::create([
            'username' => 'professor2_qb_update_' . time(),
            'email' => 'professor2_qb_update_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for professor1
        $classroom = Classroom::create([
            'name' => 'Professor1 Classroom Update',
            'code' => 'PROF1_UPDATE_' . substr(time(), -6),
            'description' => 'Professor1 classroom for update test',
            'user_id' => $professor1->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Create a question bank for professor1
        $questionBank = QuestionBank::create([
            'name' => 'Professor1 Question Bank',
            'description' => 'Question bank owned by professor1',
            'user_id' => $professor1->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        // Prepare update data
        $updateData = [
            'name' => 'Hacked Question Bank',
            'description' => 'This should not be updated',
        ];

        // Authenticate as professor2 and try to update professor1's question bank
        $response = $this->actingAs($professor2, 'sanctum')
            ->patchJson("/api/classrooms/{$classroom->classroom_id}/question-banks/{$questionBank->question_bank_id}", $updateData);

        // Assert unauthorized response
        $response->assertStatus(403);

        // Assert error message
        $response->assertJson([
            'error' => 'Unauthorized'
        ]);

        // Verify that professor1's question bank was NOT updated
        $this->assertDatabaseHas('question_bank', [
            'question_bank_id' => $questionBank->question_bank_id,
            'name' => 'Professor1 Question Bank', // Original name, not updated
            'description' => 'Question bank owned by professor1', // Original description, not updated
            'user_id' => $professor1->user_id,
        ]);

        // Clean up - delete in order to respect foreign key constraints
        // Delete question bank
        QuestionBank::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete users
        User::whereIn('user_id', [$professor1->user_id, $professor2->user_id])->delete();
    }

    public function test_professor_can_delete_question_bank(): void
    {
        // Create a professor user
        $professor = User::create([
            'username' => 'test_professor_qb_delete_' . time(),
            'email' => 'professor_qb_delete_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for the professor
        $classroom = Classroom::create([
            'name' => 'Test Classroom Delete',
            'code' => 'TEST_DELETE_' . substr(time(), -6),
            'description' => 'Test classroom for delete method',
            'user_id' => $professor->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Create a question bank
        $questionBank = QuestionBank::create([
            'name' => 'Math Quiz to Delete',
            'description' => 'Question bank to be deleted',
            'user_id' => $professor->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        // Create questions for the question bank
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

        // Create options for the questions
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

        // Verify question bank exists before deletion
        $this->assertDatabaseHas('question_bank', [
            'question_bank_id' => $questionBank->question_bank_id,
            'name' => 'Math Quiz to Delete',
        ]);

        // Verify questions exist before deletion
        $this->assertDatabaseHas('question', [
            'question_id' => $question1->question_id,
            'question_bank_id' => $questionBank->question_bank_id,
        ]);

        $this->assertDatabaseHas('question', [
            'question_id' => $question2->question_id,
            'question_bank_id' => $questionBank->question_bank_id,
        ]);

        // Authenticate the professor and delete question bank
        $response = $this->actingAs($professor, 'sanctum')
            ->deleteJson("/api/classrooms/{$classroom->classroom_id}/question-banks/{$questionBank->question_bank_id}");

        // Assert successful response
        $response->assertStatus(200);

        // Assert response message
        $response->assertJson([
            'message' => 'Question bank deleted successfully'
        ]);

        // Verify question bank was deleted
        $this->assertDatabaseMissing('question_bank', [
            'question_bank_id' => $questionBank->question_bank_id,
        ]);

        // Verify questions were cascade deleted
        $this->assertDatabaseMissing('question', [
            'question_id' => $question1->question_id,
        ]);

        $this->assertDatabaseMissing('question', [
            'question_id' => $question2->question_id,
        ]);

        // Verify options were cascade deleted
        $this->assertDatabaseMissing('question_option', [
            'question_id' => $question1->question_id,
        ]);

        $this->assertDatabaseMissing('question_option', [
            'question_id' => $question2->question_id,
        ]);

        // Clean up
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete user
        User::where('user_id', $professor->user_id)->delete();
    }

    public function test_professor_cannot_delete_other_professors_question_bank(): void
    {
        // Create two different professors
        $professor1 = User::create([
            'username' => 'professor1_qb_delete_' . time(),
            'email' => 'professor1_qb_delete_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);

        $professor2 = User::create([
            'username' => 'professor2_qb_delete_' . time(),
            'email' => 'professor2_qb_delete_' . time() . '@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
        ]);


        // Create a classroom for professor1
        $classroom = Classroom::create([
            'name' => 'Professor1 Classroom Delete',
            'code' => 'PROF1_DELETE_' . substr(time(), -6),
            'description' => 'Professor1 classroom for delete test',
            'user_id' => $professor1->user_id,
            'is_archived' => false,
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'student_count' => 0,
        ]);

        // Create a question bank for professor1
        $questionBank = QuestionBank::create([
            'name' => 'Professor1 Question Bank',
            'description' => 'Question bank owned by professor1',
            'user_id' => $professor1->user_id,
            'classroom_id' => $classroom->classroom_id,
        ]);

        // Create a question for the question bank
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

        // Verify question bank exists before attempted deletion
        $this->assertDatabaseHas('question_bank', [
            'question_bank_id' => $questionBank->question_bank_id,
            'name' => 'Professor1 Question Bank',
            'user_id' => $professor1->user_id,
        ]);

        // Authenticate as professor2 and try to delete professor1's question bank
        $response = $this->actingAs($professor2, 'sanctum')
            ->deleteJson("/api/classrooms/{$classroom->classroom_id}/question-banks/{$questionBank->question_bank_id}");

        // Assert unauthorized response
        $response->assertStatus(403);

        // Assert error message
        $response->assertJson([
            'error' => 'Unauthorized'
        ]);

        // Verify that professor1's question bank was NOT deleted
        $this->assertDatabaseHas('question_bank', [
            'question_bank_id' => $questionBank->question_bank_id,
            'name' => 'Professor1 Question Bank',
            'user_id' => $professor1->user_id,
        ]);

        // Verify the question still exists
        $this->assertDatabaseHas('question', [
            'question_id' => $question->question_id,
            'question_bank_id' => $questionBank->question_bank_id,
        ]);

        // Clean up - delete in order to respect foreign key constraints
        // First get all question IDs to clean up related data
        $questionIds = Question::where('question_bank_id', $questionBank->question_bank_id)
            ->pluck('question_id')
            ->toArray();
        
        // Delete question_tag relationships (pivot table)
        QuestionTag::whereIn('question_id', $questionIds)->delete();
        
        // Delete question options
        QuestionOption::whereIn('question_id', $questionIds)->delete();
        
        // Delete questions
        Question::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete question bank
        QuestionBank::where('question_bank_id', $questionBank->question_bank_id)->delete();
        
        // Delete classroom
        Classroom::where('classroom_id', $classroom->classroom_id)->delete();
        
        // Delete users
        User::whereIn('user_id', [$professor1->user_id, $professor2->user_id])->delete();
    }
}
