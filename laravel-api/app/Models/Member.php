<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Member extends Model
{
    protected $fillable = [
        'phone_number',
        'display_name',
        'primary_language',
        'primary_country',
        'primary_continent',
        'whatsapp_message',
        'generated_at',
        'message_status',
        'message_sent_at',
        'replied_at',
        'notes',
        'first_seen_at',
    ];

    protected $casts = [
        'generated_at'     => 'datetime',
        'message_sent_at'  => 'datetime',
        'replied_at'       => 'datetime',
        'first_seen_at'    => 'datetime',
    ];

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'member_groups')
            ->withPivot(['joined_at', 'left_at']);
    }

    public function activeGroups(): BelongsToMany
    {
        return $this->groups()->wherePivotNull('left_at');
    }

    /**
     * Build the wa.me click-to-chat link dynamically (not stored in DB).
     */
    public function getWhatsappLinkAttribute(): ?string
    {
        if (!$this->whatsapp_message || !$this->phone_number) {
            return null;
        }
        $encoded = rawurlencode($this->whatsapp_message);
        return "https://wa.me/{$this->phone_number}?text={$encoded}";
    }

    public function isNew(): bool
    {
        return $this->first_seen_at && $this->first_seen_at->diffInHours(now()) < 48;
    }
}
