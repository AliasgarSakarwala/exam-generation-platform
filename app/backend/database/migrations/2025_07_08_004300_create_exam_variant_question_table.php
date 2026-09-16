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
        Schema::create('exam_variant_question', function (Blueprint $table) {
            // Primary key
            $table->id('exam_variant_question_id');
            
            // Foreign key to exam_variant table
            $table->unsignedBigInteger('exam_variant_id');
            $table->foreign('exam_variant_id')
                  ->references('exam_variant_id')
                  ->on('exam_variant')
                  ->onDelete('cascade');
            
            // Question text
            $table->unsignedBigInteger('question_id');
            $table->text('question_text');
            
            // Question number (order in exam)
            $table->unsignedInteger('question_number');
            
            // Array of answer options
            $table->json('options')->comment('Array of answer options formatted as ["a. Answer A", "b. Answer B"]');
            
            // Array of correct option letters
            $table->json('correct_options')->comment('Array of correct option letters like ["a"] or ["a","c"]');
            
            // Whether question is mandatory
            $table->boolean('mandatory')->default(false);
            
            // Timestamps
            $table->timestamps();
            
            // Composite unique constraint
            $table->unique(['exam_variant_id', 'question_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_variant_question');
    }
};