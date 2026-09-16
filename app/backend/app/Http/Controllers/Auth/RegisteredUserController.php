<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class RegisteredUserController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        // 1) Pre‑check for existing user
        if (User::where('email', $request->input('email'))->exists()) {
            return response()->json([
                'message' => 'A user with this email already exists.',
            ], Response::HTTP_CONFLICT); // 409
        }

        // 2) Now run your normal validation
        $data = $request->validate([
            'username' => 'required|string|max:255',
            'role'     => 'required|string|in:Professor,TA,Admin|max:255',
            'email'    => 'required|email|unique:user,email',
            'password' => 'required|confirmed|min:8',
            'status'   => 'required|string|in:Invited,Verified,Deactivated|max:255',
        ]);

        // 3) Create the new user
        $user = User::create([
            'username'      => $data['username'],
            'email'         => $data['email'],
            'password_hash' => bcrypt($data['password']),
            'role'          => $data['role'],
            'status'        => $data['status'],
        ]);

        // 4) Issue token and return 201
        $token = $user->createToken('app-token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], Response::HTTP_CREATED);
    }
}