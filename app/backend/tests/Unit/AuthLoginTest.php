<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;

class AuthLoginTest extends TestCase
{

    /**
     * test_user_login_success:
     * 1) Create a user with a known password.
     * 2) Send POST /login with correct credentials.
     * 3) Assert 200 status and that JSON has a 'token'.
     */
    public function test_user_login_success()
    {
        // 1) Create user with bcrypt-hashed password
        $plainPassword = 'password123';
        $user = User::factory()->create([
            'password_hash' => bcrypt($plainPassword),
        ]);

        // 2) Attempt login
        $response = $this->postJson('api/auth/login', [
            'email'    => $user->email,
            'password' => $plainPassword,
        ]);

        // 3) Assert status and token key
        $response->assertStatus(200)
                 ->assertJsonStructure(['token']);
    }

    /**
     * test_login_invalid_credentials:
     * - Wrong password for existing user.
     * - Non-existent email.
     * Both should return 401 with the auth.failed message.
     */
    public function test_login_invalid_credentials()
    {
        // Create a user with a known password
        $user = User::factory()->create([
            'password_hash' => bcrypt('correct-password'),
        ]);

        // 1) Wrong password
        $wrongPassResponse = $this->postJson('api/auth/login', [
            'email'    => $user->email,
            'password' => 'wrong-password',
        ]);
        $wrongPassResponse->assertStatus(401)
                          ->assertJson([
                              'message' => 'Invalid credentials',
                          ]);

        // 2) Non-existent email
        $noUserResponse = $this->postJson('api/auth/login', [
            'email'    => 'noone@example.com',
            'password' => 'whatever',
        ]);
        $noUserResponse->assertStatus(401)
                       ->assertJson([
                           'message' => 'Invalid credentials',
                       ]);
    }
    public function test_user_logout_success()
    {
        // 1) Create user and token
        $user = User::factory()->create();
        $token = $user->createToken('app-token')->plainTextToken;

        // 2) Call logout endpoint with Bearer token
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept'        => 'application/json',
        ])->postJson('api/auth/logout');

        // 3) Assert successful logout
        $response->assertStatus(200)
                 ->assertJson(['message' => 'Logged out']);

        // 4) Token should be removed
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);
    }

    /**
     * test_logout_requires_authentication:
     * Calling logout without a token should return 401.
     */
    public function test_logout_requires_authentication()
    {
        $response = $this->postJson('api/auth/logout');
        $response->assertStatus(401);
    }
}