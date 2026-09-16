<?php

namespace App\Http\Controllers\Classroom;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ClassroomStudentController extends Controller
{
    public function enroll(Request $request)
    {
        $validated = $request->validate([
            'students' => 'required|array|min:1',
            'students.*.studentId' => 'required|integer',
            'students.*.fullname' => 'required|string|max:100',
            'students.*.courseId' => 'required|integer',
        ]);

        $rows = collect($validated['students'])->map(function ($student) {
            return [
                'classroom_id' => $student['courseId'],
                'student_id' => $student['studentId'],
                'student_fullname' => $student['fullname'],
                'enrolled_at' => now(),
                'enrollment_status' => 'Active',
            ];
        });

        // Batch insert
        DB::table('classroom_student')->insert($rows->all());

        return response()->json(['message' => 'Students enrolled successfully'], 201);
    }

    public function getStudents($id){
    $students = DB::table('classroom_student')
        ->select([
            'student_id as studentId',
            'student_fullname as fullname',
            'enrolled_at as enrolledAt',
            'enrollment_status as status'
        ])
        ->where('classroom_id', $id)
        ->orderBy('enrolled_at', 'asc')
        ->get();

    return response()->json($students);
}

    public function editStudents(Request $request, $id){
    try {
        $validated = $request->validate([
            'students' => 'required|array',
            'students.*.studentId' => 'required|integer',
            'students.*.fullname' => 'required|string|max:100',
            'students.*.courseId' => 'required|integer|in:' . $id,
        ]);

        // Begin transaction for atomic operation
        DB::beginTransaction();

        // First, delete all existing students for this classroom
        DB::table('classroom_student')
            ->where('classroom_id', $id)
            ->delete();

        // Then insert the new students
        $rows = collect($validated['students'])->map(function ($student) use ($id) {
            return [
                'classroom_id' => $id,
                'student_id' => $student['studentId'],
                'student_fullname' => $student['fullname'],
                'enrolled_at' => now(),
                'enrollment_status' => 'Active',
            ];
        });

        DB::table('classroom_student')->insert($rows->all());

        DB::commit();

        return response()->json(['message' => 'Students updated successfully'], 200);

    } catch (ValidationException $e) {
        DB::rollBack();
        return response()->json([
            'error' => 'Validation failed',
            'messages' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['error' => 'Failed to update students'], 500);
    }
}
}
