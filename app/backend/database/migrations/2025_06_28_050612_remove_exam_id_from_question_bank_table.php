<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('question_bank', function (Blueprint $table) {
            $table->dropColumn('exam_id');
        });
    }

    public function down(): void {
        Schema::table('question_bank', function (Blueprint $table) {
            $table->unsignedBigInteger('exam_id')->nullable(); // or original type if known
        });
    }
};
