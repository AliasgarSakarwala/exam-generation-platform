<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    public function run()
    {
        \App\Models\Student::factory()
            ->count(200)
            ->create();
    }
}