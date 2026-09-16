<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (
        Schema::hasTable('classroom_ta') ||
        Schema::hasTable('classroom_tas') ){
        return;}
        Schema::create('classroom_ta', function (Blueprint $table) {
        /*    $table->unsignedBigInteger('classroom_id');
            $table->unsignedBigInteger('ta_id');
            $table->timestamp('assigned_at')->useCurrent();
            
            $table->primary(['classroom_id', 'ta_id']);
            
            $table->foreign('classroom_id')
                ->references('classroom_id')
                ->on('classroom')
                ->onDelete('cascade');

            $table->foreign('ta_id')
                ->references('user_id')
                ->on('ta')
                ->onDelete('cascade');
                */   
        });
    }

    public function down()
    {
    //    Schema::dropIfExists('classroom_ta');
    }
};