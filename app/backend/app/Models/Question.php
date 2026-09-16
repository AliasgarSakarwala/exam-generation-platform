<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    protected $table = 'question';
    protected $primaryKey = 'question_id';
    public $timestamps = true;

    protected $fillable = [
        'question_bank_id', 
        'question_text', 
        'question_type', 
        'difficulty_level',
        'tags'
    ];

    protected $casts = [
    'tags' => 'array',
    ];

    public function options()
    {
        return $this->hasMany(QuestionOption::class, 'question_id', 'question_id');
    }

    public function questionBank()
    {
        return $this->belongsTo(QuestionBank::class, 'question_bank_id', 'question_bank_id');
    }

     public function tags()
     {
         return $this->belongsToMany(Tag::class, 'question_tag', 'question_id', 'tag_id');
     }
}