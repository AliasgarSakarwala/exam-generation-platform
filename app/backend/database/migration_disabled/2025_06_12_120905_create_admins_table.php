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
        if (
        Schema::hasTable('admin') ||
        Schema::hasTable('admins') ){
        return;}
        Schema::create('admin', function (Blueprint $table) {
        /*  $table->unsignedBigInteger('user_id')->primary();
            $table->foreign('user_id')->references('user_id')->on('user')->onDelete('cascade');
            $table->timestamp('created_at')->useCurrent();
        */
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    /* Schema::dropIfExists('professor');*/
    }
};