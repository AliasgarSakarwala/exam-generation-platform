<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (
        Schema::hasTable('classrooms') ||
        Schema::hasTable('classroom') ){
        return;}
        Schema::create('classroom', function (Blueprint $table) {
        /*    $table->id('classroom_id');
            $table->string('name', 100)->nullable(false);
            $table->string('code', 20)->unique()->nullable(false);
            $table->text('description')->nullable();
            $table->unsignedBigInteger('professor_id')->nullable(false);
            $table->boolean('is_archived')->default(false);
            $table->date('end_date')->nullable(false);
            $table->integer('max_students')->nullable();
            $table->integer('current_student_count')->default(0);
            $table->timestamps();
            
            $table->foreign('professor_id')
                ->references('user_id')
                ->on('professor')
                ->onDelete('restrict');
        */
        });
    }

    public function down()
    {
    //    Schema::dropIfExists('classroom');
    }
};