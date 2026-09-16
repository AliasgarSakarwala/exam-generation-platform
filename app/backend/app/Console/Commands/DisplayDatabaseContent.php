<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User; // For Laravel's default User model
use Illuminate\Support\Facades\DB; // For direct SQL queries (if needed)

class DisplayDatabaseContent extends Command
{
    protected $signature = 'breeze';
    protected $description = 'Display database content (Users, Exams, Students)';

    public function handle()
    {
        // Display Users
        $this->info('=== Users ===');
        $users = DB::table('User')->get();
        $this->table(
            ['ID', 'Role', 'Username', 'Email'],
            $users->map(function ($user) {
                return [
                    $user->userID,
                    $user->role,
                    $user->username,
                    $user->email
                ];
            })
        );

        // Display Exams
        $this->info('=== Exams ===');
        $exams = DB::table('Exam')->get();
        $this->table(
            ['ID', 'Title', 'Questions', 'Class ID'],
            $exams->map(function ($exam) {
                return [
                    $exam->examID,
                    $exam->title,
                    $exam->numOfQuestions,
                    $exam->classID
                ];
            })
        );

        // Display Students
        $this->info('=== Students ===');
        $students = DB::table('Student')->get();
        $this->table(
            ['ID', 'Name'],
            $students->map(function ($student) {
                return [
                    $student->studentID,
                    $student->studentName
                ];
            })
        );

        return 0;
    }
}