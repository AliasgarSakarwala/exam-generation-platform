<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ClassroomFactory extends Factory
{
    protected $model = \App\Models\Classroom::class;

    public function definition()
    {
        $startDate = $this->faker->dateTimeBetween('-1 year', '+1 year');
        $endDate = $this->faker->dateTimeBetween($startDate, '+1 year');

        return [
            'name' => $this->faker->words(3, true) . ' Class',
            'code' => strtoupper($this->faker->bothify('??###')),
            'description' => $this->faker->paragraph,
            'user_id' => \App\Models\User::factory()->professor(),
            'is_archived' => $this->faker->boolean(20),
            
            'end_date' => $endDate,
            
            'student_count' => 0, // Will be updated when students are added
            'created_at' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'updated_at' => function (array $attributes) {
                return $this->faker->optional(0.8)->dateTimeBetween($attributes['created_at'], 'now');
            },
        ];
    }

    public function archived()
    {
        return $this->state(function (array $attributes) {
            return [
                'is_archived' => true,
            ];
        });
    }

    public function active()
    {
        return $this->state(function (array $attributes) {
            return [
                'is_archived' => false,
                'start_date' => $this->faker->dateTimeBetween('-6 months', 'now'),
                'end_date' => $this->faker->dateTimeBetween('now', '+6 months'),
            ];
        });
    }


}