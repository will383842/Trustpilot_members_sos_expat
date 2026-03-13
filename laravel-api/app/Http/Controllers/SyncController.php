<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateMemberMessage;
use App\Models\Group;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncController extends Controller
{
    /**
     * POST /api/sync/groups
     * Upsert groups from Baileys.
     */
    public function syncGroups(Request $request): JsonResponse
    {
        $request->validate([
            'groups'                  => 'required|array|max:200',
            'groups.*.whatsapp_group_id' => 'required|string|max:100',
            'groups.*.name'           => 'required|string|max:255',
            'groups.*.language'       => 'nullable|string|max:10',
            'groups.*.member_count'   => 'nullable|integer|min:0',
        ]);

        try {
            $groups = $request->input('groups', []);

            foreach ($groups as $g) {
                Group::updateOrCreate(
                    ['whatsapp_group_id' => $g['whatsapp_group_id']],
                    [
                        'name'         => $g['name'],
                        'language'     => $g['language'] ?? 'fr',
                        'country'      => $g['country'] ?? null,
                        'continent'    => $g['continent'] ?? null,
                        'member_count' => $g['member_count'] ?? 0,
                        'is_active'    => true,
                    ]
                );
            }

            return response()->json(['synced' => count($groups)]);
        } catch (\Throwable $e) {
            Log::error('Sync groups failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Sync failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/sync/members/batch
     * Upsert a chunk of members (max 100) from Baileys initial sync.
     */
    public function syncMembersBatch(Request $request): JsonResponse
    {
        $request->validate([
            'members'              => 'required|array|max:100',
            'members.*.phone'      => 'required|string|max:25',
            'members.*.group_id'   => 'required|string',
            'members.*.language'   => 'nullable|string|max:10',
        ]);

        $members = $request->input('members', []);
        $created = 0;

        // Pré-charger tous les groupes du chunk en une seule requête (évite N+1)
        $groupIds = array_unique(array_column($members, 'group_id'));
        $groupsMap = Group::whereIn('whatsapp_group_id', $groupIds)
            ->get()
            ->keyBy('whatsapp_group_id');

        DB::transaction(function () use ($members, $groupsMap, &$created) {
            foreach ($members as $m) {
                $group = $groupsMap[$m['group_id']] ?? null;

                // Si le groupe n'existe pas encore, le créer à la volée
                if (!$group && !empty($m['group_id'])) {
                    $group = Group::firstOrCreate(
                        ['whatsapp_group_id' => $m['group_id']],
                        [
                            'name'         => $m['group_name'] ?? $m['group_id'],
                            'language'     => $m['language'] ?? 'fr',
                            'country'      => $m['country'] ?? null,
                            'continent'    => $m['continent'] ?? null,
                            'member_count' => 0,
                        ]
                    );
                    $groupsMap[$m['group_id']] = $group;
                    Log::info('Group created on-the-fly during batch sync', ['group_id' => $m['group_id']]);
                }

                $member = Member::firstOrCreate(
                    ['phone_number' => $m['phone']],
                    [
                        'display_name'      => $m['display_name'] ?? null,
                        'primary_language'  => $m['language'] ?? 'fr',
                        'primary_country'   => $m['country'] ?? null,
                        'primary_continent' => $m['continent'] ?? null,
                        'first_seen_at'     => now(),
                    ]
                );

                if ($member->wasRecentlyCreated) {
                    $created++;
                    // Dispatched outside transaction for QUEUE_CONNECTION=sync safety
                }

                if ($group) {
                    $member->groups()->syncWithoutDetaching([
                        $group->id => ['joined_at' => now()]
                    ]);
                    // NE PAS incrémenter ici — syncGroups() fixe déjà member_count
                    // correctement via participants.length, évite le doublement au resync
                }
            }
        });

        // Dispatch GPT jobs AFTER transaction to avoid synchronous timeout inside DB::transaction
        if ($created > 0) {
            Member::whereIn('phone_number', array_column($members, 'phone'))
                ->where('whatsapp_message', null)
                ->each(fn($m) => GenerateMemberMessage::dispatch($m));
        }

        return response()->json(['processed' => count($members), 'created' => $created]);
    }

    /**
     * POST /api/sync/members/event
     * Handle a real-time Baileys event (join / leave / name-change).
     */
    public function memberEvent(Request $request): JsonResponse
    {
        $request->validate([
            'phone'    => 'required|string|max:25',
            'group_id' => 'required|string',
            'action'   => 'required|in:add,remove,promote,demote',
        ]);

        $phone     = $request->input('phone');
        $groupId   = $request->input('group_id');
        $action    = $request->input('action');
        $language  = $request->input('language', 'fr');
        $country   = $request->input('country');
        $continent = $request->input('continent');
        $groupName = $request->input('group_name', '');

        try {
            return DB::transaction(function () use ($phone, $groupId, $action, $language, $country, $continent, $groupName) {
                $group = Group::where('whatsapp_group_id', $groupId)->first();

                // Créer le groupe à la volée s'il n'existe pas encore
                if (!$group) {
                    $group = Group::create([
                        'whatsapp_group_id' => $groupId,
                        'name'              => $groupName ?: $groupId,
                        'language'          => $language,
                        'country'           => $country,
                        'continent'         => $continent,
                        'member_count'      => 0,
                    ]);
                    Log::info('Group created on-the-fly during event', ['group_id' => $groupId]);
                }

                $member = Member::firstOrCreate(
                    ['phone_number' => $phone],
                    [
                        'primary_language'  => $language,
                        'primary_country'   => $country,
                        'primary_continent' => $continent,
                        'first_seen_at'     => now(),
                    ]
                );

                if ($action === 'add') {
                    $member->groups()->syncWithoutDetaching([
                        $group->id => ['joined_at' => now()]
                    ]);
                    $member->groups()->updateExistingPivot($group->id, ['left_at' => null]);
                    $group->increment('member_count');

                    if ($member->wasRecentlyCreated || !$member->whatsapp_message) {
                        GenerateMemberMessage::dispatch($member);
                    }
                }

                if ($action === 'remove') {
                    DB::table('member_groups')
                        ->where('member_id', $member->id)
                        ->where('group_id', $group->id)
                        ->update(['left_at' => now()]);
                    $group->decrement('member_count');
                }

                return response()->json(['ok' => true, 'action' => $action, 'phone' => $phone]);
            });
        } catch (\Throwable $e) {
            Log::error('Member event failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Sync failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/sync/health
     * Receive Baileys health ping and store in cache.
     */
    public function health(Request $request): JsonResponse
    {
        try {
            Cache::put('baileys_health', [
                'connected' => $request->boolean('connected'),
                'last_ping' => $request->input('last_ping', now()->toISOString()),
            ], 120);

            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            Log::error('Health ping failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Sync failed: ' . $e->getMessage()], 500);
        }
    }
}
