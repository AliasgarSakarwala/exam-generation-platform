<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register()
{
    $this->app->singleton('command.show.tables', function() {
        return new \App\Console\Commands\ShowAllTables();
    });

    $this->commands('command.show.tables');
}

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        
    }
}
