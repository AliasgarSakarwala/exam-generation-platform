<?php

namespace App\Http\Controllers\Classroom;

use Illuminate\Http\Request;
use App\Models\Classroom;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

/**
 * @OA\Tag(
 *     name="Classrooms",
 *     description="Classroom management endpoints"
 * )
 */
class ClassroomController extends Controller
{
    /**
     * Get all classrooms for the authenticated user
     * 
     * @OA\Get(
     *     path="/classrooms",
     *     operationId="getClassrooms",
     *     tags={"Classrooms"},
     *     summary="Get all classrooms",
     *     description="Retrieve all classrooms for the authenticated user with optional filtering",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="search",
     *         in="query",
     *         description="Search classrooms by name",
     *         required=false,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="status",
     *         in="query",
     *         description="Filter by archive status (archived or active)",
     *         required=false,
     *         @OA\Schema(type="string", enum={"archived", "active"})
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of classrooms",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="classroom_id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="Introduction to Computer Science"),
     *                 @OA\Property(property="code", type="string", example="CS101"),
     *                 @OA\Property(property="section", type="string", example="A"),
     *                 @OA\Property(property="description", type="string", example="Basic computer science concepts"),
     *                 @OA\Property(property="user_id", type="integer", example=1),
     *                 @OA\Property(property="is_archived", type="boolean", example=false),
     *                 @OA\Property(property="start_date", type="string", format="date", example="2024-01-15"),
     *                 @OA\Property(property="end_date", type="string", format="date", example="2024-05-15"),
     *                 @OA\Property(property="term", type="string", example="Spring 2024"),
     *                 @OA\Property(property="student_count", type="integer", example=25),
     *                 @OA\Property(property="class_colour", type="string", example="#3B82F6")
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
     *             @OA\Property(property="error", type="string", example="Something went wrong")
     *         )
     *     )
     * )
     */
    public function index(Request $request)
    {
        try {
            $query = Classroom::query();

                // If user is NOT an admin, filter by their user_id
        if (auth()->user()->role !== 'Admin') {
            $query->where('user_id', auth()->user()->user_id);
        }

            // Search filter
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where('name', 'like', "%{$search}%");
            }

            // Archive status filter
            if ($request->has('status')) {
                $status = $request->input('status');
                $query->where('is_archived', $status === 'archived');
            }

            $classrooms = $query->get();

            return response()->json($classrooms);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Something went wrong'], 500);
        }
    }

    /**
     * Create a new classroom
     * 
     * @OA\Post(
     *     path="/classrooms",
     *     operationId="createClassroom",
     *     tags={"Classrooms"},
     *     summary="Create a new classroom",
     *     description="Create a new classroom with the provided details",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","code","section","start_date","end_date","term","class_colour"},
     *             @OA\Property(property="name", type="string", maxLength=100, example="Introduction to Computer Science"),
     *             @OA\Property(property="code", type="string", maxLength=20, example="CS101"),
     *             @OA\Property(property="section", type="string", example="A"),
     *             @OA\Property(property="description", type="string", example="Basic computer science concepts"),
     *             @OA\Property(property="start_date", type="string", format="date", example="2024-01-15"),
     *             @OA\Property(property="end_date", type="string", format="date", example="2024-05-15"),
     *             @OA\Property(property="term", type="string", maxLength=50, example="Spring 2024"),
     *             @OA\Property(property="class_colour", type="string", pattern="^#[A-Fa-f0-9]{6}$", example="#3B82F6")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Classroom created successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="classroom_id", type="integer", example=1),
     *             @OA\Property(property="name", type="string", example="Introduction to Computer Science"),
     *             @OA\Property(property="code", type="string", example="CS101"),
     *             @OA\Property(property="section", type="string", example="A"),
     *             @OA\Property(property="description", type="string", example="Basic computer science concepts"),
     *             @OA\Property(property="user_id", type="integer", example=1),
     *             @OA\Property(property="is_archived", type="boolean", example=false),
     *             @OA\Property(property="start_date", type="string", format="date", example="2024-01-15"),
     *             @OA\Property(property="end_date", type="string", format="date", example="2024-05-15"),
     *             @OA\Property(property="term", type="string", example="Spring 2024"),
     *             @OA\Property(property="student_count", type="integer", example=0),
     *             @OA\Property(property="class_colour", type="string", example="#3B82F6")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Classroom with this combination already exists")
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
     *             @OA\Property(property="error", type="string", example="Failed to create classroom")
     *         )
     *     )
     * )
     */
    public function store(Request $request)
    {
        try {
            // Validate the request data
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'code' => 'required|string|max:20',
                'section' => 'required|string',
                'description' => 'nullable|string',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'term' => 'required|string|max:50',
                'class_colour' => ['required', 'regex:/^#[A-Fa-f0-9]{6}$/'],
            ]);

            // Check for unique combination of code, section, start_date, end_date, and user_id
            $user = auth()->user();
            $exists = Classroom::where('code', $validated['code'])
                ->where('section', $validated['section'])
                ->where('start_date', $validated['start_date'])
                ->where('end_date', $validated['end_date'])
                ->where('user_id', $user->user_id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'error' => 'Classroom with this combination already exists'
                ], 422);
            }

            // Note: Professor table is dropped, no need to create professor records

            // Create the classroom with the validated data
            $classroom = Classroom::create([
                'name' => $validated['name'],
                'code' => $validated['code'],
                'section' => $validated['section'],
                'description' => $validated['description'] ?? null,
                'user_id' => $user->user_id,
                'is_archived' => false,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'term' => $validated['term'],
                'student_count' => 0, // Default to 0, can be updated later
                'class_colour' => $validated['class_colour'],
            ]);

            return response()->json($classroom, 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create classroom',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle classroom archive status
     * 
     * @OA\Patch(
     *     path="/classrooms/{id}/status",
     *     operationId="toggleClassroomStatus",
     *     tags={"Classrooms"},
     *     summary="Toggle classroom archive status",
     *     description="Toggle the archived status of a classroom",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Status toggled successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="classroom_id", type="integer", example=1),
     *             @OA\Property(property="name", type="string", example="Introduction to Computer Science"),
     *             @OA\Property(property="is_archived", type="boolean", example=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Not authorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Not authorized to modify this classroom")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Classroom not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Classroom not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to update classroom status")
     *         )
     *     )
     * )
     */
    public function toggleStatus($id)
    {
        try {
            // Find the classroom
            $classroom = Classroom::findOrFail($id);

            // Check if user is the owner of this classroom
            $user = auth()->user();
            if ($user->role !== 'Admin' && $classroom->user_id !== $user->user_id) {
                return response()->json(['error' => 'Not authorized to modify this classroom'], 403);
            }

            // Toggle the archived status
            $classroom->is_archived = !$classroom->is_archived;
            $classroom->save();

            // Return the updated classroom
            return response()->json($classroom);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Classroom not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update classroom status'], 500);
        }
    }

    /**
     * Get classroom name
     * 
     * @OA\Get(
     *     path="/classrooms/{id}/name",
     *     operationId="getClassroomName",
     *     tags={"Classrooms"},
     *     summary="Get classroom name",
     *     description="Retrieve the name of a specific classroom",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Classroom name retrieved",
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", example="Introduction to Computer Science")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Classroom not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Classroom not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to fetch classroom name")
     *         )
     *     )
     * )
     */
    public function getName($id)
    {
        try {
            // Find the classroom and select only the name
            $classroom = Classroom::where('classroom_id', $id)
                ->select('name')
                ->firstOrFail();

            return response()->json(['name' => $classroom->name], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Classroom not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch classroom name'], 500);
        }
    }

    /**
     * Get a specific classroom
     * 
     * @OA\Get(
     *     path="/classrooms/{id}",
     *     operationId="getClassroom",
     *     tags={"Classrooms"},
     *     summary="Get classroom details",
     *     description="Retrieve detailed information about a specific classroom",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Classroom details",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="classroom_id", type="integer", example=1),
     *             @OA\Property(property="name", type="string", example="Introduction to Computer Science"),
     *             @OA\Property(property="code", type="string", example="CS101"),
     *             @OA\Property(property="section", type="string", example="A"),
     *             @OA\Property(property="description", type="string", example="Basic computer science concepts"),
     *             @OA\Property(property="user_id", type="integer", example=1),
     *             @OA\Property(property="is_archived", type="boolean", example=false),
     *             @OA\Property(property="start_date", type="string", format="date", example="2024-01-15"),
     *             @OA\Property(property="end_date", type="string", format="date", example="2024-05-15"),
     *             @OA\Property(property="term", type="string", example="Spring 2024"),
     *             @OA\Property(property="student_count", type="integer", example=25),
     *             @OA\Property(property="class_colour", type="string", example="#3B82F6")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Not authorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Not authorized to view this classroom")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Classroom not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Classroom not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to fetch classroom")
     *         )
     *     )
     * )
     */
    public function show($id)
    {
        try {
            // Fetch the classroom or fail
            $classroom = Classroom::findOrFail($id);

            // Authorize: only the owning user may view it
            $user = auth()->user();
            if ($user->role !== 'Admin' && $classroom->user_id !== $user->user_id) {
                return response()->json([
                    'error' => 'Not authorized to view this classroom'
                ], 403);
            }

            return response()->json($classroom, 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Classroom not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch classroom',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a classroom
     * 
     * @OA\Delete(
     *     path="/classrooms/{id}",
     *     operationId="deleteClassroom",
     *     tags={"Classrooms"},
     *     summary="Delete a classroom",
     *     description="Permanently delete a classroom",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Classroom deleted successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Classroom deleted successfully")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Not authorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Not authorized to delete this classroom")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Classroom not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Classroom not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to delete classroom")
     *         )
     *     )
     * )
     */
    public function destroy($id)
    {
        try {
            // Find the classroom
            $classroom = Classroom::findOrFail($id);

            // Check if user is the owner of this classroom
            $user = auth()->user();
            if ($user->role !== 'Admin' && $classroom->user_id !== $user->user_id) {
                return response()->json(['error' => 'Not authorized to delete this classroom'], 403);
            }

            // Delete the classroom
            $classroom->delete();

            // Return success message
            return response()->json([
                'message' => 'Classroom deleted successfully'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Classroom not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete classroom'], 500);
        }
    }

    /**
     * Update a classroom
     * 
     * @OA\Patch(
     *     path="/classrooms/{id}",
     *     operationId="updateClassroom",
     *     tags={"Classrooms"},
     *     summary="Update a classroom",
     *     description="Update classroom details",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", maxLength=100, example="Advanced Computer Science"),
     *             @OA\Property(property="code", type="string", maxLength=20, example="CS201"),
     *             @OA\Property(property="section", type="string", example="B"),
     *             @OA\Property(property="description", type="string", example="Advanced computer science concepts"),
     *             @OA\Property(property="start_date", type="string", format="date", example="2024-01-15"),
     *             @OA\Property(property="end_date", type="string", format="date", example="2024-05-15"),
     *             @OA\Property(property="term", type="string", maxLength=50, example="Spring 2024"),
     *             @OA\Property(property="class_colour", type="string", pattern="^#[A-Fa-f0-9]{6}$", example="#10B981")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Classroom updated successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="classroom_id", type="integer", example=1),
     *             @OA\Property(property="name", type="string", example="Advanced Computer Science"),
     *             @OA\Property(property="code", type="string", example="CS201"),
     *             @OA\Property(property="section", type="string", example="B"),
     *             @OA\Property(property="description", type="string", example="Advanced computer science concepts"),
     *             @OA\Property(property="user_id", type="integer", example=1),
     *             @OA\Property(property="is_archived", type="boolean", example=false),
     *             @OA\Property(property="start_date", type="string", format="date", example="2024-01-15"),
     *             @OA\Property(property="end_date", type="string", format="date", example="2024-05-15"),
     *             @OA\Property(property="term", type="string", example="Spring 2024"),
     *             @OA\Property(property="student_count", type="integer", example=25),
     *             @OA\Property(property="class_colour", type="string", example="#10B981")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Not authorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Not authorized to modify this classroom")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Classroom not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Classroom not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Classroom with this combination already exists")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to update classroom")
     *         )
     *     )
     * )
     */
    public function update(Request $request, $id)
    {
        try {
            // Find the classroom
            $classroom = Classroom::findOrFail($id);

            // Check if user is the professor of this classroom
            $user = auth()->user();
            if ($user->role !== 'Admin' && $classroom->user_id !== $user->user_id) {
                return response()->json(['error' => 'Not authorized to modify this classroom'], 403);
            }

            // Validate the request data
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:100',
                'code' => 'sometimes|required|string|max:20|unique:classroom,code,' . $id . ',classroom_id',
                'section' => 'sometimes|required|string',
                'description' => 'nullable|string',
                'start_date' => 'sometimes|required|date',
                'end_date' => 'sometimes|required|date|after_or_equal:start_date',
                'term' => 'sometimes|required|string|max:50',
                'class_colour' => ['sometimes', 'required', 'regex:/^#[A-Fa-f0-9]{6}$/'],
                'student_count' => 'sometimes|required|integer|min:0',
            ]);

            // Check for unique combination when updating code, section, or dates
            if (isset($validated['code']) || isset($validated['section']) || 
                isset($validated['start_date']) || isset($validated['end_date'])) {
                
                $exists = Classroom::where('code', $validated['code'] ?? $classroom->code)
                    ->where('section', $validated['section'] ?? $classroom->section)
                    ->where('start_date', $validated['start_date'] ?? $classroom->start_date)
                    ->where('end_date', $validated['end_date'] ?? $classroom->end_date)
                    ->where('user_id', $user->user_id)
                    ->where('classroom_id', '!=', $id)
                    ->exists();

                if ($exists) {
                    return response()->json([
                        'error' => 'Classroom with this combination already exists'
                    ], 422);
                }
            }

            // Update the classroom with the validated data
            $classroom->update($validated);

            return response()->json($classroom);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Classroom not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update classroom'], 500);
    }}

    /**
     * Get students in a classroom
     * 
     * @OA\Get(
     *     path="/classrooms/{id}/students",
     *     operationId="getClassroomStudents",
     *     tags={"Classrooms"},
     *     summary="Get classroom students",
     *     description="Retrieve paginated list of students enrolled in a classroom",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Students list with pagination",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="data", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="student_id", type="integer", example=1),
     *                 @OA\Property(property="first_name", type="string", example="John"),
     *                 @OA\Property(property="last_name", type="string", example="Doe"),
     *                 @OA\Property(property="enrollment_status", type="string", example="enrolled")
     *             )),
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="per_page", type="integer", example=20),
     *             @OA\Property(property="total", type="integer", example=25),
     *             @OA\Property(property="last_page", type="integer", example=2),
     *             @OA\Property(property="exams", type="array", @OA\Items(type="string"), example={"Midterm Exam", "Final Exam"})
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Classroom not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="message", type="string", example="Classroom not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="message", type="string", example="Failed to fetch students")
     *         )
     *     )
     * )
     */
    public function getStudents($id){
    try {
        // Verify classroom exists
        $classroom = DB::table('classroom')->where('CLASSROOM_ID', $id)->first();
        
        if (!$classroom) {
            return response()->json([
                'data' => [],
                'message' => 'Classroom not found'
            ], 404);
        }

        // Get paginated students
        $students = DB::table('classroom_student')
            ->join('student', 'classroom_student.student_id', '=', 'student.student_id')
            ->where('classroom_student.classroom_id', $id)
            ->select([
                'student.student_id',
                'student.first_name',
                'student.last_name',
                'classroom_student.enrollment_status'
            ])
            ->paginate(20); // 20 items per page

        // Get all published exams for this classroom
        $exams = DB::table('exams')
            ->where('classroom_id', $id)
            ->where('is_published', true)
            ->orderBy('created_at', 'asc')
            ->get(['exam_id', 'title']);

        // Add empty exam_results to each student
        $students->getCollection()->transform(function ($student) use ($exams) {
            $student->exam_results = [];
            return $student;
        });

        return response()->json([
            'data' => $students->items(),
            'current_page' => $students->currentPage(),
            'per_page' => $students->perPage(),
            'total' => $students->total(),
            'last_page' => $students->lastPage(),
            'exams' => $exams->pluck('title')->toArray()
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'data' => [],
            'message' => 'Failed to fetch students: ' . $e->getMessage()
        ], 500);
    }
    }

    /**
     * Get classroom statistics
     * 
     * @OA\Get(
     *     path="/classrooms/stats",
     *     operationId="getClassroomStats",
     *     tags={"Classrooms"},
     *     summary="Get classroom statistics",
     *     description="Retrieve statistics about classrooms for the authenticated user",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Classroom statistics",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="courses_created", type="integer", example=5),
     *             @OA\Property(property="total_students", type="integer", example=125)
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Unauthorized")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Forbidden")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to fetch stats")
     *         )
     *     )
     * )
     */
    public function stats(){
        try {
            $user = auth()->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            // Only professors and admins can access
            if (!in_array($user->role, ['Professor', 'Admin'])) {
                return response()->json(['error' => 'Forbidden'], 403);
            }
            $query = \App\Models\Classroom::query();
            if ($user->role !== 'Admin') {
                $query->where('user_id', $user->user_id);
            }
            $courses_created = $query->count();
            $total_students = $query->sum('student_count');
            return response()->json([
                'courses_created' => $courses_created,
                'total_students' => $total_students
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch stats'], 500);
        }
    }
}