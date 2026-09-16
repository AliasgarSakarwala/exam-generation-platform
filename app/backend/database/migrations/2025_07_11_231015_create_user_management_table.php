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
        Schema::create('user_management', function (Blueprint $table) {
            $table->id('um_id');
            $table->unsignedBigInteger('classroom_id');
            $table->unsignedBigInteger('user_id');
            $table->string('responsibility')->nullable();
            $table->enum('status', ['archived', 'active', 'invited'])->default('invited');
            $table->timestamps();

            $table->foreign('classroom_id')->references('classroom_id')->on('classroom')->onDelete('cascade');
            $table->foreign('user_id')->references('user_id')->on('user')->onDelete('cascade');
            $table->unique(['classroom_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_management');
    }
};
