<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('user', function (Blueprint $table) {
            // Pick the right default expression for your DB:
            // Postgres/SQLite: '[]'
            // MySQL 8.0.13+: JSON_ARRAY()
            $table->json('comp_tutorial_pages')
                  ->default(DB::raw("('[]')"))   // swap to DB::raw('JSON_ARRAY()') for MySQL 8+
                  ->after('mode');
        });

        // Backfill existing NULLs just in case
        DB::table('user')
            ->whereNull('comp_tutorial_pages')
            ->update(['comp_tutorial_pages' => json_encode([])]);
    }

    public function down(): void
    {
        Schema::table('user', function (Blueprint $table) {
            $table->dropColumn('comp_tutorial_pages');
        });
    }
};
