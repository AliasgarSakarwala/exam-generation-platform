<?php

namespace App\Http\Controllers\Email;

use App\Http\Controllers\Controller;
use App\Mail\InviteUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;


class EmailController extends Controller
{
    public function sendInvite(Request $request)
    {

        $user = $request->user();
        if (!($user->role === 'Admin')) {
            abort(403, 'Unauthorized');
        }

        // 1. Validate incoming payload, including the temp password
        $data = $request->validate([
            'email'         => 'required|email',
            'name'          => 'required|string',
            'temp_password' => [
                'required',
                'string',
                'min:8',
                'regex:/^[A-Za-z0-9@&*\+\-._]+$/'
            ],
        ]);

        // 2. Use the provided temp password (no need to generate one here)
        $tempPassword = $data['temp_password'];

        // 4. Generate & persist a one-time invite token
        // e.g. Invite::create([
        //     'user_id'    => $user->id,
        //     'token'      => $token,
        //     'expires_at' => now()->addDays(3),
        // ]);

        // 5. Navigate to the login page
        $inviteUrl = config('app.FRONTEND_URL', 'http://localhost:3000')
                   .'/auth/login';

        // 6. Queue the InviteUser mailable
        Mail::to($data['email'])
            ->queue(new InviteUser(
                $data['name'],
                auth()->user()->username ?? 'An Administrator',
                $inviteUrl,
                $tempPassword
            ));

        return response()->json([
            'message' => 'Invitation sent to '.$data['email']
        ], 201);
    }

}
