<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\SyncController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Sync routes — Baileys Service (X-API-Key auth)
|--------------------------------------------------------------------------
*/
Route::prefix('sync')->middleware(['throttle:sync', 'baileys.api.key'])->group(function () {
    Route::post('groups',          [SyncController::class, 'syncGroups']);
    Route::post('members/batch',   [SyncController::class, 'syncMembersBatch']);
    Route::post('members/event',   [SyncController::class, 'memberEvent']);
    Route::post('health',          [SyncController::class, 'health']);
});

// Public health read (no auth needed for the dashboard status indicator)
Route::get('sync/health', fn() => response()->json(
    \Illuminate\Support\Facades\Cache::get('baileys_health', ['connected' => false, 'last_ping' => null])
));

/*
|--------------------------------------------------------------------------
| Auth routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->middleware('throttle:login')->group(function () {
    Route::post('login',  [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('me',      [AuthController::class, 'me'])->middleware('auth:sanctum');
});

/*
|--------------------------------------------------------------------------
| Dashboard routes — React (Sanctum session auth)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'throttle:dashboard'])->group(function () {
    // Members
    Route::get('members',                          [MemberController::class, 'index']);
    Route::get('members/{member}',                 [MemberController::class, 'show']);
    Route::post('members/{member}/generate',       [MemberController::class, 'generate'])->middleware('throttle:generate');
    Route::post('members/{member}/mark-sent',      [MemberController::class, 'markSent']);
    Route::post('members/{member}/mark-replied',   [MemberController::class, 'markReplied']);
    Route::put('members/{member}/notes',           [MemberController::class, 'updateNotes']);
    Route::delete('members/{member}',              [MemberController::class, 'destroy']);

    // Groups
    Route::get('groups', [GroupController::class, 'index']);

    // Stats
    Route::get('stats', [StatsController::class, 'index']);
});
