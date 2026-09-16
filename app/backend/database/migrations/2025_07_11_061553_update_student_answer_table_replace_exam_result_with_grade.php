<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateStudentAnswerTableReplaceExamResultWithGrade extends Migration
{
    public function up()
    {
        Schema::table('student_answer', function (Blueprint $table) {
            // 1) Drop the old column
            $table->dropColumn('exam_result_id');

            // 2) Add the new grade_id column
            $table->unsignedBigInteger('grade_id')->after('question_id');

            // 3) Add the FK constraint to grade.grade_id
            $table
                ->foreign('grade_id')
                ->references('grade_id')
                ->on('grade')
                ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::table('student_answer', function (Blueprint $table) {
            // 1) Drop the grade FK + column
            $table->dropForeign(['grade_id']);
            $table->dropColumn('grade_id');

            // 2) Re-create exam_result_id
            $table->unsignedBigInteger('exam_result_id')->after('question_id');

            // 3) Re-add its FK back to exam_result.exam_result_id
            $table
                ->foreign('exam_result_id')
                ->references('exam_result_id')
                ->on('exam_result')
                ->onDelete('cascade');
        });
    }
}
