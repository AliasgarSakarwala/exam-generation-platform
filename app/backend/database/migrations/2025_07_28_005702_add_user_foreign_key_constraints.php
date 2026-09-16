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
            // Add foreign key constraint: user_id -> user(user_id)
            $table->foreign('user_id')->references('user_id')->on('user')->onDelete('restrict');
        });

        Schema::table('question_bank', function (Blueprint $table) {
            // Add foreign key constraint: user_id -> user(user_id)
            $table->foreign('user_id')->references('user_id')->on('user')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('classroom', function (Blueprint $table) {
            // Drop the foreign key constraint on user_id
            $table->dropForeign(['user_id']);
        });

        Schema::table('question_bank', function (Blueprint $table) {
            // Drop the foreign key constraint on user_id
            $table->dropForeign(['user_id']);
        });
    }
}; 