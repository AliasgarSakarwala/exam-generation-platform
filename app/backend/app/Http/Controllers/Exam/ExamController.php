<?php

namespace App\Http\Controllers\Exam;

use App\Models\Exam;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;

/**
 * @OA\Tag(
 *     name="Exams",
 *     description="Exam management endpoints"
 * )
 */
class ExamController extends Controller
{
    /**
     * Get all exams
     * 
     * @OA\Get(
     *     path="/exams",
     *     operationId="getExams",
     *     tags={"Exams"},
     *     summary="Get all exams",
     *     description="Retrieve all exams in the system",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="List of all exams",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="exam_id", type="integer", example=1),
     *                 @OA\Property(property="classroom_id", type="integer", example=1),
     *                 @OA\Property(property="title", type="string", example="Midterm Exam"),
     *                 @OA\Property(property="description", type="string", example="Comprehensive midterm examination"),
     *                 @OA\Property(property="total_points", type="integer", example=100),
     *                 @OA\Property(property="question_count", type="integer", example=25),
     *                 @OA\Property(property="variant_count", type="integer", example=3),
     *                 @OA\Property(property="available_from", type="string", format="date-time"),
     *                 @OA\Property(property="available_to", type="string", format="date-time"),
     *                 @OA\Property(property="is_published", type="boolean", example=true),
     *                 @OA\Property(property="is_graded", type="boolean", example=false),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthorized"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to fetch exams")
     *         )
     *     )
     * )
     */
    public function index()
    {
        $exams = Exam::all();
        return response()->json($exams);
    }

    /**
     * Get a specific exam
     * 
     * @OA\Get(
     *     path="/exams/{exam_id}",
     *     operationId="getExam",
     *     tags={"Exams"},
     *     summary="Get exam details",
     *     description="Retrieve detailed information about a specific exam",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="exam_id",
     *         in="path",
     *         description="Exam ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Exam details or not found",
     *         @OA\JsonContent(
     *             oneOf={
     *                 @OA\Schema(
     *                     @OA\Property(property="data", type="object",
     *                         @OA\Property(property="exam_id", type="integer", example=1),
     *                         @OA\Property(property="classroom_id", type="integer", example=1),
     *                         @OA\Property(property="title", type="string", example="Midterm Exam"),
     *                         @OA\Property(property="description", type="string", example="Comprehensive midterm examination"),
     *                         @OA\Property(property="total_points", type="integer", example=100),
     *                         @OA\Property(property="question_count", type="integer", example=25),
     *                         @OA\Property(property="variant_count", type="integer", example=3),
     *                         @OA\Property(property="available_from", type="string", format="date-time"),
     *                         @OA\Property(property="available_to", type="string", format="date-time"),
     *                         @OA\Property(property="is_published", type="boolean", example=true),
     *                         @OA\Property(property="is_graded", type="boolean", example=false),
     *                         @OA\Property(property="created_at", type="string", format="date-time"),
     *                         @OA\Property(property="updated_at", type="string", format="date-time")
     *                     ),
     *                     @OA\Property(property="message", type="string", example="Exam found")
     *                 ),
     *                 @OA\Schema(
     *                     @OA\Property(property="data", type="array", @OA\Items(type="object")),
     *                     @OA\Property(property="message", type="string", example="Exam not found")
     *                 )
     *             }
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthorized"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to fetch exam")
     *         )
     *     )
     * )
     */
    public function show($exam_id)
    {
        $exam = Exam::find($exam_id);
        
        if (!$exam) {
            return response()->json(['data' => [], 'message' => 'Exam not found'], 200);
        }
        
        return response()->json(['data' => $exam, 'message' => 'Exam found'], 200);
    }



    /**
     * Create a new exam
     * 
     * @OA\Post(
     *     path="/exams",
     *     operationId="createExam",
     *     tags={"Exams"},
     *     summary="Create a new exam",
     *     description="Create a new exam with validation",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"classroom_id", "title", "total_points", "question_count"},
     *             @OA\Property(property="classroom_id", type="integer", example=1),
     *             @OA\Property(property="title", type="string", maxLength=200, example="Midterm Exam"),
     *             @OA\Property(property="description", type="string", example="Comprehensive midterm examination"),
     *             @OA\Property(property="total_points", type="integer", minimum=1, example=100),
     *             @OA\Property(property="question_count", type="integer", minimum=1, example=25),
     *             @OA\Property(property="variant_count", type="integer", minimum=1, example=3),
     *             @OA\Property(property="available_from", type="string", format="date-time", example="2024-03-15T10:00:00Z"),
     *             @OA\Property(property="available_to", type="string", format="date-time", example="2024-03-15T12:00:00Z"),
     *             @OA\Property(property="is_published", type="boolean", example=false),
     *             @OA\Property(property="is_graded", type="boolean", example=false)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Exam created successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Exam created successfully"),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="exam_id", type="integer", example=1),
     *                 @OA\Property(property="classroom_id", type="integer", example=1),
     *                 @OA\Property(property="title", type="string", example="Midterm Exam"),
     *                 @OA\Property(property="description", type="string", example="Comprehensive midterm examination"),
     *                 @OA\Property(property="total_points", type="integer", example=100),
     *                 @OA\Property(property="question_count", type="integer", example=25),
     *                 @OA\Property(property="variant_count", type="integer", example=3),
     *                 @OA\Property(property="available_from", type="string", format="date-time"),
     *                 @OA\Property(property="available_to", type="string", format="date-time"),
     *                 @OA\Property(property="is_published", type="boolean", example=false),
     *                 @OA\Property(property="is_graded", type="boolean", example=false),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="classroom_id", type="array", @OA\Items(type="string")),
     *             @OA\Property(property="title", type="array", @OA\Items(type="string")),
     *             @OA\Property(property="total_points", type="array", @OA\Items(type="string")),
     *             @OA\Property(property="question_count", type="array", @OA\Items(type="string")),
     *             @OA\Property(property="available_to", type="array", @OA\Items(type="string"))
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthorized"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to create exam")
     *         )
     *     )
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'classroom_id' => 'required|integer|exists:classroom,classroom_id',
            'title' => 'required|string|max:200',
            'description' => 'nullable|string',
            'total_points' => 'required|integer|min:1',
            'question_count' => 'required|integer|min:1',
            'variant_count' => 'integer|min:1',
            'available_from' => 'nullable|date',
            'available_to' => 'nullable|date|after_or_equal:available_from',
            'is_published' => 'boolean',
            'is_graded' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $exam = Exam::create($validator->validated());

        return response()->json([
            'message' => 'Exam created successfully',
            'data' => $exam
        ], 201);
    }

    /**
     * Update an exam
     * 
     * @OA\Patch(
     *     path="/exams/{exam_id}",
     *     operationId="updateExam",
     *     tags={"Exams"},
     *     summary="Update an exam",
     *     description="Update exam details with validation",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="exam_id",
     *         in="path",
     *         description="Exam ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="classroom_id", type="integer", example=1),
     *             @OA\Property(property="title", type="string", maxLength=200, example="Updated Midterm Exam"),
     *             @OA\Property(property="description", type="string", example="Updated comprehensive midterm examination"),
     *             @OA\Property(property="total_points", type="integer", minimum=1, example=150),
     *             @OA\Property(property="question_count", type="integer", minimum=1, example=30),
     *             @OA\Property(property="variant_count", type="integer", minimum=1, example=5),
     *             @OA\Property(property="available_from", type="string", format="date-time", example="2024-03-15T10:00:00Z"),
     *             @OA\Property(property="available_to", type="string", format="date-time", example="2024-03-15T12:00:00Z"),
     *             @OA\Property(property="is_published", type="boolean", example=true),
     *             @OA\Property(property="is_graded", type="boolean", example=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Exam updated successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Exam updated successfully"),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="exam_id", type="integer", example=1),
     *                 @OA\Property(property="classroom_id", type="integer", example=1),
     *                 @OA\Property(property="title", type="string", example="Updated Midterm Exam"),
     *                 @OA\Property(property="description", type="string", example="Updated comprehensive midterm examination"),
     *                 @OA\Property(property="total_points", type="integer", example=150),
     *                 @OA\Property(property="question_count", type="integer", example=30),
     *                 @OA\Property(property="variant_count", type="integer", example=5),
     *                 @OA\Property(property="available_from", type="string", format="date-time"),
     *                 @OA\Property(property="available_to", type="string", format="date-time"),
     *                 @OA\Property(property="is_published", type="boolean", example=true),
     *                 @OA\Property(property="is_graded", type="boolean", example=true),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Exam not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Exam not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="title", type="array", @OA\Items(type="string")),
     *             @OA\Property(property="total_points", type="array", @OA\Items(type="string")),
     *             @OA\Property(property="available_to", type="array", @OA\Items(type="string"))
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthorized"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to update exam")
     *         )
     *     )
     * )
     */
    public function update(Request $request, $exam_id)
    {
        $exam = Exam::find($exam_id);
        
        if (!$exam) {
            return response()->json(['message' => 'Exam not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'classroom_id' => 'integer|exists:classroom,classroom_id',
            'title' => 'string|max:200',
            'description' => 'nullable|string',
            'total_points' => 'integer|min:1',
            'question_count' => 'integer|min:1',
            'variant_count' => 'integer|min:1',
            'available_from' => 'nullable|date',
            'available_to' => 'nullable|date|after_or_equal:available_from',
            'is_published' => 'boolean',
            'is_graded' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $exam->update($validator->validated());
        $exam->updated_at = now();
        $exam->save();

        return response()->json([
            'message' => 'Exam updated successfully',
            'data' => $exam
        ]);
    }

    /**
     * Delete an exam
     * 
     * @OA\Delete(
     *     path="/exams/{exam_id}",
     *     operationId="deleteExam",
     *     tags={"Exams"},
     *     summary="Delete an exam",
     *     description="Permanently delete an exam",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="exam_id",
     *         in="path",
     *         description="Exam ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Exam deleted successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Exam deleted successfully")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Exam not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Exam not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthorized"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to delete exam")
     *         )
     *     )
     * )
     */
    public function destroy($exam_id)
    {
        $exam = Exam::find($exam_id);
        
        if (!$exam) {
            return response()->json(['message' => 'Exam not found'], 404);
        }

        $exam->delete();

        return response()->json(['message' => 'Exam deleted successfully']);
    }



    /**
     * Get exams by classroom
     * 
     * @OA\Get(
     *     path="/exams/classroom/{classroom_id}",
     *     operationId="getExamsByClassroom",
     *     tags={"Exams"},
     *     summary="Get exams for classroom",
     *     description="Retrieve all exams for a specific classroom",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroom_id",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Exams for classroom or empty list",
     *         @OA\JsonContent(
     *             oneOf={
     *                 @OA\Schema(
     *                     @OA\Property(property="data", type="array", @OA\Items(
     *                         type="object",
     *                         @OA\Property(property="exam_id", type="integer", example=1),
     *                         @OA\Property(property="classroom_id", type="integer", example=1),
     *                         @OA\Property(property="title", type="string", example="Midterm Exam"),
     *                         @OA\Property(property="description", type="string", example="Comprehensive midterm examination"),
     *                         @OA\Property(property="total_points", type="integer", example=100),
     *                         @OA\Property(property="question_count", type="integer", example=25),
     *                         @OA\Property(property="variant_count", type="integer", example=3),
     *                         @OA\Property(property="available_from", type="string", format="date-time"),
     *                         @OA\Property(property="available_to", type="string", format="date-time"),
     *                         @OA\Property(property="is_published", type="boolean", example=true),
     *                         @OA\Property(property="is_graded", type="boolean", example=false),
     *                         @OA\Property(property="created_at", type="string", format="date-time"),
     *                         @OA\Property(property="updated_at", type="string", format="date-time")
     *                     )),
     *                     @OA\Property(property="message", type="string", example="Exams found for this classroom"),
     *                     @OA\Property(property="classroom_id", type="integer", example=1)
     *                 ),
     *                 @OA\Schema(
     *                     @OA\Property(property="data", type="array", @OA\Items(type="object")),
     *                     @OA\Property(property="message", type="string", example="No exams found for this classroom"),
     *                     @OA\Property(property="classroom_id", type="integer", example=1)
     *                 )
     *             }
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthorized"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to fetch exams")
     *         )
     *     )
     * )
     */
    public function getByClassroom($classroom_id)
    {
        $exams = Exam::where('classroom_id', $classroom_id)->get();
        
        if ($exams->isEmpty()) {
            return response()->json([
                'data' => [],
                'message' => 'No exams found for this classroom',
                'classroom_id' => $classroom_id
            ], 200);
        }
        
        return response()->json([
            'data' => $exams,
            'message' => 'Exams found for this classroom',
            'classroom_id' => $classroom_id
        ], 200);
    }


}