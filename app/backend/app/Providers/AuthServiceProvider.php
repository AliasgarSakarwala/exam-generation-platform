<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for your application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Override the reset-link generator to point at the Laravel web form:
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            return config('app.url')
                 . '/reset-password/' . $token
                 . '?email=' . urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}
