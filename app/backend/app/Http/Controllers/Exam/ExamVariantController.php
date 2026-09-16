<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Models\ExamVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Exam Variants",
 *     description="Exam variant management endpoints"
 * )
 */
class ExamVariantController extends Controller
{
    /**
     * Get all exam variants for a specific exam
     * 
     * @OA\Get(
     *     path="/exams/{examId}/variants",
     *     operationId="getExamVariants",
     *     tags={"Exam Variants"},
     *     summary="Get all exam variants",
     *     description="Retrieve all variants for a specific exam ordered by version number",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="examId",
     *         in="path",
     *         description="Exam ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of exam variants",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="exam_variant_id", type="integer", example=1),
     *                 @OA\Property(property="exam_id", type="integer", example=1),
     *                 @OA\Property(property="version_number", type="integer", example=1),
     *                 @OA\Property(property="instructions", type="string", example="Complete all questions"),
     *                 @OA\Property(property="answer_key", type="string", example="A,B,C,D,A"),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             ))
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Exam not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Exam not found")
     *         )
     *     )
     * )
     */
    public function index($examId)
    {
        $variants = ExamVariant::where('exam_id', $examId)
            ->orderBy('version_number')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $variants
        ]);
    }

    /**
     * Create a new exam variant
     * 
     * @OA\Post(
     *     path="/exams/{examId}/variants",
     *     operationId="createExamVariant",
     *     tags={"Exam Variants"},
     *     summary="Create exam variant",
     *     description="Create a new exam variant with version number, instructions, and answer key",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="examId",
     *         in="path",
     *         description="Exam ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="version_number", type="integer", example=1, description="Version number of the variant"),
     *             @OA\Property(property="instructions", type="string", example="Complete all questions", description="Instructions for the exam variant"),
     *             @OA\Property(property="answer_key", type="string", example="A,B,C,D,A", description="Comma-separated answer key")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Exam variant created successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="exam_variant_id", type="integer", example=1),
     *                 @OA\Property(property="exam_id", type="integer", example=1),
     *                 @OA\Property(property="version_number", type="integer", example=1),
     *                 @OA\Property(property="instructions", type="string", example="Complete all questions"),
     *                 @OA\Property(property="answer_key", type="string", example="A,B,C,D,A"),
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
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Failed to create exam variant"),
     *             @OA\Property(property="error", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function store(Request $request, $examId)
    {
        $validator = Validator::make($request->all(), [
            'version_number' => 'required|integer|min:1',
            'instructions' => 'nullable|string',
            'answer_key' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $variant = ExamVariant::create([
                'exam_id' => $examId,
                'version_number' => $request->version_number,
                'instructions' => $request->instructions,
                'answer_key' => $request->answer_key,
                'created_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'data' => $variant
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create exam variant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific exam variant
     * 
     * @OA\Get(
     *     path="/exams/{examId}/variants/{variantId}",
     *     operationId="getExamVariant",
     *     tags={"Exam Variants"},
     *     summary="Get exam variant",
     *     description="Retrieve a specific exam variant by ID",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="examId",
     *         in="path",
     *         description="Exam ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="variantId",
     *         in="path",
     *         description="Exam variant ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Exam variant details",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="exam_variant_id", type="integer", example=1),
     *                 @OA\Property(property="exam_id", type="integer", example=1),
     *                 @OA\Property(property="version_number", type="integer", example=1),
     *                 @OA\Property(property="instructions", type="string", example="Complete all questions"),
     *                 @OA\Property(property="answer_key", type="string", example="A,B,C,D,A"),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Exam variant not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Exam variant not found")
     *         )
     *     )
     * )
     */
    public function show($examId, $variantId)
    {
        $variant = ExamVariant::where('exam_id', $examId)
            ->findOrFail($variantId);

        return response()->json([
            'success' => true,
            'data' => $variant
        ]);
    }

    /**
     * Update an exam variant
     * 
     * @OA\Patch(
     *     path="/exams/{examId}/variants/{variantId}",
     *     operationId="updateExamVariant",
     *     tags={"Exam Variants"},
     *     summary="Update exam variant",
     *     description="Update an existing exam variant with new instructions or answer key",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="examId",
     *         in="path",
     *         description="Exam ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="variantId",
     *         in="path",
     *         description="Exam variant ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="version_number", type="integer", example=2, description="New version number"),
     *             @OA\Property(property="instructions", type="string", example="Updated instructions", description="New instructions"),
     *             @OA\Property(property="answer_key", type="string", example="B,A,C,D,B", description="Updated answer key")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Exam variant updated successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="exam_variant_id", type="integer", example=1),
     *                 @OA\Property(property="exam_id", type="integer", example=1),
     *                 @OA\Property(property="version_number", type="integer", example=2),
     *                 @OA\Property(property="instructions", type="string", example="Updated instructions"),
     *                 @OA\Property(property="answer_key", type="string", example="B,A,C,D,B"),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Exam variant not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Exam variant not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )
     */
    public function update(Request $request, $examId, $variantId)
    {
        $variant = ExamVariant::where('exam_id', $examId)
            ->findOrFail($variantId);

        $validator = Validator::make($request->all(), [
            'version_number' => 'sometimes|required|integer|min:1',
            'instructions' => 'sometimes|nullable|string',
            'answer_key' => 'sometimes|nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $variant->update($request->only(['version_number', 'instructions', 'answer_key']));

            return response()->json([
                'success' => true,
                'data' => $variant
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update exam variant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an exam variant
     * 
     * @OA\Delete(
     *     path="/exams/{examId}/variants/{variantId}",
     *     operationId="deleteExamVariant",
     *     tags={"Exam Variants"},
     *     summary="Delete exam variant",
     *     description="Delete a specific exam variant and all associated data",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="examId",
     *         in="path",
     *         description="Exam ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="variantId",
     *         in="path",
     *         description="Exam variant ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Exam variant deleted successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Exam variant deleted successfully")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Exam variant not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Exam variant not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Failed to delete exam variant"),
     *             @OA\Property(property="error", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function destroy($examId, $variantId)
    {
        $variant = ExamVariant::where('exam_id', $examId)
            ->findOrFail($variantId);

        try {
            $variant->delete();

            return response()->json([
                'success' => true,
                'message' => 'Exam variant deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete exam variant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get exam variant by version number
     * 
     * @OA\Get(
     *     path="/exams/{examId}/variants/version/{versionNumber}",
     *     operationId="getExamVariantByVersion",
     *     tags={"Exam Variants"},
     *     summary="Get exam variant by version",
     *     description="Retrieve a specific exam variant by version number",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="examId",
     *         in="path",
     *         description="Exam ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="versionNumber",
     *         in="path",
     *         description="Version number",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Exam variant details",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="exam_variant_id", type="integer", example=1),
     *                 @OA\Property(property="exam_id", type="integer", example=1),
     *                 @OA\Property(property="version_number", type="integer", example=1),
     *                 @OA\Property(property="instructions", type="string", example="Complete all questions"),
     *                 @OA\Property(property="answer_key", type="string", example="A,B,C,D,A"),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Exam variant not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Exam variant not found")
     *         )
     *     )
     * )
     */
    public function getByVersion($examId, $versionNumber)
    {
        $variant = ExamVariant::where('exam_id', $examId)
            ->where('version_number', $versionNumber)
            ->first();

        if (!$variant) {
            return response()->json([
                'success' => false,
                'message' => 'Exam variant not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $variant
        ]);
    }
}