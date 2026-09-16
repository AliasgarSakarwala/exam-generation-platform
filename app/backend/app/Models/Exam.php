<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exam extends Model
{
    protected $table = 'exam';
    protected $primaryKey = 'exam_id';
    public $timestamps = false;

    protected $fillable = [
        'classroom_id',
        'professor_id',
        'title',
        'description',
        'total_points',
        'question_count',
        'variant_count',
        'available_from',
        'available_to',
        'is_published',
        'is_graded',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'professor_id' => 'integer',
        'total_points' => 'integer',
        'question_count' => 'integer',
        'variant_count' => 'integer',
        'is_published' => 'boolean',
        'is_graded'  => 'boolean',
        'available_from' => 'datetime',
        'available_to' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class, 'classroom_id', 'classroom_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ExamVariant::class, 'exam_id', 'exam_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(ExamResult::class, 'exam_id', 'exam_id');
    }
} 