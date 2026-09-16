<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ClassroomSeeder extends Seeder
{
    // Valid enrollment statuses from your database CHECK constraint
    private $enrollmentStatuses = ['Active', 'Dropped', 'Completed'];

    public function run()
    {
        // Get all professors (users with Professor role)
        $professors = User::where('role', 'Professor')->get();

        // Create classrooms for each professor
        $professors->each(function ($professor) {
            // Each professor will have 1-5 classrooms
            $classroomCount = rand(1, 5);
            
            Classroom::factory()
                ->count($classroomCount)
                ->create(['user_id' => $professor->user_id])
                ->each(function ($classroom) {
                    // Attach 1-3 TAs to each classroom
                    $this->attachTAs($classroom);
                    
                    // Enroll 5-30 students in each classroom
                    $this->enrollStudents($classroom);
                });
        });

        // Create some archived classrooms
        Classroom::factory()
            ->count(10)
            ->archived()
            ->create()
            ->each(function ($classroom) {
                $this->attachTAs($classroom);
                $this->enrollStudents($classroom);
            });
    }

    protected function attachTAs($classroom)
    {
        $taCount = rand(1, 3);
        $tas = \App\Models\TA::inRandomOrder()->limit($taCount)->get();
        
        $attachments = [];
        foreach ($tas as $ta) {
            $attachments[$ta->user_id] = [
                'assigned_at' => Carbon::now()->subDays(rand(1, 30))
            ];
        }
        
        // Use syncWithoutDetaching to avoid duplicates
        $classroom->teachingAssistants()->syncWithoutDetaching($attachments);
    }

    protected function enrollStudents($classroom)
    {
        $maxStudents = $classroom->max_students ?? 30;
        $studentCount = rand(5, min(30, $maxStudents));
        $students = \App\Models\Student::inRandomOrder()->limit($studentCount)->get();
        
        $enrollmentData = [];
        $now = Carbon::now();
        
        foreach ($students as $student) {
            $enrollmentData[$student->student_id] = [
                'enrolled_at' => $now->subDays(rand(1, 30)),
                // Only use valid enrollment statuses from CHECK constraint
                'enrollment_status' => $this->enrollmentStatuses[array_rand($this->enrollmentStatuses)]
            ];
        }
        
        // Use syncWithoutDetaching to avoid duplicates
        $classroom->students()->syncWithoutDetaching($enrollmentData);
        
        // Update the current student count
        $classroom->update(['current_student_count' => count($enrollmentData)]);
    }
}