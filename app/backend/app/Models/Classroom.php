<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\TA;
use App\Models\Student;
use App\Models\ClassroomStudent;
use App\Models\ExamResult;

class Classroom extends Model
{
    use HasFactory;
    protected $table = 'classroom';

    protected $primaryKey = 'classroom_id';
    public $timestamps = false;

protected $fillable = [
    'name',
    'code',
    'section',
    'description',
    'user_id',
    'is_archived',
    'start_date',
    'end_date',
    'term',
    'student_count',
    'class_colour'
];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function teachingAssistants()
    {
        return $this->belongsToMany(TA::class, 'classroom_ta', 'classroom_id', 'ta_id')
            ->withPivot('assigned_at');
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'classroom_student', 'classroom_id', 'student_id')
            ->using(ClassroomStudent::class)
            ->withPivot('enrolled_at', 'enrollment_status');
    }
}