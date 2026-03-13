<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * GET /api/stats
     */
    public function index(): JsonResponse
    {
        $baileysHealth = Cache::get('baileys_health', ['connected' => false, 'last_ping' => null]);

        $total        = Member::count();
        $notSent      = Member::where('message_status', 'not_sent')->count();
        $sent         = Member::where('message_status', 'sent')->count();
        $replied      = Member::where('message_status', 'replied')->count();
        $sentToday    = Member::where('message_status', 'sent')
            ->whereDate('message_sent_at', today())->count();
        $newThisWeek  = Member::where('first_seen_at', '>=', now()->subDays(7))->count();

        $byLanguage = Member::select('primary_language', DB::raw('COUNT(*) as count'))
            ->groupBy('primary_language')
            ->orderByDesc('count')
            ->get();

        $byContinent = Member::select('primary_continent', DB::raw('COUNT(*) as count'))
            ->whereNotNull('primary_continent')
            ->groupBy('primary_continent')
            ->orderByDesc('count')
            ->get();

        $topGroups = Group::where('is_active', true)
            ->orderByDesc('member_count')
            ->limit(10)
            ->get(['name', 'country', 'language', 'member_count']);

        return response()->json([
            'total_members'    => $total,
            'not_sent'         => $notSent,
            'sent'             => $sent,
            'replied'          => $replied,
            'sent_today'       => $sentToday,
            'new_this_week'    => $newThisWeek,
            'reply_rate'       => $sent > 0 ? round($replied / $sent * 100, 1) : 0,
            'by_language'      => $byLanguage,
            'by_continent'     => $byContinent,
            'top_groups'       => $topGroups,
            'baileys_connected' => $baileysHealth['connected'],
            'baileys_last_ping' => $baileysHealth['last_ping'],
        ]);
    }
}
