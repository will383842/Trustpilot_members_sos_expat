<?php

namespace App\Http\Controllers;

use App\Models\Group;
use Illuminate\Http\JsonResponse;

class GroupController extends Controller
{
    /**
     * GET /api/groups
     * List all active groups with member counts.
     */
    public function index(): JsonResponse
    {
        $groups = Group::where('is_active', true)
            ->orderBy('member_count', 'desc')
            ->get(['id', 'name', 'language', 'country', 'continent', 'member_count']);

        return response()->json($groups);
    }
}
