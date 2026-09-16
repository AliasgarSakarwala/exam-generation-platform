<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;

class ClassroomTA extends Pivot
{
    use HasFactory;

    protected $table = 'classroom_ta';
    public $timestamps = false;
    public $incrementing = false;

    protected $fillable = ['classroom_id', 'ta_id', 'assigned_at'];
}