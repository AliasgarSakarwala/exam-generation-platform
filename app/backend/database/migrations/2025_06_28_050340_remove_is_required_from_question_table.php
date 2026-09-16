<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('question', function (Blueprint $table) {
            $table->dropColumn('is_required');
        });
    }

    public function down(): void {
        Schema::table('question', function (Blueprint $table) {
            $table->boolean('is_required')->default(false); // or whatever the original type/default was
        });
    }
};

