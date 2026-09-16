<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ProfessorFactory extends Factory
{
    protected $model = \App\Models\Professor::class;

    public function definition()
    {
        return [
            'user_id' => function () {
                return \App\Models\User::factory()->professor()->create()->user_id;
            },
            'created_at' => now(),
        ];
    }
}