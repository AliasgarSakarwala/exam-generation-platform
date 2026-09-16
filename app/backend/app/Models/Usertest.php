<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Usertest extends Model
{
    /** @use HasFactory<\Database\Factories\UsertestFactory> */
    use HasFactory;


    protected $table = 'usertests';

    protected $fillable = [
    'role',
    'username',
    'email',
    'password_hash',
    'is_active',
];
}
