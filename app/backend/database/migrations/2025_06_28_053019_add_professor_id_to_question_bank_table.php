<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('question_bank', function (Blueprint $table) {
            $table->unsignedBigInteger('professor_id')->after('question_bank_id');

            // Reference user_id in the users table and cascade delete
            $table->foreign('professor_id')
                ->references('user_id')->on('user')
                ->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::table('question_bank', function (Blueprint $table) {
            $table->dropForeign(['professor_id']);
            $table->dropColumn('professor_id');
        });
    }
};
