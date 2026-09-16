<?php

namespace App\Http\Controllers;

use App\Models\GradeSettings;
use App\Models\Exam;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class GradeSettingsController extends Controller
{
    /**
     * Get grade settings for a specific exam
     */
    public function show($examId): JsonResponse
    {
        try {
            // Check if user has access to this exam
            $exam = Exam::with('classroom')->findOrFail($examId);
            $user = Auth::user();

            if (!($user->role === 'Admin' || $exam->classroom->user_id === $user->user_id)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Get or create grade settings
            $gradeSettings = GradeSettings::firstOrCreate(
                ['exam_id' => $examId],
                [
                    'high_grade_threshold' => 80,
                    'medium_grade_threshold' => 50,
                    'low_grade_threshold' => 0,
                    'high_grade_color' => '#10B981',
                    'medium_grade_color' => '#F59E0B',
                    'low_grade_color' => '#EF4444',
                    'anonymous_student_names' => false,
                ]
            );

            return response()->json($gradeSettings);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to retrieve grade settings'], 500);
        }
    }

    /**
     * Update grade settings for a specific exam
     */
    public function update(Request $request, $examId): JsonResponse
    {
        try {
            // Check if user has access to this exam
            $exam = Exam::with('classroom')->findOrFail($examId);
            $user = Auth::user();

            if (!($user->role === 'Admin' || $exam->classroom->user_id === $user->user_id)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'high_grade_threshold' => 'required|integer|min:0|max:100',
                'medium_grade_threshold' => 'required|integer|min:0|max:100',
                'low_grade_threshold' => 'required|integer|min:0|max:100',
                'high_grade_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'medium_grade_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'low_grade_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'anonymous_student_names' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Validate threshold logic
            $highThreshold = $request->input('high_grade_threshold');
            $mediumThreshold = $request->input('medium_grade_threshold');
            $lowThreshold = $request->input('low_grade_threshold');

            if ($highThreshold <= $mediumThreshold) {
                return response()->json(['error' => 'High grade threshold must be greater than medium grade threshold'], 422);
            }

            if ($mediumThreshold <= $lowThreshold) {
                return response()->json(['error' => 'Medium grade threshold must be greater than low grade threshold'], 422);
            }

            // Update or create grade settings
            $gradeSettings = GradeSettings::updateOrCreate(
                ['exam_id' => $examId],
                [
                    'high_grade_threshold' => $highThreshold,
                    'medium_grade_threshold' => $mediumThreshold,
                    'low_grade_threshold' => $lowThreshold,
                    'high_grade_color' => $request->input('high_grade_color'),
                    'medium_grade_color' => $request->input('medium_grade_color'),
                    'low_grade_color' => $request->input('low_grade_color'),
                    'anonymous_student_names' => $request->input('anonymous_student_names', false),
                ]
            );

            return response()->json([
                'message' => 'Grade settings updated successfully',
                'data' => $gradeSettings
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update grade settings'], 500);
        }
    }

    /**
     * Reset grade settings to defaults
     */
    public function reset($examId): JsonResponse
    {
        try {
            // Check if user has access to this exam
            $exam = Exam::with('classroom')->findOrFail($examId);
            $user = Auth::user();

            if (!($user->role === 'Admin' || $exam->classroom->user_id === $user->user_id)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Update or create with default values
            $gradeSettings = GradeSettings::updateOrCreate(
                ['exam_id' => $examId],
                [
                    'high_grade_threshold' => 80,
                    'medium_grade_threshold' => 50,
                    'low_grade_threshold' => 0,
                    'high_grade_color' => '#10B981',
                    'medium_grade_color' => '#F59E0B',
                    'low_grade_color' => '#EF4444',
                    'anonymous_student_names' => false,
                ]
            );

            return response()->json([
                'message' => 'Grade settings reset to defaults',
                'data' => $gradeSettings
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to reset grade settings'], 500);
        }
    }
}
