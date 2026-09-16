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
        Schema::create('exam_weight', function (Blueprint $table) {
            $table->id('weight_id'); // Primary key
            $table->unsignedBigInteger('classroom_id'); // Foreign key to classroom
            $table->unsignedBigInteger('exam_id'); // Foreign key to exam
            $table->unsignedInteger('weight'); // The weight value
            
            // Foreign key constraints - make sure these match your actual column names
            $table->foreign('classroom_id')
                  ->references('classroom_id') // Change this to match your classroom table's PK
                  ->on('classroom')
                  ->onDelete('cascade');
                  
            $table->foreign('exam_id')
                  ->references('exam_id') // Change this to match your exam table's PK
                  ->on('exam')
                  ->onDelete('cascade');
                  
            // Unique constraint
            $table->unique(['classroom_id', 'exam_id']);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_weight');
    }
};