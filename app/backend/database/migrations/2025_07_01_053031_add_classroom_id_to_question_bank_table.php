<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddClassroomIdToQuestionBankTable extends Migration
{
    public function up()
    {
        Schema::table('question_bank', function (Blueprint $table) {
            // 1) add the column (nullable if you have existing rows)
            $table->unsignedBigInteger('classroom_id')->nullable()->after('professor_id');

            // 2) add the FK constraint
            $table->foreign('classroom_id')
                  ->references('classroom_id')->on('classroom')
                  ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::table('question_bank', function (Blueprint $table) {
            // drop the FK first
            $table->dropForeign(['classroom_id']);

            // then drop the column
            $table->dropColumn('classroom_id');
        });
    }
}

