<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run()
    {
        // Create admins
        \App\Models\User::factory()
            ->count(3)
            ->admin()
            ->create();

        // Create professors
        \App\Models\User::factory()
            ->count(10)
            ->professor()
            ->create();

        // Create TAs
        \App\Models\User::factory()
            ->count(20)
            ->ta()
            ->create();
    }
}