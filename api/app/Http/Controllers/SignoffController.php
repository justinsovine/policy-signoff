<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use App\Models\Signoff;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SignoffController extends Controller
{
    public function store(Request $request, Policy $policy): JsonResponse
    {
        try {
            $signoff = Signoff::create([
                'policy_id' => $policy->id,
                'user_id' => $request->user()->id,
                'signed_at' => now(),
            ]);
        } catch (UniqueConstraintViolationException) {
            return response()->json(['message' => 'Already signed'], 409);
        }

        return response()->json([
            'message' => 'Signed off successfully',
            'signed_at' => $signoff->signed_at->utc()->toIso8601ZuluString(),
        ]);
    }
}
