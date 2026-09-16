<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AlterStudentAnswerDropQuestionIdAddExamVariantQuestionId extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('student_answer', function (Blueprint $table) {
            $table->dropColumn('question_id');

            $table->unsignedBigInteger('exam_variant_question_id')
                  ->after('student_answer_id');

            $table->foreign('exam_variant_question_id')
                  ->references('exam_variant_question_id')
                  ->on('exam_variant_question')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_answer', function (Blueprint $table) {
            // 1) drop the new FK and column
            $table->dropForeign(['exam_variant_question_id']);
            $table->dropColumn('exam_variant_question_id');

            // 2) restore the old question_id column
            $table->unsignedBigInteger('question_id')
                  ->after('student_answer_id');

            // 3) re-add its foreign key back to question.question_id
            $table->foreign('question_id')
                  ->references('question_id')
                  ->on('question')
                  ->onDelete('cascade');
        });
    }
}
