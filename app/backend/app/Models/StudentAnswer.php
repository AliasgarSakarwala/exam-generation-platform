<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\ExamVariantQuestion;

class StudentAnswer extends Model
{
    protected $table = 'student_answer';
    protected $primaryKey = 'student_answer_id';
    public $timestamps = false;

    protected $fillable = [
        'grade_id',
        'exam_variant_question_id',
        'selected_option',
        'is_correct',
        'answered_at',
    ];

    protected $casts = [
        'student_answer_id' => 'integer',
        'grade_id'          => 'integer',
        'exam_variant_question_id' => 'integer',
        'is_correct'        => 'boolean',
        'answered_at'       => 'datetime',
    ];

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class, 'grade_id', 'grade_id');
    }

    public function examVariantQuestion(): BelongsTo
    {
        return $this->belongsTo(
            ExamVariantQuestion::class,
            'exam_variant_question_id',
            'exam_variant_question_id'
        );
    }
}