<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (
        Schema::hasTable('students') ||
        Schema::hasTable('student') ){
        return;}
        Schema::create('student', function (Blueprint $table) {
        /*   $table->integer('student_id')->primary();
            $table->string('first_name', 50)->nullable(false);
            $table->string('last_name', 50)->nullable(false);
            $table->timestamp('created_at')->useCurrent();
            */
        });
    }

    public function down()
    {
    //    Schema::dropIfExists('student');
    }
};
