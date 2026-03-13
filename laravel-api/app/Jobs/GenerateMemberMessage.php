<?php

namespace App\Jobs;

use App\Models\Member;
use App\Services\GptMessageService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateMemberMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(public Member $member) {}

    public function handle(GptMessageService $gpt): void
    {
        // Skip if message already generated recently (within last hour)
        if ($this->member->generated_at && $this->member->generated_at->diffInMinutes(now()) < 60) {
            return;
        }

        $message = $gpt->generateMessage($this->member);

        if ($message) {
            $this->member->update([
                'whatsapp_message' => $message,
                'generated_at'     => now(),
            ]);
            Log::info('Message generated', ['member_id' => $this->member->id]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('GenerateMemberMessage job failed', [
            'member_id' => $this->member->id,
            'error'     => $exception->getMessage(),
        ]);
    }
}
