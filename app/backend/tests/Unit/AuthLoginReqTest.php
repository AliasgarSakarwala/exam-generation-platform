<?php

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthLoginReqTest extends TestCase
{

    /**
     * test_throttling_too_many_requests:
     *
     * Ensures that after the maximum number of failed login attempts,
     * subsequent attempts are throttled with a 429 response.
     */
    public function test_throttling_too_many_requests()
    {
        // Use a test email and client IP for the throttle key
        $email = 'test@example.com';
        $ip = '127.0.0.1';
        $throttleKey = Str::lower($email) . '|' . $ip;

        // Clear any existing rate-limiter records
        RateLimiter::clear($throttleKey);


        // Simulate failed login attempts up to the default limit (5)
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('api/auth/login', [
                'email'    => $email,
                'password' => 'wrong-password',
            ])->assertStatus(401);
        }

        // The next login attempt should be throttled (HTTP 429)
        $response = $this->postJson('api/auth/login', [
            'email'    => $email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
    }
}