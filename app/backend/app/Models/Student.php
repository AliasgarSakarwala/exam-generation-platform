<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\ClassroomStudent;
use App\Models\ExamResult;

class Student extends Model
{
    use HasFactory;
    protected $table = 'student';

    protected $primaryKey = 'student_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'student_id',
        'first_name',
        'last_name',
        'preferred_name',
    ];

    public function classrooms()
    {
        return $this->belongsToMany(Classroom::class, 'classroom_student', 'student_id', 'classroom_id')
            ->using(ClassroomStudent::class)
            ->withPivot('enrolled_at', 'enrollment_status');
    }

    public function examResults(): HasMany
    {
        return $this->hasMany(ExamResult::class, 'student_id', 'student_id');
    }
}