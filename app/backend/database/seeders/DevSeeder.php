<?php

namespace Database\Seeders;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DevSeeder extends Seeder
{
    private $enrollmentStatuses = ['Active', 'Dropped', 'Completed'];

    public function run()
    {
        $this->call(DemoSeeder::class);

        // Generate unique test identifiers
        $testSuffix = Str::random(6); // e.g. "x7j9k2"
        $testPrefix = 'test' . $testSuffix;

        // Create a test admin
        $admin = User::firstOrCreate(
            ['email' => $testPrefix . '_admin@example.com'],
            [
                'role' => 'Admin',
                'username' => $testPrefix . '_admin',
                'password_hash' => bcrypt('password'),
                'is_active' => true,
                'language' => 'en',
                'mode' => 'light',
                'created_at' => now(),
                'last_updated_at' => now()
            ]
        );
        \App\Models\Admin::firstOrCreate(['user_id' => $admin->user_id]);

        // Create a test professor
        $professor = User::firstOrCreate(
            ['email' => $testPrefix . '_professor@example.com'],
            [
                'role' => 'Professor',
                'username' => $testPrefix . '_professor',
                'password_hash' => bcrypt('password'),
                'is_active' => true,
                'language' => 'en',
                'mode' => 'light',
                'created_at' => now(),
                'last_updated_at' => now()
            ]
        );
        // Professor model removed, no need to create professor record

        // Create a test TA
        $ta = User::firstOrCreate(
            ['email' => $testPrefix . '_ta@example.com'],
            [
                'role' => 'TA',
                'username' => $testPrefix . '_ta',
                'password_hash' => bcrypt('password'),
                'is_active' => true,
                'language' => 'en',
                'mode' => 'light',
                'created_at' => now(),
                'last_updated_at' => now()
            ]
        );
        \App\Models\TA::firstOrCreate(['user_id' => $ta->user_id]);

        // Create or get test classroom
        $classroom = \App\Models\Classroom::firstOrCreate(
            ['code' => $testPrefix . '_101'],
            [
                'user_id' => $professor->user_id,
                'name' => $testPrefix . ' Classroom',
                'description' => 'Development test classroom',
                'is_archived' => false,
                
                'end_date' => Carbon::today()->addDays(90),
                
                'student_count' => 0,
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        // Attach TA if not already attached
        if (!$classroom->teachingAssistants()->where('user_id', $ta->user_id)->exists()) {
            $classroom->teachingAssistants()->attach($ta->user_id, [
                'assigned_at' => Carbon::now()->subDays(15)
            ]);
        }

        // Create or get test students if needed
        if ($classroom->students()->count() < 10) {
            $students = \App\Models\Student::factory()
                ->count(10 - $classroom->students()->count())
                ->create(['is_active' => true]);
            
            $enrollmentData = [];
            foreach ($students as $student) {
                $enrollmentData[$student->student_id] = [
                    'enrolled_at' => Carbon::now()->subDays(rand(1, 30)),
                    'enrollment_status' => 'Active'
                ];
            }
            
            $classroom->students()->syncWithoutDetaching($enrollmentData);
            $classroom->update(['student_count' => $classroom->students()->count()]);
        }
    }
}