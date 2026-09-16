<?php

namespace App\Http\Controllers\Student;

use Illuminate\Support\Arr;
use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\ClassroomStudent;
use App\Models\Classroom;
use App\Models\Exam;
use App\Models\ExamResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * @OA\Tag(
 *     name="Students",
 *     description="Student management endpoints for classroom enrollment"
 * )
 */
class StudentController extends Controller
{
    /**
     * Get all students for a specific classroom
     * 
     * @OA\Get(
     *     path="/classrooms/{classroomId}/students",
     *     operationId="getStudents",
     *     tags={"Students"},
     *     summary="Get students in classroom",
     *     description="Retrieve all students enrolled in a specific classroom with optional filtering and pagination",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="search",
     *         in="query",
     *         description="Search students by name or ID",
     *         required=false,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="status",
     *         in="query",
     *         description="Filter by enrollment status",
     *         required=false,
     *         @OA\Schema(type="string", enum={"Active", "Dropped", "Completed"})
     *     ),
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         description="Number of students per page",
     *         required=false,
     *         @OA\Schema(type="integer", default=20)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of students with pagination and exam results",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="student_id", type="integer", example=12345),
     *                 @OA\Property(property="first_name", type="string", example="John"),
     *                 @OA\Property(property="last_name", type="string", example="Doe"),
     *                 @OA\Property(property="preferred_name", type="string", example="Johnny"),
     *                 @OA\Property(property="enrollment_status", type="string", example="Active"),
     *                 @OA\Property(property="exam_results", type="object",
     *                     @OA\Property(property="Midterm Exam", type="number", format="float", example=85.5),
     *                     @OA\Property(property="Final Exam", type="number", format="float", example=92.0)
     *                 )
     *             )),
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="per_page", type="integer", example=20),
     *             @OA\Property(property="total", type="integer", example=45),
     *             @OA\Property(property="last_page", type="integer", example=3),
     *             @OA\Property(property="exams", type="array", @OA\Items(type="string", example="Midterm Exam"))
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Not authorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Not authorized to access this classroom")
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
     *             @OA\Property(property="error", type="string", example="Failed to fetch students")
     *         )
     *     )
     * )
     */
    public function index(Request $request, $classroomId)
    {
        try {
            // Verify classroom exists and user has access
            $classroom = Classroom::findOrFail($classroomId);
            
            // Check if current user is the owner of this classroom
            $user = auth()->user();
            if ($user->role !== 'Admin' && $classroom->user_id !== $user->user_id) {
                return response()->json(['error' => 'Not authorized to access this classroom'], 403);
            }

            $query = ClassroomStudent::where('classroom_id', $classroomId)
                ->join('student', 'classroom_student.student_id', '=', 'student.student_id')
                ->select([
                    'student.student_id',
                    'student.first_name',
                    'student.last_name',
                    'student.preferred_name',
                    'classroom_student.enrollment_status'
                ]);

            // Search filter
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('student.first_name', 'like', "%{$search}%")
                      ->orWhere('student.last_name', 'like', "%{$search}%")
                      ->orWhere('student.preferred_name', 'like', "%{$search}%")
                      ->orWhere('student.student_id', 'like', "%{$search}%");
                });
            }

            // Status filter
            if ($request->has('status')) {
                $status = $request->input('status');
                if (in_array($status, ['Active', 'Dropped', 'Completed'])) {
                    $query->where('classroom_student.enrollment_status', $status);
                }
            }

            // Pagination
            $perPage = $request->input('per_page', 20);
            $students = $query->paginate($perPage);

            // Get all exams for this classroom
            $exams = Exam::where('classroom_id', $classroomId)
                ->where('is_published', true)
                ->orderBy('created_at', 'asc')
                ->get(['exam_id', 'title']);

            // Add exam results to each student
            $students->getCollection()->transform(function ($student) use ($exams) {
                $examResults = [];
                
                foreach ($exams as $exam) {
                    $result = ExamResult::where('exam_id', $exam->exam_id)
                        ->where('student_id', $student->student_id)
                        ->first();
                    
                    $examResults[$exam->title] = $result ? $result->percentage_score : null;
                }
                
                $student->exam_results = $examResults;
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
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Classroom not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch students'], 500);
        }
    }

    /**
     * Add students to a classroom (handles both single and multiple students)
     * 
     * @OA\Post(
     *     path="/classrooms/{classroomId}/students",
     *     operationId="addStudents",
     *     tags={"Students"},
     *     summary="Add students to classroom",
     *     description="Enroll single or multiple students in a classroom",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             oneOf={
     *                 @OA\Schema(
     *                     description="Single student enrollment",
     *                     required={"student_id", "first_name", "last_name"},
     *                     @OA\Property(property="student_id", type="integer", example=12345),
     *                     @OA\Property(property="first_name", type="string", example="John"),
     *                     @OA\Property(property="last_name", type="string", example="Doe"),
     *                     @OA\Property(property="preferred_name", type="string", example="Johnny"),
     *                     @OA\Property(property="is_active", type="boolean", example=true)
     *                 ),
     *                 @OA\Schema(
     *                     description="Multiple students enrollment",
     *                     required={"students"},
     *                     @OA\Property(property="students", type="array", @OA\Items(
     *                         type="object",
     *                         @OA\Property(property="student_id", type="integer", example=12345),
     *                         @OA\Property(property="first_name", type="string", example="John"),
     *                         @OA\Property(property="last_name", type="string", example="Doe"),
     *                         @OA\Property(property="preferred_name", type="string", example="Johnny"),
     *                         @OA\Property(property="is_active", type="boolean", example=true)
     *                     ))
     *                 )
     *             }
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Students enrolled successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="2 student(s) enrolled successfully"),
     *             @OA\Property(property="count", type="integer", example=2),
     *             @OA\Property(property="students", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="student_id", type="integer", example=12345),
     *                 @OA\Property(property="first_name", type="string", example="John"),
     *                 @OA\Property(property="last_name", type="string", example="Doe"),
     *                 @OA\Property(property="preferred_name", type="string", example="Johnny"),
     *                 @OA\Property(property="is_active", type="boolean", example=true)
     *             )),
     *             @OA\Property(property="errors", type="array", @OA\Items(type="string", example="Student ID 12346 is already enrolled"))
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
     *             @OA\Property(property="error", type="string", example="Validation failed"),
     *             @OA\Property(property="messages", type="object",
     *                 @OA\Property(property="student_id", type="array", @OA\Items(type="string", example="The student id field is required.")),
     *                 @OA\Property(property="first_name", type="array", @OA\Items(type="string", example="The first name field is required."))
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to enroll students"),
     *             @OA\Property(property="message", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function store(Request $request, $classroomId)
    {
        try {
            // Verify classroom exists and user has access
            $classroom = Classroom::findOrFail($classroomId);
            
            $user = auth()->user();
            if ($user->role !== 'Admin' && $classroom->user_id !== $user->user_id) {
                return response()->json(['error' => 'Not authorized to modify this classroom'], 403);
            }

            // Determine if this is a single student or multiple students
            if (isset($request->students) && is_array($request->students)) {
                // Multiple students (from CSV or bulk entry)
                $validated = $request->validate([
                    'students' => 'required|array|min:1',
                    'students.*.student_id' => 'required|integer',
                    'students.*.first_name' => 'required|string|max:50',
                    'students.*.last_name' => 'required|string|max:50',
                    'students.*.preferred_name' => 'nullable|string|max:50',
                    'students.*.is_active' => 'boolean',
                ]);
                $studentsData = $validated['students'];
            } else {
                // Single student
                $validated = $request->validate([
                    'student_id' => 'required|integer',
                    'first_name' => 'required|string|max:50',
                    'last_name' => 'required|string|max:50',
                    'preferred_name' => 'nullable|string|max:50',
                    'is_active' => 'boolean',
                ]);
                $studentsData = [$validated];
            }

            DB::beginTransaction();

            $enrolledStudents = [];
            $errors = [];

            foreach ($studentsData as $studentData) {
                try {
                    // Check if student already exists in the system
                    $student = Student::find($studentData['student_id']);
                    if (!$student) {
                        // Create new student record - only use fillable fields
                        $student = Student::create([
                            'student_id' => $studentData['student_id'],
                            'first_name' => $studentData['first_name'],
                            'last_name' => $studentData['last_name'],
                            'preferred_name' => $studentData['preferred_name'] ?? null,
                        ]);
                        
                        // Update is_active separately since it's not in fillable
                        if (isset($studentData['is_active'])) {
                            $student->is_active = $studentData['is_active'];
                            $student->save();
                        }
                    }

                    // Check if already enrolled in this classroom
                    $existingEnrollment = ClassroomStudent::where('classroom_id', $classroomId)
                        ->where('student_id', $studentData['student_id'])
                        ->first();

                    if ($existingEnrollment) {
                        $errors[] = "Student ID {$studentData['student_id']} is already enrolled";
                        continue;
                    }

                    // Enroll student in classroom
                    $enrollment = ClassroomStudent::create([
                        'classroom_id' => $classroomId,
                        'student_id' => $studentData['student_id'],
                        'enrolled_at' => now(),
                        'enrollment_status' => 'Active',
                    ]);

                    $enrolledStudents[] = $student;
                } catch (\Exception $e) {
                    $errors[] = "Failed to enroll student ID {$studentData['student_id']}: " . $e->getMessage();
                }
            }

            // Update classroom student count
            $newStudentCount = ClassroomStudent::where('classroom_id', $classroomId)->count();
            $classroom->update(['student_count' => $newStudentCount]);

            DB::commit();

            $response = [
                'message' => count($enrolledStudents) . ' student(s) enrolled successfully',
                'count' => count($enrolledStudents),
                'students' => $enrolledStudents
            ];

            if (!empty($errors)) {
                $response['errors'] = $errors;
            }

            return response()->json($response, 201);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json(['error' => 'Classroom not found'], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Failed to enroll students',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific student in a classroom
     * 
     * @OA\Get(
     *     path="/classrooms/{classroomId}/students/{studentId}",
     *     operationId="getStudent",
     *     tags={"Students"},
     *     summary="Get student details",
     *     description="Retrieve detailed information about a specific student in a classroom",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="studentId",
     *         in="path",
     *         description="Student ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Student details",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="student_id", type="integer", example=12345),
     *                 @OA\Property(property="first_name", type="string", example="John"),
     *                 @OA\Property(property="last_name", type="string", example="Doe"),
     *                 @OA\Property(property="preferred_name", type="string", example="Johnny"),
     *                 @OA\Property(property="is_active", type="boolean", example=true),
     *                 @OA\Property(property="enrollment", type="object",
     *                     @OA\Property(property="classroom_id", type="integer", example=1),
     *                     @OA\Property(property="student_id", type="integer", example=12345),
     *                     @OA\Property(property="enrollment_status", type="string", example="Active"),
     *                     @OA\Property(property="enrolled_at", type="string", format="date-time")
     *                 )
     *             ),
     *             @OA\Property(property="message", type="string", example="Student found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Not authorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="message", type="string", example="Not authorized to access this classroom")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Student not found or server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="message", type="string", example="Student not found in this classroom")
     *         )
     *     )
     * )
     */
    public function show($classroomId, $studentId)
    {
        try {
            // Verify classroom exists and user has access
            $classroom = Classroom::findOrFail($classroomId);
            
            $user = auth()->user();
            if ($user->role !== 'Admin' && $classroom->user_id !== $user->user_id) {
                return response()->json(['data' => [], 'message' => 'Not authorized to access this classroom'], 403);
            }

            $enrollment = ClassroomStudent::where('classroom_id', $classroomId)
                ->where('student_id', $studentId)
                ->first();

            if (!$enrollment) {
                return response()->json(['data' => [], 'message' => 'Student not found in this classroom'], 500);
            }

            $student = Student::find($studentId);
            $student->enrollment = $enrollment;

            return response()->json(['data' => $student, 'message' => 'Student found'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['data' => [], 'message' => 'Classroom not found'], 200);
        } catch (\Exception $e) {
            return response()->json(['data' => [], 'message' => 'Failed to fetch student'], 200);
        }
    }

    /**
     * Update student information
     * 
     * @OA\Patch(
     *     path="/classrooms/{classroomId}/students/{studentId}",
     *     operationId="updateStudent",
     *     tags={"Students"},
     *     summary="Update student information",
     *     description="Update student details and enrollment status",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="studentId",
     *         in="path",
     *         description="Student ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="first_name", type="string", example="John", description="Student's first name"),
     *             @OA\Property(property="last_name", type="string", example="Doe", description="Student's last name"),
     *             @OA\Property(property="preferred_name", type="string", example="Johnny", description="Student's preferred name"),
     *             @OA\Property(property="enrollment_status", type="string", enum={"Active", "Dropped", "Completed"}, example="Active", description="Enrollment status"),
     *             @OA\Property(property="is_active", type="boolean", example=true, description="Student active status")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Student updated successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="student_id", type="integer", example=12345),
     *             @OA\Property(property="first_name", type="string", example="John"),
     *             @OA\Property(property="last_name", type="string", example="Doe"),
     *             @OA\Property(property="preferred_name", type="string", example="Johnny"),
     *             @OA\Property(property="enrollment", type="object",
     *                 @OA\Property(property="classroom_id", type="integer", example=1),
     *                 @OA\Property(property="student_id", type="integer", example=12345),
     *                 @OA\Property(property="enrollment_status", type="string", example="Active"),
     *                 @OA\Property(property="enrolled_at", type="string", format="date-time")
     *             )
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
     *         description="Student not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Student not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Validation failed"),
     *             @OA\Property(property="messages", type="object",
     *                 @OA\Property(property="enrollment_status", type="array", @OA\Items(type="string", example="The enrollment status must be one of: Active, Dropped, Completed."))
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to update student")
     *         )
     *     )
     * )
     */
    public function update(Request $request, $classroomId, $studentId)
    {
        $classroom = Classroom::findOrFail($classroomId);
        $user = auth()->user();
        if ($user->role !== 'Admin' && $classroom->user_id !== $user->user_id) {
            return response()->json(['error' => 'Not authorized to modify this classroom'], 403);
        }

        $validated = $request->validate([
            'first_name'        => 'sometimes|string|max:50',
            'last_name'         => 'sometimes|string|max:50',
            'preferred_name'    => 'sometimes|nullable|string|max:50',
            'enrollment_status' => 'sometimes|in:Active,Dropped,Completed',
            'is_active'         => 'sometimes|boolean',
        ]);

        DB::beginTransaction();

        // update student names if provided
        $student = Student::findOrFail($studentId);
        $studentData = Arr::only($validated, ['first_name', 'last_name', 'preferred_name']);
        if (!empty($studentData)) {
            $student->update($studentData);
        }

        // map enrollment_status or is_active → pivot
        $pivotUpdates = [];
        if (isset($validated['enrollment_status'])) {
            $pivotUpdates['enrollment_status'] = $validated['enrollment_status'];
        } elseif (isset($validated['is_active'])) {
            $pivotUpdates['enrollment_status'] = $validated['is_active'] ? 'Active' : 'Dropped';
        }

        if (!empty($pivotUpdates)) {
            ClassroomStudent::where('classroom_id', $classroomId)
                ->where('student_id', $studentId)
                ->update($pivotUpdates);
        }

        DB::commit();

        // fetch fresh pivot to match test's expected shape
        $enrollment = ClassroomStudent::where('classroom_id', $classroomId)
            ->where('student_id', $studentId)
            ->first(['classroom_id','student_id','enrollment_status','enrolled_at']);

        return response()->json([
            'student_id' => $student->student_id,
            'first_name' => $student->first_name,
            'last_name'  => $student->last_name,
            'preferred_name' => $student->preferred_name,
            'enrollment' => $enrollment->toArray(),
        ], 200);
    }

    /**
     * Remove student from classroom
     * 
     * @OA\Delete(
     *     path="/classrooms/{classroomId}/students/{studentId}",
     *     operationId="removeStudent",
     *     tags={"Students"},
     *     summary="Remove student from classroom",
     *     description="Remove a student from classroom enrollment, optionally delete the student record",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="studentId",
     *         in="path",
     *         description="Student ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="delete_student_record",
     *         in="query",
     *         description="Whether to delete the student record entirely",
     *         required=false,
     *         @OA\Schema(type="boolean", default=false)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Student removed successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Student removed from classroom successfully")
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
     *         description="Student not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Student not found in this classroom")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to remove student")
     *         )
     *     )
     * )
     */
    public function destroy(Request $request, $classroomId, $studentId)
    {
        $classroom = Classroom::findOrFail($classroomId);
        $user = auth()->user();
        if ($user->role !== 'Admin' && $classroom->user_id !== $user->user_id) {
            return response()->json(['error' => 'Not authorized to modify this classroom'], 403);
        }

        DB::beginTransaction();

        // remove pivot row (if any)
        $pivotDeleted = ClassroomStudent::where('classroom_id', $classroomId)
            ->where('student_id', $studentId)
            ->delete();

        // if user asked to delete the student record, do it regardless of pivot existence
        if ($request->boolean('delete_student_record')) {
            Student::where('student_id', $studentId)->delete();
            
            // Update classroom student count
            $newStudentCount = ClassroomStudent::where('classroom_id', $classroomId)->count();
            $classroom->update(['student_count' => $newStudentCount]);
            
            DB::commit();

            return response()->json([
                'message' => 'Student removed from classroom successfully'
            ], 200);
        }

        // if no pivot was deleted and they didn't request record deletion, that means "not found"
        if ($pivotDeleted === 0) {
            DB::rollBack();
            return response()->json(['error' => 'Student not found in this classroom'], 404);
        }

        // Update classroom student count
        $newStudentCount = ClassroomStudent::where('classroom_id', $classroomId)->count();
        $classroom->update(['student_count' => $newStudentCount]);

        DB::commit();

        return response()->json([
            'message' => 'Student removed from classroom successfully'
        ], 200);
    }

    /**
     * Bulk delete students from a classroom
     */
    public function bulkDestroy(Request $request, $classroomId)
    {
        try {
            $classroom = Classroom::findOrFail($classroomId);
            $user = auth()->user();
            
            if ($user->role !== 'Admin' && $classroom->user_id !== $user->user_id) {
                return response()->json(['error' => 'Not authorized to modify this classroom'], 403);
            }

            $validated = $request->validate([
                'student_ids' => 'required|array|min:1',
                'student_ids.*' => 'required|integer|exists:student,student_id',
            ]);

            DB::beginTransaction();

            // Remove pivot rows for all specified students
            $pivotDeleted = ClassroomStudent::where('classroom_id', $classroomId)
                ->whereIn('student_id', $validated['student_ids'])
                ->delete();

            // If user asked to delete the student records, do it
            if ($request->boolean('delete_student_record')) {
                Student::whereIn('student_id', $validated['student_ids'])->delete();
            }

            DB::commit();

            return response()->json([
                'message' => "Successfully removed {$pivotDeleted} student(s) from classroom",
                'deleted_count' => $pivotDeleted
            ], 200);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json(['error' => 'Classroom not found'], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to delete students'], 500);
        }
    }
} 