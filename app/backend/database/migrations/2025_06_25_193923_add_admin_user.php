<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\User;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create the admin user
        $adminUser = User::create([
            'role' => 'Admin',
            'username' => 'Admin1',
            'email' => 'admin1@admin.com',
            'password_hash' => Hash::make('Adminpassword123'),
            'status' => 'Verified',
            'language' => 'en',
            'mode' => 'light',
            'is_active' => true
        ]);

        // Create the admin record linked to the user
        Admin::create([
            'user_id' => $adminUser->user_id
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Find and delete the admin user
        $user = User::where('username', 'Admin1')->first();
        
        if ($user) {
            Admin::where('user_id', $user->user_id)->delete();
            $user->delete();
        }
    }
};