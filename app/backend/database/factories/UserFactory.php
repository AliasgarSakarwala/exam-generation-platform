<?php

namespace Database\Factories;

use App\Models\Admin;
use App\Models\TA;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition()
    {
        return [
            'role' => $this->faker->randomElement(['Professor', 'TA', 'Admin']),
            'username' => $this->faker->unique()->userName,
            'email' => $this->faker->unique()->safeEmail,
            'password_hash' => bcrypt('password'),
            'language' => $this->faker->randomElement(['en', 'es', 'fr', 'ar']),
            'mode' => $this->faker->randomElement(['light', 'dark']),
            'is_active' => $this->faker->randomElement([false, true]),
            'created_at' => now(),
            'last_updated_at' => now(),
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (User $user) {
            match($user->role) {
                'TA' => TA::create(['user_id' => $user->user_id]),
                'Admin' => Admin::create(['user_id' => $user->user_id]),
                default => null,
            };
        });
    }

    public function professor()
    {
        return $this->state(function (array $attributes) {
            return ['role' => 'Professor'];
        });
    }

    public function ta()
    {
        return $this->state(function (array $attributes) {
            return ['role' => 'TA'];
        });
    }

    public function admin()
    {
        return $this->state(function (array $attributes) {
            return ['role' => 'Admin'];
        });
    }
}