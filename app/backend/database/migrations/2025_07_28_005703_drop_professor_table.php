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
        // Drop the professor table
        Schema::dropIfExists('professor');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the professor table
        Schema::create('professor', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->primary();
            $table->timestamp('created_at')->useCurrent();
            
            // Add foreign key constraint
            $table->foreign('user_id')->references('user_id')->on('user')->onDelete('cascade');
        });
    }
}; 