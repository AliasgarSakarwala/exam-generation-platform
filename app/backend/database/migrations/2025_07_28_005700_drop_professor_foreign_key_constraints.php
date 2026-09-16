<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop foreign key constraints using raw SQL to specify exact constraint names
        DB::statement('ALTER TABLE classroom DROP CONSTRAINT IF EXISTS classroom_professor_id_fkey');
        DB::statement('ALTER TABLE question_bank DROP CONSTRAINT IF EXISTS question_bank_professor_id_foreign');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('classroom', function (Blueprint $table) {
            // Re-add the foreign key constraint on professor_id
            $table->foreign('professor_id')->references('user_id')->on('professor')->onDelete('restrict');
        });

        Schema::table('question_bank', function (Blueprint $table) {
            // Re-add the foreign key constraint on professor_id
            $table->foreign('professor_id')->references('user_id')->on('professor')->onDelete('restrict');
        });
    }
}; 