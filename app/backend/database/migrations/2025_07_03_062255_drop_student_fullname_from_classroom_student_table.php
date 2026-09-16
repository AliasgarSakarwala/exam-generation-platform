<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class DropStudentFullnameFromClassroomStudentTable extends Migration
{
    public function up()
    {
        Schema::table('classroom_student', function (Blueprint $table) {
            $table->dropColumn('student_fullname');
        });
    }

    public function down()
    {
        Schema::table('classroom_student', function (Blueprint $table) {
            $table->string('student_fullname')->nullable(false);
        });
    }
}
