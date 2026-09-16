<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class MakeGradeColumnsNullable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('grade', function (Blueprint $table) {
            $table->integer('normalized_score')
                  ->nullable()
                  ->default(null)
                  ->change();

            $table->string('letter_grade', 2)
                  ->nullable()
                  ->default(null)
                  ->change();

            $table->unsignedSmallInteger('grade_points')
                  ->nullable()
                  ->default(null)
                  ->change();

            $table->decimal('percentile', 5, 2)
                  ->nullable()
                  ->default(null)
                  ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grade', function (Blueprint $table) {
            // revert to not-null—adjust defaults as needed
            $table->integer('normalized_score')
                  ->nullable(false)
                  ->default(0)
                  ->change();

            $table->string('letter_grade', 2)
                  ->nullable(false)
                  ->default('')
                  ->change();

            $table->unsignedSmallInteger('grade_points')
                  ->nullable(false)
                  ->default(0)
                  ->change();

            $table->decimal('percentile', 5, 2)
                  ->nullable(false)
                  ->default(0)
                  ->change();
        });
    }
}
