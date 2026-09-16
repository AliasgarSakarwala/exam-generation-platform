<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GradeSettings extends Model
{
    use HasFactory;

    protected $table = 'grade_settings';
    protected $primaryKey = 'grade_settings_id';

    protected $fillable = [
        'exam_id',
        'high_grade_threshold',
        'medium_grade_threshold',
        'low_grade_threshold',
        'high_grade_color',
        'medium_grade_color',
        'low_grade_color',
        'anonymous_student_names'
    ];

    protected $casts = [
        'high_grade_threshold' => 'integer',
        'medium_grade_threshold' => 'integer',
        'low_grade_threshold' => 'integer',
        'anonymous_student_names' => 'boolean',
    ];

    /**
     * Get the exam that owns the grade settings.
     */
    public function exam()
    {
        return $this->belongsTo(Exam::class, 'exam_id', 'exam_id');
    }
}
