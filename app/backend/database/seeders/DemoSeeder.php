<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $professor = User::updateOrCreate(
            ['email' => 'professor@example.com'],
            [
                'role' => 'Professor',
                'username' => 'demo_professor',
                'password_hash' => Hash::make('password'),
                'status' => 'Verified',
                'is_active' => true,
                'language' => 'en',
                'mode' => 'light',
                'created_at' => now(),
                'last_updated_at' => now(),
            ]
        );

        Classroom::firstOrCreate(
            ['code' => 'COSC320', 'section' => '001', 'user_id' => $professor->user_id],
            [
                'name' => 'COSC 320 - Fall 2025',
                'description' => 'Demo classroom for local testing',
                'is_archived' => false,
                'start_date' => Carbon::today()->subDays(30),
                'end_date' => Carbon::today()->addDays(60),
                'term' => 'Fall 2025',
                'student_count' => 0,
                'class_colour' => '#3774E5',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
