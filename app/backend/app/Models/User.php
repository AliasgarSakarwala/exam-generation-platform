<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;


class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    // include HasApiTokens here:
    use HasApiTokens, HasFactory, Notifiable;
    protected $table = 'user';
    protected $casts = [
        'comp_tutorial_pages' => 'array',
    ];
    protected $attributes = [
        'comp_tutorial_pages' => '[]', // ensures PHP-side default
    ];

    protected $primaryKey = 'user_id';
    public $timestamps = false;

    protected $fillable = [
        'role',
        'username',
        'email',
        'password_hash',
        'language',
        'mode',
        'is_active',
        'status',
    ];

    // Relationships based on role
    // Note: Professor relationship removed as professor table is dropped

    public function ta()
    {
        return $this->hasOne(TA::class, 'user_id');
    }

    public function admin()
    {
        return $this->hasOne(Admin::class, 'user_id');
    }

    // Dynamic relationship to get the role-specific model
    public function roleModel()
    {
        return match($this->role) {
            'TA' => $this->ta,
            'Admin' => $this->admin,
            default => null,
        };
    }

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    // New relationships for classrooms and question banks
    public function classrooms()
    {
        return $this->hasMany(Classroom::class, 'user_id', 'user_id');
    }

    public function questionBanks()
    {
        return $this->hasMany(QuestionBank::class, 'user_id', 'user_id');
    }

    public function exams()
    {
        return $this->hasMany(Exam::class, 'user_id', 'user_id');
    }
}