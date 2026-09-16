<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            UserSeeder::class,
            StudentSeeder::class,
            ClassroomSeeder::class,
            // Pivot seeders will be called from ClassroomSeeder
            TaManagementSeeder::class,
        ]);
    }
}