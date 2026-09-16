<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\DatabaseApiController;
use App\Http\Controllers\Classroom\ClassroomController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\Classroom\ClassroomStudentController;
use App\Http\Controllers\ExamGenerationController;
use App\Http\Controllers\Student\StudentController;
use App\Http\Controllers\QuestionBankController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\Exam\ExamController;
use App\Http\Controllers\Exam\ExamVariantController;
use App\Http\Controllers\Exam\ExamVariantQuestionController;
use App\Http\Controllers\Exam\ExamWeightController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\GradeSettingsController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\Email\EmailController;

// -------------------------------------------AUTHENTICATION ROUTES-------------------------------------------
Route::middleware('auth:sanctum')->get('/user-data', function () {
    return Auth::user();
});

Route::middleware('auth:sanctum')
    ->post('/user/change-password', [UserController::class, 'changePassword']);

Route::middleware('auth:sanctum')
    ->patch('/user/update', [UserController::class, 'update']);

// DELETE /api/user/{id} — hard delete own account
Route::middleware('auth:sanctum')
     ->delete('/user/{id}', [UserController::class, 'destroy']);

Route::post('/auth/register', [RegisteredUserController::class, 'store'])
    ->middleware('guest')
    ->name('register');

Route::post('/auth/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('guest')
    ->name('login');

Route::post('/auth/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth:sanctum')
    ->name('logout');

Route::post('/auth/reset-password', [PasswordResetLinkController::class, 'store'])
    ->middleware('guest')
    ->name('password.email');
// -------------------------------------------AUTHENTICATION ROUTES-------------------------------------------



// -------------------------------------------CLASSROOM ROUTES-------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/classrooms', [ClassroomController::class, 'index']);
    Route::get('/classrooms/stats', [ClassroomController::class, 'stats']);
    Route::get('/classrooms/{id}', [ClassroomController::class, 'show']);
    Route::get('/classrooms/{id}/name', [ClassroomController::class, 'getName']);
    Route::post('/classrooms', [ClassroomController::class, 'store']);
    Route::patch('/classrooms/{id}/status', [ClassroomController::class, 'toggleStatus']);
    Route::delete('/classrooms/{id}', [ClassroomController::class, 'destroy']);
    Route::patch('/classrooms/{id}', [ClassroomController::class, 'update']);

    // Student management routes (classroom-specific)
    Route::get('/classrooms/{classroomId}/students', [StudentController::class, 'index']);
    Route::post('/classrooms/{classroomId}/students', [StudentController::class, 'store']);
    Route::delete('/classrooms/{classroomId}/students/bulk', [StudentController::class, 'bulkDestroy']);
    Route::get('/classrooms/{classroomId}/students/{studentId}', [StudentController::class, 'show']);
    Route::patch('/classrooms/{classroomId}/students/{studentId}', [StudentController::class, 'update']);
    Route::delete('/classrooms/{classroomId}/students/{studentId}', [StudentController::class, 'destroy']);

    // Grade management routes (classroom-specific)
    Route::get('/classrooms/{classroomId}/exams/{examId}/grades', [GradeController::class, 'index']);
    Route::post('/classrooms/{classroomId}/exams/{examId}/grades', [GradeController::class, 'store']);
    Route::get('/classrooms/{classroomId}/exams/{examId}/grades/variant/{variantId}', [GradeController::class, 'show']);
    Route::patch('/classrooms/{classroomId}/exams/{examId}/grades/{gradeId}', [GradeController::class, 'update']);
    Route::delete('/classrooms/{classroomId}/exams/{examId}/grades/{gradeId}', [GradeController::class, 'destroy']);


    // Grade settings routes (exam-specific)
    Route::get('/exams/{examId}/grade-settings', [GradeSettingsController::class, 'show']);
    Route::put('/exams/{examId}/grade-settings', [GradeSettingsController::class, 'update']);
    Route::post('/exams/{examId}/grade-settings/reset', [GradeSettingsController::class, 'reset']);

    // Exam management routes (classroom-specific)
    // Route::post('/classrooms/{classroomId}/exams/{examId}/statistics', [ExamStatisticsController::class, 'store']);
    // Route::post('/classrooms/{classroomId}/exams/{examId}/calculate-statistics', [ExamStatController::class, 'calculateAndStore'])->name('exams.calculate-statistics');
});
// -------------------------------------------CLASSROOM ROUTES-------------------------------------------


// -------------------------------------------QUESTION ROUTES-------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/questions/{id}', [QuestionController::class, 'show']);
    Route::get('/questions/search', [QuestionController::class, 'searchByText']);
    Route::patch('/questions/{id}', [QuestionController::class, 'update']);
    Route::delete('/questions/{id}', [QuestionController::class, 'destroy']);   
    Route::get('/questions/count', [QuestionBankController::class, 'questionsCountForProfessor']);
    
});

// -------------------------------------------QUESTION ROUTES-------------------------------------------


// -------------------------------------------QUESTION BANK ROUTES-------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/classrooms/{classroomId}/question-banks', [QuestionBankController::class, 'index']);
    Route::get('/classrooms/{classroomId}/question-banks/{id}', [QuestionBankController::class, 'show']);
    Route::post('/classrooms/{classroomId}/question-banks', [QuestionBankController::class, 'store']);
    Route::patch('/classrooms/{classroomId}/question-banks/{id}', [QuestionBankController::class, 'update']);
    Route::delete('/classrooms/{classroomId}/question-banks/{id}', [QuestionBankController::class, 'destroy']);
});
// -------------------------------------------QUESTION BANK ROUTES-------------------------------------------

// -------------------------------------------TAG ROUTES-------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    // Tag resource routes
    Route::apiResource('tags', TagController::class);
    
    // Additional custom route for getting tags by classroom
    Route::get('classrooms/{classroomId}/tags', [TagController::class, 'getByClassroom']);
});  
// -------------------------------------------TAG ROUTES-------------------------------------------

// -------------------------------------------CLASSROOM STUDENT ROUTES-------------------------------------------
Route::post('/classroom/enroll-students', [ClassroomStudentController::class, 'enroll']);
Route::get('/classroom/{id}/students', [ClassroomStudentController::class, 'getStudents']);
Route::put('/classroom/{id}/students', [ClassroomStudentController::class, 'editStudents']);
// -------------------------------------------CLASSROOM STUDENT ROUTES-------------------------------------------


// -------------------------------------------USER MANAGEMENT ROUTES-------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user-management', [UserManagementController::class, 'index']);
    Route::post('/user-management', [UserManagementController::class, 'store']);
    Route::get('/user-management/{id}', [UserManagementController::class, 'show']);
    Route::patch('/user-management/{id}', [UserManagementController::class, 'update']);
    Route::delete('/user-management/{id}', [UserManagementController::class, 'destroy']);
    Route::get('/user-management/available/classrooms', [UserManagementController::class, 'getAvailableClassrooms']);
    Route::get('/user-management/available/users', [UserManagementController::class, 'getAvailableUsers']);
    Route::get('/user-management/search/tas', [UserManagementController::class, 'searchTAs']);
});
// -------------------------------------------USER MANAGEMENT ROUTES-------------------------------------------


// -------------------------------------------DATABASE ROUTE-------------------------------------------
Route::post('/exam/variants', [ExamGenerationController::class, 'generateExamVariants']);
Route::get('/', [\App\Http\Controllers\DatabaseApiController::class, 'getDatabaseContent']);
// -------------------------------------------DATABASE ROUTE-------------------------------------------

// -------------------------------------------EXAM ROUTE-------------------------------------------
Route::apiResource('exams', ExamController::class)->except(['edit', 'create']);
Route::get('exams/{exam_id}/columns/{columns}', [ExamController::class, 'showColumns']);
Route::get('exams-columns/{columns}', [ExamController::class, 'indexColumns']);
Route::get('/exams/classroom/{classroom_id}', [ExamController::class, 'getByClassroom']);
Route::get('/exams/classroom/{classroom_id}/columns/{columns}', [ExamController::class, 'getByClassroomColumns']);
// -------------------------------------------EXAM ROUTE-------------------------------------------

// -------------------------------------------EXAM VARIANT ROUTE-------------------------------------------
Route::prefix('exams/{examId}/variants')->group(function () {
    Route::get('/', [\App\Http\Controllers\Exam\ExamVariantController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Exam\ExamVariantController::class, 'store']);

    Route::prefix('/{variantId}')->group(function () {
        Route::get('/', [\App\Http\Controllers\Exam\ExamVariantController::class, 'show']);
        Route::put('/', [\App\Http\Controllers\Exam\ExamVariantController::class, 'update']);
        Route::delete('/', [\App\Http\Controllers\Exam\ExamVariantController::class, 'destroy']);
    });

    Route::get('/version/{versionNumber}', [\App\Http\Controllers\Exam\ExamVariantController::class, 'getByVersion']);
});
// -------------------------------------------EXAM VARIANT ROUTE-------------------------------------------

// -------------------------------------------EXAM VARIANT QUESTIONS ROUTE-------------------------------------------
Route::prefix('exam-variant-questions')->group(function () {
    Route::post('/', [\App\Http\Controllers\Exam\ExamVariantQuestionController::class, 'store']);
    Route::get('/variant/{variantId}', [\App\Http\Controllers\Exam\ExamVariantQuestionController::class, 'getByVariant']);
    Route::put('/{questionId}', [\App\Http\Controllers\Exam\ExamVariantQuestionController::class, 'update']);
    Route::delete('/{questionId}', [\App\Http\Controllers\Exam\ExamVariantQuestionController::class, 'destroy']);
});
// -------------------------------------------EXAM VARIANT QUESTIONS ROUTE-------------------------------------------



// -------------------------------------------EXAM WEIGHT ROUTE-------------------------------------------
Route::apiResource('exam-weights', ExamWeightController::class);
// -------------------------------------------EXAM WEIGHT ROUTE-------------------------------------------


// -------------------------------------------EMAIL ROUTE-------------------------------------------
Route::middleware('auth:sanctum')->post('/email/send-invite', [EmailController::class, 'sendInvite']);
// -------------------------------------------EMAIL ROUTE-------------------------------------------
// -------------------------------------------DIAGNOSTIC & ACTIVITY LOG ROUTES-------------------------------------------

// Activity logs endpoints
Route::middleware('auth:sanctum')->group(function () {
    Route::get('activity-logs', [ActivityLogController::class, 'index']);
    Route::get('activity-logs/stats', [ActivityLogController::class, 'getStats']);
    Route::get('activity-logs/kpi-stats', [ActivityLogController::class, 'getKPIStats']);
    Route::get('activity-logs/graph-data', [ActivityLogController::class, 'getGraphData']);
    Route::get('activity-logs/classroom/{classroomId}/activities', [ActivityLogController::class, 'getClassroomActivities']);
    Route::get('activity-logs/user/{userId}/activities', [ActivityLogController::class, 'getUserActivities']);
    Route::post('activity-logs', [ActivityLogController::class, 'store']);
});
// -------------------------------------------DIAGNOSTIC & ACTIVITY LOG ROUTES-------------------------------------------
