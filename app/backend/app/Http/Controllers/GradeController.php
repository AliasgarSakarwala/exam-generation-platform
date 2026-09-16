<?php

namespace App\Http\Controllers;

use App\Models\ExamVariant;
use App\Models\Grade;
use App\Models\Exam;
use Illuminate\Http\Request;
use App\Models\StudentAnswer;
use App\Models\ExamVariantQuestion;

/**
 * @OA\Tag(
 *     name="Grades",
 *     description="Grade management and analytics endpoints"
 * )
 */
class GradeController extends Controller
{
    /**
     * Get all grades for an exam with detailed analytics
     * 
     * @OA\Get(
     *     path="/classrooms/{classroomId}/exams/{examId}/grades",
     *     operationId="getExamGrades",
     *     tags={"Grades"},
     *     summary="Get all grades for an exam",
     *     description="Retrieve all grades for a specific exam with student details, answer tracking, and analytics",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="examId",
     *         in="path",
     *         description="Exam ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of grades with analytics",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="grade_id", type="integer", example=1),
     *                 @OA\Property(property="student", type="object",
     *                     @OA\Property(property="student_id", type="integer", example=1),
     *                     @OA\Property(property="full_name", type="string", example="John Doe"),
     *                     @OA\Property(property="email", type="string", example="john@example.com")
     *                 ),
     *                 @OA\Property(property="raw_score", type="integer", example=85),
     *                 @OA\Property(property="normalized_score", type="integer", example=92),
     *                 @OA\Property(property="letter_grade", type="string", example="A"),
     *                 @OA\Property(property="grade_points", type="integer", example=4),
     *                 @OA\Property(property="percentile", type="number", format="float", example=87.5),
     *                 @OA\Property(property="exam_variant_id", type="integer", example=1),
     *                 @OA\Property(property="version", type="integer", example=1),
     *                 @OA\Property(property="answers", type="array", @OA\Items(
     *                     type="object",
     *                     @OA\Property(property="selected_option", type="string", example="A"),
     *                     @OA\Property(property="question_number", type="integer", example=1)
     *                 ))
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User not authorized to view grades",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Unauthorized")
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
    public function index(Request $request, $classroomId, $examId)
    {
        $exam = Exam::findOrFail($examId);
        if ($exam->classroom_id != $classroomId) {
            abort(404);
        }
        $user = $request->user();
        if (!($user->role === 'Admin' || $exam->user_id === $user->id)) {
            abort(403, 'Unauthorized');
        }

        $grades = Grade::with([
                        'student',
                        'answers.examVariantQuestion',
                        'examVariant'
                    ])
                   ->whereHas('examVariant', fn($q) => $q->where('exam_id', $examId))
                   ->get();

        $result = $grades->map(function($grade) {
            return [
                'grade_id'         => $grade->grade_id,
                'student'          => $grade->student,
                'raw_score'        => $grade->raw_score,
                'normalized_score' => $grade->normalized_score,
                'letter_grade'     => $grade->letter_grade,
                'grade_points'     => $grade->grade_points,
                'percentile'       => $grade->percentile,
                'exam_grade'       => $grade->exam_grade, // Added
                'exam_variant_id'  => $grade->exam_variant_id,
                'version'          => $grade->examVariant->version_number,

                'answers' => $grade->answers->map(fn($ans) => [
                    'selected_option'  => $ans->selected_option,
                    'question_number'  => $ans->examVariantQuestion->question_number,
                ])->values(),
            ];
        });

        return response()->json($result, 200);
    }

    /**
     * Store grades for an exam with answer tracking
     * 
     * @OA\Post(
     *     path="/classrooms/{classroomId}/exams/{examId}/grades",
     *     operationId="storeExamGrades",
     *     tags={"Grades"},
     *     summary="Store grades for an exam",
     *     description="Store multiple grades for an exam with detailed answer tracking and analytics",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
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
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="exam_variant_id", type="integer", example=1),
     *                 @OA\Property(property="student_id", type="integer", example=1),
     *                 @OA\Property(property="raw_score", type="integer", example=85),
     *                 @OA\Property(property="normalized_score", type="integer", example=92),
     *                 @OA\Property(property="letter_grade", type="string", example="A"),
     *                 @OA\Property(property="grade_points", type="integer", example=4),
     *                 @OA\Property(property="percentile", type="number", format="float", example=87.5),
     *                 @OA\Property(property="answer", type="array", @OA\Items(type="string"), example={"A", "B", "C", "D"})
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Grades created successfully",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="grade_id", type="integer", example=1),
     *                 @OA\Property(property="exam_variant_id", type="integer", example=1),
     *                 @OA\Property(property="student_id", type="integer", example=1),
     *                 @OA\Property(property="raw_score", type="integer", example=85),
     *                 @OA\Property(property="normalized_score", type="integer", example=92),
     *                 @OA\Property(property="letter_grade", type="string", example="A"),
     *                 @OA\Property(property="grade_points", type="integer", example=4),
     *                 @OA\Property(property="percentile", type="number", format="float", example=87.5)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User not authorized to store grades",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Unauthorized")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Exam or variant not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Exam not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )
     */
    public function store(Request $request, $classroomId, $examId)
    {
        // 1) First, load & authorize the exam itself
        $exam = Exam::findOrFail($examId);
        if ($exam->classroom_id != $classroomId) {
            abort(404);
        }
        $user = $request->user();
        if (!($user->role === 'Admin' || $exam->user_id === $user->id)) {
            abort(403, 'Unauthorized');
        }

        // 2) Validate that the entire request is an array of records, each containing an exam_variant_id + all grade fields
        $records = $request->validate([
            '*.exam_variant_id'      => ['required','integer','exists:exam_variant,exam_variant_id'],
            '*.student_id'           => ['required','integer','exists:student,student_id'],
            '*.raw_score'            => ['required','integer'],
            '*.normalized_score'     => ['nullable','integer'],
            '*.letter_grade'         => ['nullable','string','max:2'],
            '*.grade_points'         => ['nullable','integer'],
            '*.percentile'           => ['nullable','numeric'],
            '*.exam_grade'           => ['nullable','numeric'], // Added
            '*.answer'               => ['required','array'],
            '*.answer.*'             => ['required','string'],
        ]);

        $created = [];

        foreach ($records as $rec) {
            // 3) For *each* record, load & authorize its variant
            $variant = ExamVariant::with('exam')
                ->findOrFail($rec['exam_variant_id']);

            if ($variant->exam_id !== (int) $examId) {
                abort(404);
            }

            // 4) Build your key + question list from that variant
            $correctAnswers = array_map('trim', explode(',', $variant->answer_key));
            $questionIds    = ExamVariantQuestion::where('exam_variant_id', $variant->exam_variant_id)
                                ->orderBy('question_number')
                                ->pluck('exam_variant_question_id')
                                ->toArray();

            // 5) Separate out answers, then create grade
            $answers = $rec['answer'];
            unset($rec['answer']);

            // attach the FK
            $rec['exam_variant_id'] = $variant->exam_variant_id;
            $grade = Grade::create($rec);

            // 6) And finally insert each StudentAnswer
            foreach ($answers as $idx => $chosen) {
                if (! isset($questionIds[$idx])) {
                    continue;
                }
                $chosen  = trim($chosen);
                $correct = isset($correctAnswers[$idx])
                        && strcasecmp($chosen, $correctAnswers[$idx]) === 0;

                StudentAnswer::create([
                    'grade_id'        => $grade->grade_id,
                    'exam_variant_question_id'     => $questionIds[$idx],
                    'selected_option' => $chosen,
                    'is_correct'      => $correct,
                ]);
            }

            $created[] = $grade;
        }

        return response()->json($created, 201);
    }

    /**
     * Get grades for a specific exam variant
     * 
     * @OA\Get(
     *     path="/classrooms/{classroomId}/exams/{examId}/variants/{variantId}/grades",
     *     operationId="getVariantGrades",
     *     tags={"Grades"},
     *     summary="Get grades for a specific exam variant",
     *     description="Retrieve all grades for a specific exam variant with student details",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
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
     *         description="Grades for the variant",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="grade_id", type="integer", example=1),
     *                 @OA\Property(property="student", type="object",
     *                     @OA\Property(property="student_id", type="integer", example=1),
     *                     @OA\Property(property="full_name", type="string", example="John Doe")
     *                 ),
     *                 @OA\Property(property="raw_score", type="integer", example=85),
     *                 @OA\Property(property="normalized_score", type="integer", example=92),
     *                 @OA\Property(property="letter_grade", type="string", example="A"),
     *                 @OA\Property(property="grade_points", type="integer", example=4),
     *                 @OA\Property(property="percentile", type="number", format="float", example=87.5)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User not authorized to view grades",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Unauthorized")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Variant not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Variant not found")
     *         )
     *     )
     * )
     */
    public function show(Request $request, $classroomId, $examId, $variantId)
    {
        $variant = ExamVariant::with('exam')->findOrFail($variantId);
        if ($variant->exam->classroom_id != $classroomId) {
            abort(404);
        }

        $user = $request->user();
        if (!($user->role === 'Admin' || $variant->exam->user_id === $user->id)) {
            abort(403, 'Unauthorized');
        }

        $grade = Grade::with('student')
                      ->where('exam_variant_id', $variantId)
                      ->get();

        return response()->json($grade);
    }

    /**
     * Update a specific grade
     * 
     * @OA\Patch(
     *     path="/classrooms/{classroomId}/exams/{examId}/grades/{gradeId}",
     *     operationId="updateGrade",
     *     tags={"Grades"},
     *     summary="Update a grade",
     *     description="Update grade details including scores, letter grade, and analytics",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="examId",
     *         in="path",
     *         description="Exam ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="gradeId",
     *         in="path",
     *         description="Grade ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="raw_score", type="number", format="float", example=85),
     *             @OA\Property(property="normalized_score", type="number", format="float", example=92),
     *             @OA\Property(property="letter_grade", type="string", example="A"),
     *             @OA\Property(property="grade_points", type="number", format="float", example=4.0),
     *             @OA\Property(property="percentile", type="number", format="float", example=87.5)
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Grade updated successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="grade_id", type="integer", example=1),
     *             @OA\Property(property="raw_score", type="number", format="float", example=85),
     *             @OA\Property(property="normalized_score", type="number", format="float", example=92),
     *             @OA\Property(property="letter_grade", type="string", example="A"),
     *             @OA\Property(property="grade_points", type="number", format="float", example=4.0),
     *             @OA\Property(property="percentile", type="number", format="float", example=87.5)
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User not authorized to update grades",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Unauthorized")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Grade not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Grade not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )
     */
    public function update(Request $request, $classroomId, $examId, $gradeId)
    {
        // 1) First, load & authorize the exam itself
        $exam = Exam::findOrFail($examId);
        if ($exam->classroom_id != $classroomId) {
            abort(404);
        }
        $user = $request->user();
        if (!($user->role === 'Admin' || $exam->user_id === $user->id)) {
            abort(403, 'Unauthorized');
        }

        $grade = Grade::findOrFail($gradeId);

        $data = $request->validate([
            'raw_score'       => ['sometimes','numeric'],
            'normalized_score'=> ['sometimes','numeric'],
            'letter_grade'    => ['sometimes','string','max:2'],
            'grade_points'    => ['sometimes','numeric'],
            'percentile'      => ['sometimes','numeric'],
            'exam_grade'      => ['sometimes','numeric'], // Added
        ]);

        $grade->update($data);

        return response()->json($grade);
    }

    /**
     * Delete a grade
     * 
     * @OA\Delete(
     *     path="/classrooms/{classroomId}/exams/{examId}/grades/{gradeId}",
     *     operationId="deleteGrade",
     *     tags={"Grades"},
     *     summary="Delete a grade",
     *     description="Delete a specific grade and all associated student answers",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="examId",
     *         in="path",
     *         description="Exam ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="gradeId",
     *         in="path",
     *         description="Grade ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Grade deleted successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Grade deleted successfully")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User not authorized to delete grades",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Unauthorized")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Grade not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Grade not found")
     *         )
     *     )
     * )
     */
    public function destroy(Request $request, $classroomId, $examId, $gradeId)
    {
         // 1) First, load & authorize the exam itself
        $exam = Exam::findOrFail($examId);
        if ($exam->classroom_id != $classroomId) {
            abort(404);
        }
        $user = $request->user();
        if (!($user->role === 'Admin' || $exam->user_id === $user->id)) {
            abort(403, 'Unauthorized');
        }

        $grade = Grade::findOrFail($gradeId);

        $grade->delete();

        return response()->json(['message' => 'Grade deleted successfully'], 200);
    }
}