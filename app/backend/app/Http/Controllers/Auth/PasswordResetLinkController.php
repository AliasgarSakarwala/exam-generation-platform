<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Validation\ValidationException;

class PasswordResetLinkController extends Controller
{
    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        // 1) validate
        $request->validate(['email' => 'required|email']);

        // 2) send the reset link
        $status = Password::sendResetLink(
            $request->only('email')
        );

        // 3) return JSON status
        return $status === Password::RESET_LINK_SENT
            ? response()->json(['status' => __($status)], 200)
            : response()->json(['status' => __($status)], 400);
    }
}
