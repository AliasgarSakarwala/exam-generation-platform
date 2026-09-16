<?php

namespace Tests\Unit;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserSettingsTest extends TestCase
{
    /**
     * Track the users created in a given test so we can delete
     * only those rows in tearDown().
     */
    protected array $createdUsers = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->createdUsers = [];
    }

    /**
     * Factory + Sanctum helper.
     */
    private function actingUser(): User
    {
        $user = User::factory()->create([
            'password_hash' => Hash::make('oldPassword123'),
            'email'         => 'original@example.com',
            'username'      => 'original_user',
        ]);

        $this->createdUsers[] = $user->user_id;

        Sanctum::actingAs($user);

        return $user;
    }

    /* ──────────────────────────────────────────────────────────────
     |  update() endpoint tests
     ────────────────────────────────────────────────────────────── */

    public function test_profile_update_success(): void
    {
        $user = $this->actingUser();

        $payload = [
            'username'  => 'new_username',
            'email'     => 'new@example.com',
            'language'  => 'fr',
            'mode'      => 'dark',
            'is_active' => false,
        ];

        $response = $this->patchJson('/api/user/update', $payload);

        $response->assertStatus(200)
                 ->assertJsonPath('user.username', 'new_username')
                 ->assertJsonPath('user.email', 'new@example.com');

        $this->assertDatabaseHas($user->getTable(), [
            'user_id' => $user->user_id,
            'email'   => 'new@example.com',
        ]);
    }

    public function test_profile_update_partial_success(): void
    {
        $this->actingUser();

        $response = $this->patchJson('/api/user/update', ['language' => 'es']);

        $response->assertOk()
                 ->assertJsonPath('user.language', 'es');
    }

    public function test_profile_update_invalid_email_format(): void
    {
        $this->actingUser();

        $response = $this->patchJson('/api/user/update', ['email' => 'bad-email']);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('email');
    }

    public function test_profile_update_email_already_taken(): void
    {
        $taken = User::factory()->create(['email' => 'taken@example.com']);
        $this->createdUsers[] = $taken->user_id;

        $this->actingUser();

        $response = $this->patchJson('/api/user/update', ['email' => 'taken@example.com']);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('email');
    }

    public function test_profile_update_username_too_long(): void
    {
        $this->actingUser();

        $response = $this->patchJson('/api/user/update', [
            'username' => str_repeat('a', 256),
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('username');
    }

    public function test_profile_update_language_invalid(): void
    {
        $this->actingUser();

        $response = $this->patchJson('/api/user/update', ['language' => 'eng']);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('language');
    }

    public function test_profile_update_mode_invalid(): void
    {
        $this->actingUser();

        $response = $this->patchJson('/api/user/update', ['mode' => 'blue']);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('mode');
    }

    public function test_profile_update_is_active_not_boolean(): void
    {
        $this->actingUser();

        $response = $this->patchJson('/api/user/update', ['is_active' => 'yes']);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('is_active');
    }

    public function test_profile_update_empty_payload_ok(): void
    {
        $this->actingUser();

        $response = $this->patchJson('/api/user/update', []);

        $response->assertOk();
    }

    public function test_profile_update_unauthorized(): void
    {
        $response = $this->patchJson('/api/user/update', []);

        $response->assertStatus(401);
    }

    /* ──────────────────────────────────────────────────────────────
     |  changePassword() endpoint tests
     ────────────────────────────────────────────────────────────── */

    public function test_change_password_success(): void
    {
        $user = $this->actingUser();

        $payload = [
            'current_password'          => 'oldPassword123',
            'new_password'              => 'newPassword456',
            'new_password_confirmation' => 'newPassword456',
        ];

        $response = $this->postJson('/api/user/change-password', $payload);

        $response->assertOk()
                 ->assertJsonPath('message', 'Password changed successfully.');

        $this->assertTrue(
            Hash::check('newPassword456', $user->fresh()->password_hash)
        );
    }

    public function test_change_password_wrong_current(): void
    {
        $this->actingUser();

        $response = $this->postJson('/api/user/change-password', [
            'current_password'          => 'wrongPassword',
            'new_password'              => 'newPassword456',
            'new_password_confirmation' => 'newPassword456',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('current_password');
    }

    public function test_change_password_missing_current(): void
    {
        $this->actingUser();

        $response = $this->postJson('/api/user/change-password', [
            'new_password'              => 'newPassword456',
            'new_password_confirmation' => 'newPassword456',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('current_password');
    }

    public function test_change_password_missing_new_password(): void
    {
        $this->actingUser();

        $response = $this->postJson('/api/user/change-password', [
            'current_password' => 'oldPassword123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('new_password');
    }

    public function test_change_password_too_short(): void
    {
        $this->actingUser();

        $response = $this->postJson('/api/user/change-password', [
            'current_password'          => 'oldPassword123',
            'new_password'              => 'short',
            'new_password_confirmation' => 'short',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('new_password');
    }

    public function test_change_password_confirmation_mismatch(): void
    {
        $this->actingUser();

        $response = $this->postJson('/api/user/change-password', [
            'current_password'          => 'oldPassword123',
            'new_password'              => 'newPassword456',
            'new_password_confirmation' => 'different',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('new_password');
    }

    public function test_change_password_unauthorized(): void
    {
        $response = $this->postJson('/api/user/change-password', []);

        $response->assertStatus(401);
    }

    /* ──────────────────────────────────────────────────────────────
     |  Tear-down
     ────────────────────────────────────────────────────────────── */

    protected function tearDown(): void
    {
        if (!empty($this->createdUsers)) {
            User::whereIn('user_id', $this->createdUsers)->delete();
        }
        parent::tearDown();
    }
}