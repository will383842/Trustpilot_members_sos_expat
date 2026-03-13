<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Baileys sync routes: 60 req/min per IP
        RateLimiter::for('sync', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        // Dashboard routes: 120 req/min per authenticated user
        RateLimiter::for('dashboard', function (Request $request) {
            return Limit::perMinute(120)->by(optional($request->user())->id ?: $request->ip());
        });

        // Login: 5 attempts/min per IP
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // GPT generate: 10 req/min per user (handled via 'dashboard' group + controller logic)
        RateLimiter::for('generate', function (Request $request) {
            return Limit::perMinute(10)->by(optional($request->user())->id ?: $request->ip());
        });
    }
}
