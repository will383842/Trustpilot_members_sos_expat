<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Group extends Model
{
    protected $fillable = [
        'whatsapp_group_id',
        'name',
        'language',
        'country',
        'continent',
        'member_count',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'member_count' => 'integer',
    ];

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(Member::class, 'member_groups')
            ->withPivot(['joined_at', 'left_at']);
    }
}
