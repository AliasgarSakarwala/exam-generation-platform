<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        DB::table('tag')->insert([
            ['name' => 'Easy', 'created_at' => now()],
            ['name' => 'Medium', 'created_at' => now()],
            ['name' => 'Hard', 'created_at' => now()],
        ]);
    }

    public function down(): void {
        DB::table('tag')->whereIn('name', ['Easy', 'Medium', 'Hard'])->delete();
    }
};

