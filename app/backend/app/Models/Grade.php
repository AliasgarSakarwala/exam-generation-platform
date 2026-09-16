<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    protected $table = 'grade';
    protected $primaryKey = 'grade_id';
    public $timestamps = false;

    protected $fillable = [
        'student_id',
        'raw_score',
        'normalized_score',
        'letter_grade',
        'grade_points',
        'percentile',
        'exam_variant_id',
        'exam_grade',
    ];

    protected $casts = [
        'grade_id' => 'integer',
        'student_id' => 'integer',
        'raw_score' => 'float',
        'normalized_score' => 'float',
        'grade_points' => 'float',
        'percentile' => 'float',
        'exam_variant_id' => 'integer',
        'exam_grade'=>'float',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }

    public function examVariant(): BelongsTo
    {
        return $this->belongsTo(ExamVariant::class, 'exam_variant_id', 'exam_variant_id');
    }

    public function answers()
    {
        // each Grade has many StudentAnswer rows:
        return $this->hasMany(StudentAnswer::class, 'grade_id', 'grade_id');
    }
}