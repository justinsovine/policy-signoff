<?php

use App\Http\Controllers\PolicyController;
use App\Http\Controllers\SignoffController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/policies', [PolicyController::class, 'index']);
    Route::post('/policies', [PolicyController::class, 'store']);
    Route::get('/policies/{policy}', [PolicyController::class, 'show']);
    Route::post('/policies/{policy}/signoff', [SignoffController::class, 'store']);
});
