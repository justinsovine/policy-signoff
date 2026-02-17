<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('signoffs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained('policies');
            $table->foreignId('user_id')->constrained('users');
            $table->timestamp('signed_at');
            $table->unique(['policy_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signoffs');
    }
};
