<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * Global HTTP middleware stack.
     *
     * These middleware run during every request to your application.
     *
     * @var array<int, class-string|string>
     */
    protected $middleware = [
        // Trust proxies (e.g. for load-balancers)
        \App\Http\Middleware\TrustProxies::class,
        // Handle CORS
        \Fruitcake\Cors\HandleCors::class,
        // Maintenance mode
        \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
        // Validate max POST size
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        // Trim all request strings
        \App\Http\Middleware\TrimStrings::class,
        // Convert empty strings to null
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ];

    /**
     * Middleware groups.
     *
     * You can assign these groups to routes or controllers.
     *
     * @var array<string, array<int, class-string|string>>
     */
    protected $middlewareGroups = [
        'web' => [
            // Encrypt & add queued cookies
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            // Start session
            \Illuminate\Session\Middleware\StartSession::class,
            // (Optional) re-authenticate session if necessary
            // \Illuminate\Session\Middleware\AuthenticateSession::class,
            // Share validation errors via session
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            // CSRF protection
            \App\Http\Middleware\VerifyCsrfToken::class,
            // Substitute route model bindings
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],

        'api' => [
            // If you ever use Sanctum’s cookie-based SPA auth, uncomment:
            // \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,

            // Rate-limit (“throttle:60,1” by default; “throttle:api” uses your config)
            'throttle:api',

            // Substitute route model bindings
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];

    /**
     * Route middleware.
     *
     * These can be applied to individual routes or controllers.
     *
     * @var array<string, class-string|string>
     */
    protected $routeMiddleware = [
        // Authentication (for any guard)
        'auth'             => \App\Http\Middleware\Authenticate::class,
        // Basic HTTP auth
        'auth.basic'       => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
        // Set cache headers
        'cache.headers'    => \Illuminate\Http\Middleware\SetCacheHeaders::class,
        // Authorization (gates/policies)
        'can'              => \Illuminate\Auth\Middleware\Authorize::class,
        // Redirect if already authenticated
        'guest'            => \App\Http\Middleware\RedirectIfAuthenticated::class,
        // Confirm password
        'password.confirm' => \Illuminate\Auth\Middleware\RequirePassword::class,
        // Validate signed URLs
        'signed'           => \Illuminate\Routing\Middleware\ValidateSignature::class,
        // Rate limiting
        'throttle'         => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        // Ensure email verification
        'verified'         => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
    ];
}
