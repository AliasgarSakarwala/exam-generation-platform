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
        Schema::table('user_management', function (Blueprint $table) {
            $table->string('full_name')->nullable();
            $table->boolean('view_grades')->default(false);
            $table->boolean('manage_assignments')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_management', function (Blueprint $table) {
            $table->dropColumn(['full_name', 'view_grades', 'manage_assignments']);
        });
    }
};
