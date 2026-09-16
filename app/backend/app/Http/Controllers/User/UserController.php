<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use App\Models\Classroom;
use App\Models\User;  
use Illuminate\Validation\ValidationException;


/**
 * @OA\Tag(
 *     name="Users",
 *     description="User profile and account management endpoints"
 * )
 */
class UserController extends Controller
{
    /**
     * Update user profile information
     * 
     * @OA\Patch(
     *     path="/user/profile",
     *     operationId="updateUserProfile",
     *     tags={"Users"},
     *     summary="Update user profile",
     *     description="Update user profile information including username, email, language, mode, and tutorial completion status",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="username", type="string", example="john_doe", description="Username"),
     *             @OA\Property(property="email", type="string", format="email", example="john@example.com", description="Email address"),
     *             @OA\Property(property="language", type="string", example="en", description="Language preference (2-letter code)"),
     *             @OA\Property(property="mode", type="string", enum={"light", "dark"}, example="dark", description="Theme mode preference"),
     *             @OA\Property(property="is_active", type="boolean", example=true, description="Account active status"),
     *             @OA\Property(property="comp_tutorial_page", type="string", example="course", description="Completed tutorial page to append to user's tutorial progress")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Profile updated successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="message", type="string", example="Profile updated successfully."),
     *             @OA\Property(property="user", type="object",
     *                 @OA\Property(property="user_id", type="integer", example=1),
     *                 @OA\Property(property="username", type="string", example="john_doe"),
     *                 @OA\Property(property="email", type="string", example="john@example.com"),
     *                 @OA\Property(property="language", type="string", example="en"),
     *                 @OA\Property(property="mode", type="string", example="dark"),
     *                 @OA\Property(property="is_active", type="boolean", example=true),
     *                 @OA\Property(property="comp_tutorial_pages", type="array", @OA\Items(type="string"), example={"course", "exam"}),
     *                 @OA\Property(property="role", type="string", example="Professor"),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="errors", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Unauthenticated")
     *         )
     *     )
     * )
     */
    public function changePassword(Request $request)
    {
        $user = $request->user(); // Authenticated user via sanctum

        // 1) Validate input
        $request->validate([
            'current_password'      => ['required', 'string'],
            'new_password'          => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // 2) Check that the given current password matches
        if (! Hash::check($request->input('current_password'), $user->password_hash)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided password does not match your current password.'],
            ]);
        }

        // 3) Update to the new password
        $user->password_hash = Hash::make($request->input('new_password'));
        $user->status = 'Verified';
        $user->save();

        // (Optional) Invalidate other tokens if you want:
        // $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return response()->json([
            'message' => 'Password changed successfully.',
            'user'    => $request->user(),
        ], 200);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        // Validate only what's sent
        $rules = [
            'username'              => ['string','max:255'],
            'email'                 => ['email','max:255', Rule::unique('user','email')->ignore($user->user_id, 'user_id')],
            'language'              => ['string','max:2'],
            'mode'                  => ['in:light,dark'],
            'is_active'             => ['boolean'],
            'comp_tutorial_page'    => ['string','max:255'],   // single item to append
        ];

        $data      = $request->only(array_keys($rules));
        $validated = $request->validate(array_intersect_key($rules, $data));

        // Append one string to the array column
        if ($request->filled('comp_tutorial_page')) {
            $current = $user->comp_tutorial_pages ?? [];
            $newVal  = $validated['comp_tutorial_page'];

            // avoid dupes
            if (!in_array($newVal, $current, true)) {
                $current[] = $newVal;
                $user->comp_tutorial_pages = $current;
            }
        }

        // Fill scalars (everything except the single append key)
        $user->fill(Arr::except($validated, ['comp_tutorial_page']));
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user'    => $user,
        ], 200);
    }

    /**
     * Delete user account
     * 
     * @OA\Delete(
     *     path="/user/account/{id}",
     *     operationId="deleteUserAccount",
     *     tags={"Users"},
     *     summary="Delete user account",
     *     description="Delete a user account and all associated data. Only the account owner or admin can delete accounts.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="User ID to delete",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Account deleted successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="message", type="string", example="Account deleted successfully"),
     *             @OA\Property(property="deleted_user_id", type="integer", example=1)
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - User not authorized to delete this account",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="You can only delete your own account or must be an admin")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="User not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="User not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to delete account")
     *         )
     *     )
     * )
     */
    public function destroy(Request $request, $id)
    {
        $deleteUser = User::find($id);
        $user = $request->user();
        // 1. Ensure they're deleting their own account
        if ((int) $user->user_id !== (int) $id && $user->role !== 'Admin') {
            return response()->json(['message' => 'Forbidden', 'error' => true], 403);
        }

        DB::transaction(function () use ($request, $deleteUser) {
            $user = $request->user();

            // If this user has classrooms, delete them first
            if ($deleteUser->role === 'Professor' || $user->role === 'Admin') {
                Classroom::where('user_id', $deleteUser->user_id)->delete();
            }

            // Revoke all personal access tokens
            $deleteUser->tokens()->delete();

            // Finally delete the user
            $deleteUser->delete();
        });

        // Return 204 No Content
        return response()->json(['message' => 'Deleted Successfully', 'error' => false], 200);
    }
}