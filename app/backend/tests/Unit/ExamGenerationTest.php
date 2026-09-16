<?php

/*namespace Tests\Unit;

use App\Models\User;
use App\Models\Classroom;
use App\Models\QuestionBank;
use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExamGenerationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Classroom $classroom;
    protected QuestionBank $bank;

    protected function setUp(): void
    {
        parent::setUp();

        // Create and authenticate a user
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);

        // Create a classroom
        $this->classroom = Classroom::factory()->create([
            'professor_id' => $this->user->id,
        ]);

        // Create a question bank
        $this->bank = QuestionBank::factory()->create([
            'classroom_id' => $this->classroom->id,
            'professor_id' => $this->user->id,
        ]);

        // Seed questions: 2 required, various difficulties, each with 4 options
        for ($i = 1; $i <= 6; $i++) {
            $q = Question::factory()->create([
                'question_bank_id'  => $this->bank->id,
                'difficulty_level'  => ($i <= 2 ? 1 : ($i <= 4 ? 2 : 3)),
                'is_required'       => ($i <= 2 ? 1 : 0),
            ]);

            // Create options A–D
            foreach (['A','B','C','D'] as $letter) {
                QuestionOption::factory()->create([
                    'question_id'   => $q->id,
                    'option_letter' => $letter,
                    'is_correct'    => $letter === 'A',
                ]);
            }
        }
    }

    public function test_generate_variants_success(): void
    {
        $payload = [
            'distribution' => ['easy' => 2, 'medium' => 2, 'hard' => 2],
            'numVariants'  => 3,
            'threshold'    => 0.5,
        ];

        $response = $this->postJson(
            "/classrooms/{$this->classroom->id}/question-banks/{$this->bank->id}/generate",
            $payload
        );

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'variants' => [
                         '*' => ['questions', 'answer_key']
                     ],
                     'threshold'
                 ]);

        $data = $response->json('variants');
        $this->assertCount(3, $data);

        // Check each variant has 6 questions
        foreach ($data as $variant) {
            $this->assertCount(6, $variant['questions']);
            $this->assertCount(6, $variant['answer_key']);
        }

        // Ensure threshold echoed back
        $this->assertEquals(0.5, $response->json('threshold'));
    }

    public function test_generate_variants_validation_error(): void
    {
        // Missing distribution.easy
        $payload = [
            'distribution' => ['medium' => 2, 'hard' => 2],
            'numVariants'  => 1,
        ];

        $response = $this->postJson(
            "/classrooms/{$this->classroom->id}/question-banks/{$this->bank->id}/generate",
            $payload
        );

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['distribution.easy']);
    }

    public function test_generate_variants_unauthorized(): void
    {
        // logout
        Sanctum::actingAs(null);

        $payload = [
            'distribution' => ['easy' => 1, 'medium' => 1, 'hard' => 1],
            'numVariants'  => 1,
            'threshold'    => 0.6,
        ];

        $response = $this->postJson(
            "/classrooms/{$this->classroom->id}/question-banks/{$this->bank->id}/generate",
            $payload
        );

        $response->assertStatus(401);
    }
}*/