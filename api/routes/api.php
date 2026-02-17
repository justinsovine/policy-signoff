<?php

use App\Http\Controllers\FileController;
use App\Http\Controllers\PolicyController;
use App\Http\Controllers\SignoffController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/policies', [PolicyController::class, 'index']);
    Route::post('/policies', [PolicyController::class, 'store']);
    Route::get('/policies/{policy}', [PolicyController::class, 'show']);
    Route::post('/policies/{policy}/signoff', [SignoffController::class, 'store']);
    Route::post('/policies/{policy}/upload-url', [FileController::class, 'uploadUrl']);
    Route::get('/policies/{policy}/download-url', [FileController::class, 'downloadUrl']);
});
