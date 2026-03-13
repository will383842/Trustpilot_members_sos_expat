<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateMemberMessage;
use App\Models\Member;
use App\Services\GptMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    /**
     * GET /api/members
     * Paginated list with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Member::with('activeGroups');

        if ($request->filled('status')) {
            $query->where('message_status', $request->status);
        }
        if ($request->filled('language')) {
            $query->where('primary_language', $request->language);
        }
        if ($request->filled('country')) {
            $query->where('primary_country', $request->country);
        }
        if ($request->filled('group_id')) {
            $query->whereHas('activeGroups', fn($q) => $q->where('groups.id', $request->group_id));
        }
        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(fn($q) => $q->where('display_name', 'like', $search)
                ->orWhere('phone_number', 'like', $search));
        }

        $sortField = match($request->sort) {
            'name'   => 'display_name',
            'status' => 'message_status',
            default  => 'first_seen_at',
        };
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortField, $sortDir);

        $members = $query->paginate($request->input('per_page', 50));

        return response()->json($members->through(fn($m) => $this->formatMember($m)));
    }

    /**
     * GET /api/members/{id}
     */
    public function show(Member $member): JsonResponse
    {
        $member->load('groups');
        return response()->json($this->formatMember($member, true));
    }

    /**
     * POST /api/members/{id}/generate
     * Force regenerate GPT-4 message.
     */
    public function generate(Member $member, GptMessageService $gpt): JsonResponse
    {
        $message = $gpt->generateMessage($member);
        if (!$message) {
            return response()->json(['error' => 'Generation failed'], 500);
        }
        $member->update(['whatsapp_message' => $message, 'generated_at' => now()]);
        return response()->json(['whatsapp_message' => $message, 'whatsapp_link' => $member->whatsapp_link]);
    }

    /**
     * POST /api/members/{id}/mark-sent
     */
    public function markSent(Member $member): JsonResponse
    {
        $member->update([
            'message_status'  => 'sent',
            'message_sent_at' => now(),
        ]);
        return response()->json(['status' => 'sent', 'sent_at' => $member->message_sent_at]);
    }

    /**
     * POST /api/members/{id}/mark-replied
     */
    public function markReplied(Member $member): JsonResponse
    {
        $member->update([
            'message_status' => 'replied',
            'replied_at'     => now(),
        ]);
        return response()->json(['status' => 'replied', 'replied_at' => $member->replied_at]);
    }

    /**
     * PUT /api/members/{id}/notes
     */
    public function updateNotes(Request $request, Member $member): JsonResponse
    {
        $member->update(['notes' => $request->input('notes', '')]);
        return response()->json(['ok' => true]);
    }

    /**
     * DELETE /api/members/{id}
     * RGPD — right to erasure.
     */
    public function destroy(Member $member): JsonResponse
    {
        $member->delete();
        return response()->json(['deleted' => true]);
    }

    private function formatMember(Member $m, bool $full = false): array
    {
        $data = [
            'id'                => $m->id,
            'phone_number'      => $m->phone_number,
            'display_name'      => $m->display_name,
            'primary_language'  => $m->primary_language,
            'primary_country'   => $m->primary_country,
            'primary_continent' => $m->primary_continent,
            'message_status'    => $m->message_status,
            'message_sent_at'   => $m->message_sent_at?->toISOString(),
            'replied_at'        => $m->replied_at?->toISOString(),
            'generated_at'      => $m->generated_at?->toISOString(),
            'first_seen_at'     => $m->first_seen_at?->toISOString(),
            'is_new'            => $m->isNew(),
            'has_message'       => !empty($m->whatsapp_message),
            'whatsapp_link'     => $m->whatsapp_link,
            'groups'            => $m->relationLoaded('activeGroups')
                ? $m->activeGroups->map(fn($g) => ['id' => $g->id, 'name' => $g->name, 'language' => $g->language, 'country' => $g->country])
                : ($m->relationLoaded('groups')
                    ? $m->groups->map(fn($g) => ['id' => $g->id, 'name' => $g->name, 'language' => $g->language, 'country' => $g->country, 'joined_at' => $g->pivot->joined_at, 'left_at' => $g->pivot->left_at])
                    : []),
        ];

        if ($full) {
            $data['whatsapp_message'] = $m->whatsapp_message;
            $data['notes']            = $m->notes;
        }

        return $data;
    }
}
