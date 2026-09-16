<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (
        Schema::hasTable('classroom_students') ||
        Schema::hasTable('classroom_student') ){
        return;}
        Schema::create('classroom_student', function (Blueprint $table) {
        /*    $table->unsignedBigInteger('classroom_id');
            $table->integer('student_id');
            $table->timestamp('enrolled_at')->useCurrent();
            $table->enum('enrollment_status', ['Active', 'Dropped', 'Completed'])->default('Active');
            
            $table->primary(['classroom_id', 'student_id']);
            
            $table->foreign('classroom_id')
                ->references('classroom_id')
                ->on('classroom')
                ->onDelete('cascade');

            $table->foreign('student_id')
                ->references('student_id')
                ->on('student')
                ->onDelete('cascade');
                */
        });
    }

    public function down()
    {
    //    Schema::dropIfExists('classroom_student');
    }
};