<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Classroom;

class Tag extends Model
{
    protected $table = 'tag';
    protected $primaryKey = 'tag_id';
    public $timestamps = true;

    protected $fillable = [
        'name',
        'description',
        'classroom_id',
    ];

    public function questions()
    {
        return $this->belongsToMany(Question::class, 'question_tag', 'tag_id', 'question_id');
    }
    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class, 'classroom_id', 'classroom_id');
    }
}
