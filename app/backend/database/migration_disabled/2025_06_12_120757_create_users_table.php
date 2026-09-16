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
    Schema::hasTable('users') ||
    Schema::hasTable('user') ||
    Schema::hasTable('User')) {
    return;}
    
    /* Schema::create('user', function (Blueprint $table) {
            $table->id('user_id');
            $table->enum('role', ['Professor', 'TA', 'Admin'])->default('Admin');
            $table->string('username', 50)->unique();
            $table->string('email', 100)->unique();
            $table->string('password_hash');
            $table->timestamps();
            $table->boolean('is_active')->default(true);
        });*/
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //Schema::dropIfExists('user');
    }
};
