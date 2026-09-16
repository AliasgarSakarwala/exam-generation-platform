<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_variant', function (Blueprint $table) {
            $table->string('answer_key')
                  ->nullable()
                  ->comment('Stores answer key for the entire variant');
        });
    }

    public function down(): void
    {
        Schema::table('exam_variant', function (Blueprint $table) {
            $table->dropColumn('answer_key');
        });
    }
};
