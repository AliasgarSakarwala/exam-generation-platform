<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Models\ExamVariantQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Exam Variant Questions",
 *     description="Exam variant question management endpoints"
 * )
 */
class ExamVariantQuestionController extends Controller
{
    /**
     * Create a new exam variant question
     * 
     * @OA\Post(
     *     path="/exam-variant-questions",
     *     operationId="createExamVariantQuestion",
     *     tags={"Exam Variant Questions"},
     *     summary="Create exam variant question",
     *     description="Create a new question for an exam variant with options and correct answers",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="exam_variant_id", type="integer", example=1, description="Exam variant ID"),
     *             @OA\Property(property="question_id", type="integer", example=1, description="Original question ID"),
     *             @OA\Property(property="question_text", type="string", example="What is the capital of France?", description="Question text"),
     *             @OA\Property(property="question_number", type="integer", example=1, description="Question number in the exam"),
     *             @OA\Property(property="options", type="array", @OA\Items(type="string"), example={"London", "Paris", "Berlin", "Madrid"}, description="Available options"),
     *             @OA\Property(property="correct_options", type="array", @OA\Items(type="string"), example={"Paris"}, description="Correct answer(s)"),
     *             @OA\Property(property="mandatory", type="boolean", example=true, description="Whether the question is mandatory")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Question created successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string", example="Question created successfully"),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="exam_variant_question_id", type="integer", example=1),
     *                 @OA\Property(property="exam_variant_id", type="integer", example=1),
     *                 @OA\Property(property="question_id", type="integer", example=1),
     *                 @OA\Property(property="question_text", type="string", example="What is the capital of France?"),
     *                 @OA\Property(property="question_number", type="integer", example=1),
     *                 @OA\Property(property="options", type="array", @OA\Items(type="string"), example={"London", "Paris", "Berlin", "Madrid"}),
     *                 @OA\Property(property="correct_options", type="array", @OA\Items(type="string"), example={"Paris"}),
     *                 @OA\Property(property="mandatory", type="boolean", example=true),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Validation failed"),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Failed to create question"),
     *             @OA\Property(property="error", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'exam_variant_id' => 'required|exists:exam_variant,exam_variant_id',
            'question_id' => 'required|integer',
            'question_text' => 'required|string',
            'question_number' => 'required|integer|min:1',
            'options' => 'required|array|min:1',
            'correct_options' => 'required|array|min:1',
            'mandatory' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $question = ExamVariantQuestion::create([
                'exam_variant_id' => $request->exam_variant_id,
                'question_id' => $request->question_id,
                'question_text' => $request->question_text,
                'question_number' => $request->question_number,
                'options' => $request->options,
                'correct_options' => $request->correct_options,
                'mandatory' => $request->mandatory ?? false
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Question created successfully',
                'data' => $question
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all questions for a specific exam variant
     * 
     * @OA\Get(
     *     path="/exam-variant-questions/variant/{variantId}",
     *     operationId="getQuestionsByVariant",
     *     tags={"Exam Variant Questions"},
     *     summary="Get questions by variant",
     *     description="Retrieve all questions for a specific exam variant ordered by question number",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="variantId",
     *         in="path",
     *         description="Exam variant ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of questions for the variant",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="data", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="exam_variant_question_id", type="integer", example=1),
     *                 @OA\Property(property="exam_variant_id", type="integer", example=1),
     *                 @OA\Property(property="question_id", type="integer", example=1),
     *                 @OA\Property(property="question_text", type="string", example="What is the capital of France?"),
     *                 @OA\Property(property="question_number", type="integer", example=1),
     *                 @OA\Property(property="options", type="array", @OA\Items(type="string"), example={"London", "Paris", "Berlin", "Madrid"}),
     *                 @OA\Property(property="correct_options", type="array", @OA\Items(type="string"), example={"Paris"}),
     *                 @OA\Property(property="mandatory", type="boolean", example=true),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             ))
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Failed to fetch questions"),
     *             @OA\Property(property="error", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function getByVariant($variantId)
    {
        try {
            $questions = ExamVariantQuestion::where('exam_variant_id', $variantId)
                ->orderBy('question_number')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $questions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch questions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing question
     * 
     * @OA\Patch(
     *     path="/exam-variant-questions/{questionId}",
     *     operationId="updateExamVariantQuestion",
     *     tags={"Exam Variant Questions"},
     *     summary="Update exam variant question",
     *     description="Update an existing question with new text, options, or correct answers",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="questionId",
     *         in="path",
     *         description="Exam variant question ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="question_id", type="integer", example=1, description="Original question ID"),
     *             @OA\Property(property="question_text", type="string", example="What is the capital of France?", description="Updated question text"),
     *             @OA\Property(property="question_number", type="integer", example=2, description="Updated question number"),
     *             @OA\Property(property="options", type="array", @OA\Items(type="string"), example={"London", "Paris", "Berlin", "Madrid"}, description="Updated options"),
     *             @OA\Property(property="correct_options", type="array", @OA\Items(type="string"), example={"Paris"}, description="Updated correct answer(s)"),
     *             @OA\Property(property="mandatory", type="boolean", example=true, description="Updated mandatory status")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Question updated successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string", example="Question updated successfully"),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="exam_variant_question_id", type="integer", example=1),
     *                 @OA\Property(property="exam_variant_id", type="integer", example=1),
     *                 @OA\Property(property="question_id", type="integer", example=1),
     *                 @OA\Property(property="question_text", type="string", example="What is the capital of France?"),
     *                 @OA\Property(property="question_number", type="integer", example=2),
     *                 @OA\Property(property="options", type="array", @OA\Items(type="string"), example={"London", "Paris", "Berlin", "Madrid"}),
     *                 @OA\Property(property="correct_options", type="array", @OA\Items(type="string"), example={"Paris"}),
     *                 @OA\Property(property="mandatory", type="boolean", example=true),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Question not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Question not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Validation failed"),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Failed to update question"),
     *             @OA\Property(property="error", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function update(Request $request, $questionId)
    {
        $validator = Validator::make($request->all(), [
            'question_id' => 'required|integer',
            'question_text' => 'sometimes|string',
            'question_number' => 'sometimes|integer|min:1',
            'options' => 'sometimes|array|min:1',
            'correct_options' => 'sometimes|array|min:1',
            'mandatory' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $question = ExamVariantQuestion::find($questionId);

            if (!$question) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Question not found'
                ], 404);
            }

            $question->update($request->only([
                'question_id',
                'question_text',
                'question_number',
                'options',
                'correct_options',
                'mandatory'
            ]));

            return response()->json([
                'status' => 'success',
                'message' => 'Question updated successfully',
                'data' => $question
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an exam variant question
     * 
     * @OA\Delete(
     *     path="/exam-variant-questions/{questionId}",
     *     operationId="deleteExamVariantQuestion",
     *     tags={"Exam Variant Questions"},
     *     summary="Delete exam variant question",
     *     description="Delete a specific question from an exam variant",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="questionId",
     *         in="path",
     *         description="Exam variant question ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Question deleted successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string", example="Question deleted successfully")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Question not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Question not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Failed to delete question"),
     *             @OA\Property(property="error", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function destroy($questionId)
    {
        try {
            $question = ExamVariantQuestion::find($questionId);

            if (!$question) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Question not found'
                ], 404);
            }

            $question->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Question deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete question',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}