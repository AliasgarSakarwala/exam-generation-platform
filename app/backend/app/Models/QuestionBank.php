<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Classroom;
use App\Models\User;
use App\Models\Question;

class QuestionBank extends Model
{
    protected $table = 'question_bank';

    protected $primaryKey = 'question_bank_id';

    public $timestamps = true; // Enable this only if you are not using created_at/updated_at

    protected $casts = [
        'created_at' => 'datetime',
    ];

    protected $fillable = [
        'name',
        'description',
        'user_id',
        'classroom_id',
    ];

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class, 'question_bank_id', 'question_bank_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class, 'classroom_id', 'classroom_id');
    }
}
