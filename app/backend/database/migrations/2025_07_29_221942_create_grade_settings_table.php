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
        Schema::create('grade_settings', function (Blueprint $table) {
            $table->id('grade_settings_id');
            $table->unsignedBigInteger('exam_id');
            $table->integer('high_grade_threshold')->default(80);
            $table->integer('medium_grade_threshold')->default(50);
            $table->integer('low_grade_threshold')->default(0);
            $table->string('high_grade_color', 7)->default('#10B981'); // hex color
            $table->string('medium_grade_color', 7)->default('#F59E0B'); // hex color
            $table->string('low_grade_color', 7)->default('#EF4444'); // hex color
            $table->boolean('anonymous_student_names')->default(false);
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('exam_id')
                ->references('exam_id')
                ->on('exam')
                ->onDelete('cascade');

            // Unique constraint - one settings per exam
            $table->unique('exam_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grade_settings');
    }
};
