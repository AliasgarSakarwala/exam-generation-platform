<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamVariantQuestion extends Model
{
    use HasFactory;

    protected $table = 'exam_variant_question';

    /**
     * The primary key associated with the table.
     *
     * @var string
     */
    protected $primaryKey = 'exam_variant_question_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'exam_variant_id',
        'question_id',
        'question_text',
        'question_number',
        'options',
        'correct_options',
        'mandatory'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'options' => 'array',
        'correct_options' => 'array',
        'mandatory' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the exam variant that owns this question
     */
    public function examVariant()
    {
        return $this->belongsTo(ExamVariant::class, 'exam_variant_id', 'exam_variant_id');
    }

}