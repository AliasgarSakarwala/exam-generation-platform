<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePasswordResetTokensTable extends Migration
{
    public function up()
    {
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->bigIncrements('id');
            
            // Store the user's email
            $table->string('email')->index();
            
            // Secure token for resetting
            $table->string('token', 64)->unique();
            
            // When the token was created
            $table->timestamp('created_at')->nullable();
            
            // Optional expiration timestamp
            $table->timestamp('expires_at')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('password_reset_tokens');
    }
}
