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
        Schema::table('question', function (Blueprint $table) {
            $table->json('tags')->default(json_encode([]))->after('difficulty_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('question', function (Blueprint $table) {
            $table->dropColumn('tags');
        });
    }
};