<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $table = 'activity_logs';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'classroom_id',
        'exam_id',
        'action',
        'entity',
        'description',
        'route',
        'method',
        'status_code',
        'payload',
        'created_at',
    ];

    protected $casts = [
        'payload'    => 'array',
        'created_at' => 'datetime',
        'user_id'      => 'integer',
        'classroom_id' => 'integer',
        'exam_id'      => 'integer',
        'status_code'  => 'integer',
        'action'       => 'string',
        'entity'       => 'string',
        'description'  => 'string',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class, 'classroom_id', 'classroom_id');
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class, 'exam_id', 'exam_id');
    }
}