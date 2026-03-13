<?php

use App\Http\Middleware\ValidateBaileysApiKey;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Sanctum stateful domains (React dev server)
        $middleware->statefulApi();

        // Register named middleware
        $middleware->alias([
            'baileys.api.key' => ValidateBaileysApiKey::class,
        ]);

        // Rate limiting géré route par route dans api.php (throttle:sync, throttle:dashboard, throttle:login)
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }
        });
    })->create();
