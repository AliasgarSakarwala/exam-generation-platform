<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TA extends Model
{
    use HasFactory;
    protected $table = 'ta';

    protected $primaryKey = 'user_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['user_id'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function classrooms()
    {
        return $this->belongsToMany(Classroom::class, 'classroom_ta', 'ta_id', 'classroom_id')
            ->withPivot('assigned_at');
    }
}