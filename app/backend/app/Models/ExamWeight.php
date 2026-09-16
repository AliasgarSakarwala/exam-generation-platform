<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamWeight extends Model
{
    use HasFactory;

    protected $primaryKey = 'weight_id';
    protected $table = 'exam_weight';

    protected $fillable = [
        'classroom_id',
        'exam_id',
        'weight'
    ];

    public function classroom()
    {
        return $this->belongsTo(Classroom::class, 'classroom_id');
    }

    public function exam()
    {
        return $this->belongsTo(Exam::class, 'exam_id');
    }
}