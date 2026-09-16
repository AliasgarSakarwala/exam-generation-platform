<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamResult extends Model
{
    protected $table = 'exam_result';
    protected $primaryKey = 'exam_result_id';
    public $timestamps = false;

    protected $fillable = [
        'exam_id',
        'student_id',
        'exam_variant_id',
        'start_time',
        'percentage_score',
        'graded_at',
        'status'
    ];

    protected $casts = [
        'exam_id' => 'integer',
        'student_id' => 'integer',
        'exam_variant_id' => 'integer',
        'percentage_score' => 'decimal:2',
        'start_time' => 'datetime',
        'graded_at' => 'datetime'
    ];

    // Relationships
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class, 'exam_id', 'exam_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }

    public function examVariant(): BelongsTo
    {
        return $this->belongsTo(ExamVariant::class, 'exam_variant_id', 'exam_variant_id');
    }
} 