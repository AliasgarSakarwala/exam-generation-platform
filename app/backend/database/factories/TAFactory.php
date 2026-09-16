<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TAFactory extends Factory
{
    protected $model = \App\Models\TA::class;

    public function definition()
    {
        return [
            'user_id' => function () {
                return \App\Models\User::factory()->ta()->create()->user_id;
            },
            'created_at' => now(),
        ];
    }
}