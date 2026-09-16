<?php

namespace App\Http\Controllers;

use App\Models\UserManagement;
use App\Models\Classroom;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="User Management",
 *     description="User management endpoints for assigning users to classrooms"
 * )
 */
class UserManagementController extends Controller
{
    /**
     * Display a listing of the resource.
     * 
     * @OA\Get(
     *     path="/user-management",
     *     operationId="getAllUserManagement",
     *     tags={"User Management"},
     *     summary="Get all user management records",
     *     description="Retrieve all user management records with classroom and user details",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="List of user management records",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="um_id", type="integer", example=1),
     *                 @OA\Property(property="classroom_id", type="integer", example=1),
     *                 @OA\Property(property="user_id", type="integer", example=2),
     *                 @OA\Property(property="responsibility", type="string", example="Grading assignments"),
     *                 @OA\Property(property="status", type="string", enum={"archived", "active", "invited"}, example="active"),
     *                 @OA\Property(property="full_name", type="string", example="John Doe"),
     *                 @OA\Property(property="view_grades", type="boolean", example=true),
     *                 @OA\Property(property="manage_assignments", type="boolean", example=false),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time"),
     *                 @OA\Property(property="classroom", type="object",
     *                     @OA\Property(property="classroom_id", type="integer", example=1),
     *                     @OA\Property(property="name", type="string", example="Introduction to Computer Science"),
     *                     @OA\Property(property="code", type="string", example="CS101")
     *                 ),
     *                 @OA\Property(property="user", type="object",
     *                     @OA\Property(property="user_id", type="integer", example=2),
     *                     @OA\Property(property="username", type="string", example="johndoe"),
     *                     @OA\Property(property="email", type="string", example="john@example.com"),
     *                     @OA\Property(property="role", type="string", example="TA")
     *                 )
     *             ))
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
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Failed to fetch user management records"),
     *             @OA\Property(property="error", type="string", example="Database connection error")
     *         )
     *     )
     * )
     */
    public function index(): JsonResponse
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Get professor's classrooms
            $professorClassrooms = Classroom::where('user_id', $user->user_id)->pluck('classroom_id');
            
            // Get user management records only for professor's classrooms
            $userManagements = UserManagement::with(['classroom', 'user'])
                ->whereIn('classroom_id', $professorClassrooms)
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $userManagements
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user management records',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     * 
     * @OA\Post(
     *     path="/user-management",
     *     operationId="createUserManagement",
     *     tags={"User Management"},
     *     summary="Create a new user management record",
     *     description="Assign a user to a classroom with specific responsibilities and permissions",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"classroom_id", "user_id", "status", "full_name"},
     *             @OA\Property(property="classroom_id", type="integer", example=1, description="ID of the classroom"),
     *             @OA\Property(property="user_id", type="integer", example=2, description="ID of the user to assign"),
     *             @OA\Property(property="responsibility", type="string", example="Grading assignments", description="User's responsibility in the classroom"),
     *             @OA\Property(property="status", type="string", enum={"archived", "active", "invited"}, example="active", description="Assignment status"),
     *             @OA\Property(property="full_name", type="string", example="John Doe", description="Full name of the user"),
     *             @OA\Property(property="view_grades", type="boolean", example=true, description="Permission to view grades"),
     *             @OA\Property(property="manage_assignments", type="boolean", example=false, description="Permission to manage assignments")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="User management record created successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="User management record created successfully"),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="um_id", type="integer", example=1),
     *                 @OA\Property(property="classroom_id", type="integer", example=1),
     *                 @OA\Property(property="user_id", type="integer", example=2),
     *                 @OA\Property(property="responsibility", type="string", example="Grading assignments"),
     *                 @OA\Property(property="status", type="string", example="active"),
     *                 @OA\Property(property="full_name", type="string", example="John Doe"),
     *                 @OA\Property(property="view_grades", type="boolean", example=true),
     *                 @OA\Property(property="manage_assignments", type="boolean", example=false),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=409,
     *         description="User already assigned to classroom",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="User is already assigned to this classroom")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Validation failed"),
     *             @OA\Property(property="errors", type="object",
     *                 @OA\Property(property="classroom_id", type="array", @OA\Items(type="string", example="The classroom id field is required.")),
     *                 @OA\Property(property="user_id", type="array", @OA\Items(type="string", example="The user id field is required."))
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
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Failed to create user management record"),
     *             @OA\Property(property="error", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'classroom_id' => 'required|exists:classroom,classroom_id',
                'user_id' => 'required|exists:user,user_id',
                'responsibility' => 'nullable|string|max:255',
                'status' => 'required|in:archived,active,invited',
                'full_name' => 'required|string|max:255',
                'view_grades' => 'boolean',
                'manage_assignments' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if user management record already exists for this user and classroom
            $existingRecord = UserManagement::where('user_id', $request->user_id)
                ->where('classroom_id', $request->classroom_id)
                ->first();

            if ($existingRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already assigned to this classroom'
                ], 409);
            }

            $userManagement = UserManagement::create([
                'classroom_id' => $request->classroom_id,
                'user_id' => $request->user_id,
                'responsibility' => $request->responsibility,
                'status' => $request->status,
                'full_name' => $request->full_name,
                'view_grades' => $request->view_grades,
                'manage_assignments' => $request->manage_assignments
            ]);
            
            // Reset sequence if there's a large gap (optional)
            if ($userManagement->um_id > UserManagement::getNextId() + 10) {
                UserManagement::resetSequence();
            }
            $userManagement->load(['classroom', 'user']);

            return response()->json([
                'success' => true,
                'message' => 'User management record created successfully',
                'data' => $userManagement
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user management record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     * 
     * @OA\Get(
     *     path="/user-management/{id}",
     *     operationId="getUserManagementById",
     *     tags={"User Management"},
     *     summary="Get user management record",
     *     description="Retrieve a specific user management record by ID",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="User management record ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="User management record details",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="um_id", type="integer", example=1),
     *                 @OA\Property(property="classroom_id", type="integer", example=1),
     *                 @OA\Property(property="user_id", type="integer", example=2),
     *                 @OA\Property(property="responsibility", type="string", example="Grading assignments"),
     *                 @OA\Property(property="status", type="string", example="active"),
     *                 @OA\Property(property="full_name", type="string", example="John Doe"),
     *                 @OA\Property(property="view_grades", type="boolean", example=true),
     *                 @OA\Property(property="manage_assignments", type="boolean", example=false),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time"),
     *                 @OA\Property(property="classroom", type="object",
     *                     @OA\Property(property="classroom_id", type="integer", example=1),
     *                     @OA\Property(property="name", type="string", example="Introduction to Computer Science"),
     *                     @OA\Property(property="code", type="string", example="CS101")
     *                 ),
     *                 @OA\Property(property="user", type="object",
     *                     @OA\Property(property="user_id", type="integer", example=2),
     *                     @OA\Property(property="username", type="string", example="johndoe"),
     *                     @OA\Property(property="email", type="string", example="john@example.com"),
     *                     @OA\Property(property="role", type="string", example="TA")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="User management record not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="User management record not found")
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
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Failed to fetch user management record"),
     *             @OA\Property(property="error", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function show(string $id): JsonResponse
    {
        try {
            $userManagement = UserManagement::with(['classroom', 'user'])->find($id);
            
            if (!$userManagement) {
                return response()->json([
                    'success' => false,
                    'message' => 'User management record not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $userManagement
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user management record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     * 
     * @OA\Patch(
     *     path="/user-management/{id}",
     *     operationId="updateUserManagement",
     *     tags={"User Management"},
     *     summary="Update user management record",
     *     description="Update a user management record with new details",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="User management record ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="classroom_id", type="integer", example=1, description="ID of the classroom"),
     *             @OA\Property(property="user_id", type="integer", example=2, description="ID of the user to assign"),
     *             @OA\Property(property="responsibility", type="string", example="Updated responsibility", description="User's responsibility in the classroom"),
     *             @OA\Property(property="status", type="string", enum={"archived", "active", "invited"}, example="active", description="Assignment status"),
     *             @OA\Property(property="full_name", type="string", example="John Doe", description="Full name of the user"),
     *             @OA\Property(property="view_grades", type="boolean", example=true, description="Permission to view grades"),
     *             @OA\Property(property="manage_assignments", type="boolean", example=false, description="Permission to manage assignments")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="User management record updated successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="User management record updated successfully"),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="um_id", type="integer", example=1),
     *                 @OA\Property(property="classroom_id", type="integer", example=1),
     *                 @OA\Property(property="user_id", type="integer", example=2),
     *                 @OA\Property(property="responsibility", type="string", example="Updated responsibility"),
     *                 @OA\Property(property="status", type="string", example="active"),
     *                 @OA\Property(property="full_name", type="string", example="John Doe"),
     *                 @OA\Property(property="view_grades", type="boolean", example=true),
     *                 @OA\Property(property="manage_assignments", type="boolean", example=false),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="User management record not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="User management record not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Validation failed"),
     *             @OA\Property(property="errors", type="object",
     *                 @OA\Property(property="status", type="array", @OA\Items(type="string", example="The status field must be one of: archived, active, invited."))
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
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Failed to update user management record"),
     *             @OA\Property(property="error", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $userManagement = UserManagement::find($id);
            
            if (!$userManagement) {
                return response()->json([
                    'success' => false,
                    'message' => 'User management record not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'classroom_id' => 'sometimes|required|exists:classroom,classroom_id',
                'user_id' => 'sometimes|required|exists:user,user_id',
                'responsibility' => 'nullable|string|max:255',
                'status' => 'sometimes|required|in:archived,active,invited',
                'full_name' => 'sometimes|string|max:255',
                'view_grades' => 'sometimes|boolean',
                'manage_assignments' => 'sometimes|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $userManagement->update($request->all());
            $userManagement->load(['classroom', 'user']);

            return response()->json([
                'success' => true,
                'message' => 'User management record updated successfully',
                'data' => $userManagement
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user management record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     * 
     * @OA\Delete(
     *     path="/user-management/{id}",
     *     operationId="deleteUserManagement",
     *     tags={"User Management"},
     *     summary="Delete user management record",
     *     description="Remove a user management record (unassign user from classroom)",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="User management record ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="User management record deleted successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="User management record deleted successfully")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="User management record not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="User management record not found")
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
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Failed to delete user management record"),
     *             @OA\Property(property="error", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $userManagement = UserManagement::find($id);
            
            if (!$userManagement) {
                return response()->json([
                    'success' => false,
                    'message' => 'User management record not found'
                ], 404);
            }

            $userManagement->delete();
            
            // Reset sequence to start from 1 if no records remain
            $remainingCount = UserManagement::count();
            if ($remainingCount === 0) {
                UserManagement::resetSequenceToStart();
            }

            return response()->json([
                'success' => true,
                'message' => 'User management record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user management record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available classrooms for user management.
     * 
     * @OA\Get(
     *     path="/user-management/available/classrooms",
     *     operationId="getAvailableClassrooms",
     *     tags={"User Management"},
     *     summary="Get available classrooms",
     *     description="Retrieve classrooms available for user assignment (Professor sees their classrooms, Admin sees all)",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="List of available classrooms",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="name", type="string", example="CS101", description="Classroom code used as name"),
     *                 @OA\Property(property="color", type="string", example="#3B82F6", description="Classroom color"),
     *                 @OA\Property(property="classroom_id", type="integer", example=1, description="Classroom ID"),
     *                 @OA\Property(property="full_name", type="string", example="Introduction to Computer Science", description="Full classroom name")
     *             ))
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="User not authenticated",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="User not authenticated")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Access denied",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Access denied. Only Professors and Admins can view classrooms.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Failed to fetch available classrooms"),
     *             @OA\Property(property="error", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function getAvailableClassrooms(): JsonResponse
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Check if user is Professor or Admin
            if ($user->role !== 'Professor' && $user->role !== 'Admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Only Professors and Admins can view classrooms.'
                ], 403);
            }

            $classrooms = [];
            
            if ($user->role === 'Professor') {
                // Get classrooms where this professor is the owner
                $classrooms = Classroom::where('user_id', $user->user_id)
                    ->where('is_archived', false)
                    ->get(['classroom_id', 'name', 'code', 'class_colour']);
            } else if ($user->role === 'Admin') {
                // Admins can see all non-archived classrooms
                $classrooms = Classroom::where('is_archived', false)
                    ->get(['classroom_id', 'name', 'code', 'class_colour']);
            }

            // Format the response to match frontend expectations
            $formattedClassrooms = $classrooms->map(function ($classroom) {
                return [
                    'name' => $classroom->code, // Use code as name for dropdown
                    'color' => $classroom->class_colour ?: '#6B7280', // Default color if none set
                    'classroom_id' => $classroom->classroom_id,
                    'full_name' => $classroom->name
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedClassrooms
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available classrooms',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available users for user management.
     * 
     * @OA\Get(
     *     path="/user-management/available/users",
     *     operationId="getAvailableUsers",
     *     tags={"User Management"},
     *     summary="Get available users",
     *     description="Retrieve all active users available for classroom assignment",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="List of available users",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="user_id", type="integer", example=2),
     *                 @OA\Property(property="username", type="string", example="johndoe"),
     *                 @OA\Property(property="email", type="string", example="john@example.com"),
     *                 @OA\Property(property="role", type="string", example="TA"),
     *                 @OA\Property(property="is_active", type="boolean", example=true)
     *             ))
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
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Failed to fetch available users"),
     *             @OA\Property(property="error", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function getAvailableUsers(): JsonResponse
    {
        try {
            $users = User::where('is_active', true)->get();
            
            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search for TAs by name or email.
     * 
     * @OA\Get(
     *     path="/user-management/search/tas",
     *     operationId="searchTAs",
     *     tags={"User Management"},
     *     summary="Search TAs",
     *     description="Search for Teaching Assistants by name or email",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="query",
     *         in="query",
     *         description="Search query for TA name or email",
     *         required=false,
     *         @OA\Schema(type="string", example="john")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Matching TAs",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="user_id", type="integer", example=2),
     *                 @OA\Property(property="username", type="string", example="johndoe"),
     *                 @OA\Property(property="email", type="string", example="john@example.com")
     *             ))
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
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Failed to search TAs"),
     *             @OA\Property(property="error", type="string", example="Database error")
     *         )
     *     )
     * )
     */
    public function searchTAs(Request $request): JsonResponse
    {
        try {
            $query = $request->get('query', '');
            
            if (strlen($query) < 1) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            $users = User::where('role', 'TA')
                ->where('is_active', true)
                ->where(function($q) use ($query) {
                    $q->where('username', 'like', "%{$query}%")
                      ->orWhere('email', 'like', "%{$query}%");
                })
                ->get(['user_id', 'username', 'email']);

            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search TAs',
                'error' => $e->getMessage()
            ], 500);
        }
    }


}
