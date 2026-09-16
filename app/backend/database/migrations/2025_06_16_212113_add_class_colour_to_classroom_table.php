<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('classroom', function (Blueprint $table) {
            $table->string('class_colour', 7)
                  ->default('#CCCCFF'); // Default to periwinkle
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('classroom', function (Blueprint $table) {
            $table->dropColumn('class_colour');
        });
    }
};