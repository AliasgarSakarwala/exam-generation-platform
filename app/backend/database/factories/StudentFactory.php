<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class StudentFactory extends Factory
{
    protected $model = \App\Models\Student::class;

    public function definition()
    {
        return [
            'student_id' => $this->faker->unique()->numberBetween(10000, 99999),
            'first_name' => $this->faker->firstName,
            'last_name' => $this->faker->lastName,
            'preferred_name' => $this->faker->optional(0.3)->firstName, // 30% chance of having a preferred name
            'created_at' => $this->faker->dateTimeBetween('-2 years', 'now'),
        ];
    }

}