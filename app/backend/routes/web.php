<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\NewPasswordController;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});
Route::get('/', [\App\Http\Controllers\DatabaseViewController::class, 'showTables']);

// Show the form
Route::get('/reset-password/{token}', function ($token) {
    return view('reset-password', [
        'token' => $token,
        'email' => request('email'),
    ]);
})->middleware('guest')->name('password.reset');

// Process the form
Route::post('/reset-password', [NewPasswordController::class, 'store'])
     ->middleware('guest')->name('password.update');

require __DIR__.'/auth.php';
