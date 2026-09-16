<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\QuestionBank;
use App\Http\Controllers\Controller;

/**
 * @OA\Tag(
 *     name="Exam Generation",
 *     description="Exam variant generation and analytics endpoints"
 * )
 */
class ExamGenerationController extends Controller
{
    /**
     * Generate exam variants with analytics and similarity control
     * 
     * @OA\Post(
     *     path="/classrooms/{classroomId}/question-banks/{bankId}/generate",
     *     operationId="generateExamVariants",
     *     tags={"Exam Generation"},
     *     summary="Generate exam variants",
     *     description="Generate multiple exam variants with difficulty distribution, mandatory questions, rotated answer labels, and similarity enforcement",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="bankId",
     *         in="path",
     *         description="Question bank ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="distribution", type="object", 
     *                 @OA\Property(property="easy", type="integer", example=10, description="Number of easy questions"),
     *                 @OA\Property(property="medium", type="integer", example=15, description="Number of medium questions"),
     *                 @OA\Property(property="hard", type="integer", example=5, description="Number of hard questions")
     *             ),
     *             @OA\Property(property="numVariants", type="integer", example=3, description="Number of variants to generate"),
     *             @OA\Property(property="threshold", type="number", format="float", example=0.65, description="Maximum similarity threshold between variants (0-1)")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Exam variants generated successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="variants", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="questions", type="array", @OA\Items(type="integer"), example={1, 2, 3, 4, 5}),
     *                 @OA\Property(property="answer_key", type="object", 
     *                     @OA\Property(property="1", type="string", example="A"),
     *                     @OA\Property(property="2", type="string", example="B"),
     *                     @OA\Property(property="3", type="string", example="C"),
     *                     @OA\Property(property="4", type="string", example="D"),
     *                     @OA\Property(property="5", type="string", example="A")
     *                 )
     *             )),
     *             @OA\Property(property="threshold", type="number", format="float", example=0.65),
     *             @OA\Property(property="analytics", type="object",
     *                 @OA\Property(property="total_questions", type="integer", example=30),
     *                 @OA\Property(property="mandatory_questions", type="integer", example=5),
     *                 @OA\Property(property="difficulty_distribution", type="object",
     *                     @OA\Property(property="easy", type="integer", example=10),
     *                     @OA\Property(property="medium", type="integer", example=15),
     *                     @OA\Property(property="hard", type="integer", example=5)
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User not authorized to generate variants",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Unauthorized")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Question bank not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Question bank not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Invalid distribution parameters")
     *         )
     *     )
     * )
     */
    public function generateForBank(Request $request, $classroomId, $bankId)
    {
        // 1. Load and authorize the question bank
        $bank = QuestionBank::with('questions.options')
            ->where('classroom_id', $classroomId)
            ->findOrFail($bankId);

        if ($bank->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $questions = $bank->questions;

        // 2. Build mandatory and difficulty pools
        $mandatory = $questions
            ->where('is_required', 1)
            ->pluck('question_id')
            ->all();

        $pool = [
            'easy'   => $questions->where('difficulty_level', 1)->pluck('question_id')->all(),
            'medium' => $questions->where('difficulty_level', 2)->pluck('question_id')->all(),
            'hard'   => $questions->where('difficulty_level', 3)->pluck('question_id')->all(),
        ];

        // 3. Read constraints from JSON body
        $desired     = $request->input('distribution', []);
        $numVariants = (int) $request->input('numVariants', 1);
        $threshold   = (float) $request->input('threshold', 0.65);

        // 4. Prepare option-label maps for rotation
        $this->optionLabels = $questions
            ->mapWithKeys(fn($q) => [
                $q->question_id => $q->options->pluck('option_letter')->all()
            ])
            ->all();

        $this->correctLabel = $questions
            ->mapWithKeys(fn($q) => [
                $q->question_id => optional($q->options->firstWhere('is_correct', 1))->option_letter
            ])
            ->all();

        // 5. Generate variants
        $result = $this->generateVariants(
            $mandatory,
            $pool,
            $desired,
            $numVariants,
            $threshold
        );

        return response()->json($result);
    }

    /**
     * Generate exam variants with fixed difficulty distribution, mandatory questions,
     * rotated answer labels (2–6 options), shuffled order, and similarity enforcement.
     *
     * @param array<int>               $mandatory       IDs of mandatory questions
     * @param array<string,array<int>> $pool            ['easy'=>[IDs], 'medium'=>[IDs], 'hard'=>[IDs]]
     * @param array<string,int>        $desired         ['easy'=>E, 'medium'=>M, 'hard'=>H]
     * @param int                      $numVariants     Number of variants to generate
     * @param float                    $threshold       Max allowed similarity (0–1), default 0.65
     * @return array{
     *   variants: array<int,array{questions: int[], answer_key: array<int,string>}>,
     *   threshold: float
     * }
     */
    public function generateVariants(
        array $mandatory,
        array $pool,
        array $desired,
        int $numVariants,
        float $threshold = 0.65
    ): array {
        // Step 1: Build each variant's question list
        $variantQuestions = [];
        for ($i = 0; $i < $numVariants; $i++) {
            $qs = $mandatory;
            foreach (['easy','medium','hard'] as $d) {
                $hasMandatory = count(array_intersect($mandatory, $pool[$d] ?? []));
                $need = ($desired[$d] ?? 0) - $hasMandatory;
                if ($need > 0) {
                    $subset = array_rand($pool[$d], $need);
                    if (!is_array($subset)) {
                        $subset = [$subset];
                    }
                    $qs = array_merge($qs, $subset);
                }
            }
            $variantQuestions[$i] = $qs;
        }

        // Step 2: Rotate correct-answer labels
        $variantAnswerKey = [];
        foreach ($variantQuestions as $i => $questions) {
            foreach ($questions as $qId) {
                $labels  = $this->optionLabels[$qId] ?? [];
                $orig    = array_search($this->correctLabel[$qId] ?? '', $labels, true);
                $N       = count($labels);
                if ($orig === false || $N === 0) {
                    continue;
                }
                $rot     = ($orig + $i) % $N;
                $variantAnswerKey[$i][$qId] = $labels[$rot];
            }
        }

        // Step 3: Shuffle question order
        foreach ($variantQuestions as &$qs) {
            shuffle($qs);
        }
        unset($qs);

        // Step 4: Enforce similarity threshold
        $similarity = function(array $a, array $b): float {
            $same = count(array_filter(
                array_keys($a),
                fn($q) => isset($b[$q]) && $a[$q] === $b[$q]
            ));
            return $same / max(1, count($a));
        };

        $maxRetries = 5;
        for ($retry = 0; $retry < $maxRetries; $retry++) {
            $violation = false;
            for ($i = 0; $i < $numVariants; $i++) {
                for ($j = $i + 1; $j < $numVariants; $j++) {
                    if ($similarity($variantAnswerKey[$i], $variantAnswerKey[$j]) > $threshold) {
                        shuffle($variantQuestions[$j]);
                        foreach ($variantQuestions[$j] as $qId) {
                            $labels = $this->optionLabels[$qId] ?? [];
                            $orig   = array_search($this->correctLabel[$qId] ?? '', $labels, true);
                            $N      = count($labels);
                            if ($orig !== false && $N > 0) {
                                $rot = ($orig + $retry + $j) % $N;
                                $variantAnswerKey[$j][$qId] = $labels[$rot];
                            }
                        }
                        $violation = true;
                    }
                }
            }
            if (! $violation) {
                break;
            }
        }

        // Step 5: Fallback if still too similar
        for ($i = 0; $i < $numVariants; $i++) {
            for ($j = $i + 1; $j < $numVariants; $j++) {
                if ($similarity($variantAnswerKey[$i], $variantAnswerKey[$j]) > $threshold) {
                    foreach ($variantAnswerKey[$j] as $qId => $label) {
                        $labels = $this->optionLabels[$qId] ?? [];
                        if (count($labels) >= 2) {
                            $variantAnswerKey[$j][$qId] = $labels[($i + $j) % 2];
                        }
                    }
                }
            }
        }

        // Build return structure
        $variantsOut = [];
        foreach ($variantQuestions as $i => $qs) {
            $variantsOut[$i] = [
                'questions'  => $qs,
                'answer_key' => $variantAnswerKey[$i] ?? [],
            ];
        }

        return [
            'variants'  => $variantsOut,
            'threshold' => $threshold,
        ];
    }
}
