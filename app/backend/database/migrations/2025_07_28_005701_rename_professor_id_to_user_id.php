<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('classroom', function (Blueprint $table) {
            // Rename professor_id column to user_id
            $table->renameColumn('professor_id', 'user_id');
        });

        Schema::table('question_bank', function (Blueprint $table) {
            // Rename professor_id column to user_id
            $table->renameColumn('professor_id', 'user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('classroom', function (Blueprint $table) {
            // Rename user_id column back to professor_id
            $table->renameColumn('user_id', 'professor_id');
        });

        Schema::table('question_bank', function (Blueprint $table) {
            // Rename user_id column back to professor_id
            $table->renameColumn('user_id', 'professor_id');
        });
    }
}; 