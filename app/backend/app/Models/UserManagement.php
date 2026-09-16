<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class UserManagement extends Model
{
    protected $table = 'user_management';
    protected $primaryKey = 'um_id';

    protected $fillable = [
        'classroom_id',
        'user_id',
        'responsibility',
        'status',
        'full_name',
        'view_grades',
        'manage_assignments'
    ];

    protected $casts = [
        'responsibility' => 'string',
        'status' => 'string',
        'view_grades' => 'boolean',
        'manage_assignments' => 'boolean'
    ];

    /**
     * Get the next available ID for the sequence
     */
    public static function getNextId(): int
    {
        $maxId = self::max('um_id') ?? 0;
        return $maxId + 1;
    }

    /**
     * Reset the sequence to start from the next available ID
     */
    public static function resetSequence(): void
    {
        $nextId = self::getNextId();
        DB::statement("ALTER SEQUENCE user_management_um_id_seq RESTART WITH {$nextId}");
    }

    /**
     * Reset the sequence to start from 1 (use with caution)
     */
    public static function resetSequenceToStart(): void
    {
        DB::statement("ALTER SEQUENCE user_management_um_id_seq RESTART WITH 1");
    }

    /**
     * Get the classroom that this user management record belongs to.
     */
    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class, 'classroom_id', 'classroom_id');
    }

    /**
     * Get the user that this user management record belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
