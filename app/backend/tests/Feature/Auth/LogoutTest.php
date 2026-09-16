<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Tests\TestCase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class LogoutTest extends TestCase
{
    public function test_authenticated_logout(): void
    {
        $uniqueId = substr(uniqid(), -6);
        $testUserId = rand(10000, 99999);
        
        // Create user directly in database like other working tests
        DB::table('user')->insert([
            'user_id' => $testUserId,
            'role' => 'Professor',
            'username' => 'test_logout_' . $uniqueId,
            'email' => 'logout_' . $uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);

        // Create authentication token using the User model
        $user = User::find($testUserId);
        $token = $user->createToken('test-token')->plainTextToken;

        // First verify the token works
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token
        ])->getJson('/api/user-data');
        
        $response->assertStatus(200);

        // Now logout
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token
        ])->postJson('/api/auth/logout');
        
        $response->assertStatus(200);

        // Clean up
        User::where('user_id', $testUserId)->delete();
    }

    public function test_protected_routes_require_auth(): void
    {
        $uniqueId = substr(uniqid(), -6);
        $testUserId = rand(10000, 99999);
        
        // Create user directly in database like other working tests
        DB::table('user')->insert([
            'user_id' => $testUserId,
            'role' => 'Professor',
            'username' => 'test_auth_' . $uniqueId,
            'email' => 'auth_' . $uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);

        // Create authentication token using the User model
        $user = User::find($testUserId);
        $token = $user->createToken('test-token')->plainTextToken;

        // Test without token
        $response = $this->getJson('/api/user-data');
        $response->assertStatus(401);

        // Test with invalid token
        $response = $this->withHeaders([
            'Authorization' => 'Bearer invalid-token'
        ])->getJson('/api/user-data');
        $response->assertStatus(401);

        // Test with valid token
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token
        ])->getJson('/api/user-data');
        
        $response->assertStatus(200)
                ->assertJsonStructure([
                    "user_id",
                    "role",
                    "username",
                    "email",
                    "password_hash",
                    "language",
                    "mode",
                    "created_at",
                    "last_updated_at",
                    "is_active",
                    "remember_token"
                ]);

        // Clean up
        User::where('user_id', $testUserId)->delete();
    }
}