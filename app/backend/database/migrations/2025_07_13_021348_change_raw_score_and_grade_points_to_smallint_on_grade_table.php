<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ChangeRawScoreAndGradePointsToSmallintOnGradeTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('grade', function (Blueprint $table) {
            // raw_score was probably already integer, but this ensures it's unsigned smallint
            $table->unsignedSmallInteger('raw_score')->change();

            // grade_points was decimal(3,2); now make it unsigned smallint too
            $table->unsignedSmallInteger('grade_points')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grade', function (Blueprint $table) {
            // revert raw_score back to signed integer
            $table->integer('raw_score')->change();

            // revert grade_points back to decimal(3,2)
            $table->decimal('grade_points', 3, 2)->change();
        });
    }
}