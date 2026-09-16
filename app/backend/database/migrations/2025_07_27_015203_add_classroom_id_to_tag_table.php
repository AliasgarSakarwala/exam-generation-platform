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
        Schema::table('tag', function (Blueprint $table) {
            $table->unsignedBigInteger('classroom_id')->nullable()->after('name');
            
            // Add foreign key constraint if needed
            $table->foreign('classroom_id')
                  ->references('classroom_id')
                  ->on('classroom')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('tag', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['classroom_id']);
            
            // Then drop the column
            $table->dropColumn('classroom_id');
        });
    }
};