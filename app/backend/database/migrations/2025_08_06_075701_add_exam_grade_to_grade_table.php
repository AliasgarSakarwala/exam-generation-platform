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
        Schema::table('grade', function (Blueprint $table) {
            $table->float('exam_grade')->nullable()->after('exam_variant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grade', function (Blueprint $table) {
            $table->dropColumn('exam_grade');
        });
    }
};