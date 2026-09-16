<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamVariant extends Model
{
    protected $table = 'exam_variant';
    protected $primaryKey = 'exam_variant_id';
    public $timestamps = false;

    protected $fillable = [
        'exam_id',
        'version_number',
        'instructions',
        'created_at',
        'answer_key'
    ];

    protected $casts = [
        'exam_id' => 'integer',
        'version_number' => 'integer',
        'created_at' => 'datetime',
        'answer_key' => 'string'
    ];

    // Relationships
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class, 'exam_id', 'exam_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(ExamResult::class, 'exam_variant_id', 'exam_variant_id');
    }
    public function questions(): HasMany
    {
    return $this->hasMany(ExamVariantQuestion::class, 'exam_variant_id', 'exam_variant_id');
    }
} 
