<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateGradeTableAddExamVariant extends Migration
{
    public function up()
    {
        Schema::table('grade', function (Blueprint $table) {
            // 1) Drop the old exam_stat_id FK & column (if you have a foreign key)
            $table->dropColumn('exam_stat_id');

            // 2) Add the new exam_variant_id column
            $table->unsignedBigInteger('exam_variant_id')->after('grade_id');

            // 3) Add FK constraint to exam_variant
            $table
                ->foreign('exam_variant_id')
                ->references('exam_variant_id')
                ->on('exam_variant')
                ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::table('grade', function (Blueprint $table) {
            // 1) Drop the exam_variant FK & column
            $table->dropForeign(['exam_variant_id']);
            $table->dropColumn('exam_variant_id');

            // 2) Re-create exam_stat_id as it was before
            $table->unsignedBigInteger('exam_stat_id')->after('grade_id');

            // 3) Re-add its FK (adjust table/name if needed)
            $table
                ->foreign('exam_stat_id')
                ->references('exam_stat_id')
                ->on('exam_stat')
                ->onDelete('cascade');
        });
    }
}