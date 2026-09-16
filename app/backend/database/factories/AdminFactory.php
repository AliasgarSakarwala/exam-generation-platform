<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class AdminFactory extends Factory
{
    protected $model = \App\Models\Admin::class;

    public function definition()
    {
        return [
            'user_id' => function () {
                return \App\Models\User::factory()->admin()->create()->user_id;
            },
            'created_at' => now(),
        ];
    }
}