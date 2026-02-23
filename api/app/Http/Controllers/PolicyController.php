<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PolicyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = Carbon::today();

        $policies = Policy::with(['creator', 'signoffs'])
            ->orderBy('due_date')
            ->get();

        $data = $policies->map(function (Policy $policy) use ($user, $today) {
            $signed = $policy->signoffs->contains('user_id', $user->id);

            return [
                'id' => $policy->id,
                'title' => $policy->title,
                'due_date' => $policy->due_date->toDateString(),
                'created_by' => $policy->creator->name,
                'has_file' => $policy->file_path !== null,
                'signed' => $signed,
                'overdue' => !$signed && $policy->due_date->lt($today),
            ];
        });

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'due_date' => ['required', 'date', 'after_or_equal:today'],
        ]);

        $policy = $request->user()->policies()->create($validated);

        $policy->load('creator');

        return response()->json([
            'id' => $policy->id,
            'title' => $policy->title,
            'due_date' => $policy->due_date->toDateString(),
            'created_by' => $policy->creator->name,
            'has_file' => false,
            'signed' => false,
            'overdue' => false,
        ], 201);
    }

    public function show(Request $request, Policy $policy): JsonResponse
    {
        $user = $request->user();
        $today = Carbon::today();

        $policy->load(['creator', 'signoffs']);

        $signed = $policy->signoffs->contains('user_id', $user->id);
        $signoffsByUserId = $policy->signoffs->keyBy('user_id');
        $signedCount = $policy->signoffs->count();

        $allUsers = User::select('id', 'name')->get();

        $signoffsList = $allUsers->map(function (User $u) use ($signoffsByUserId, $policy, $today) {
            $signoff = $signoffsByUserId->get($u->id);

            if ($signoff) {
                return [
                    'user' => $u->name,
                    'user_id' => $u->id,
                    'signed_at' => $signoff->signed_at->utc()->toIso8601ZuluString(),
                    'overdue' => false,
                ];
            }

            return [
                'user' => $u->name,
                'user_id' => $u->id,
                'signed_at' => null,
                'overdue' => $policy->due_date->lt($today),
            ];
        });

        $response = [
            'id' => $policy->id,
            'title' => $policy->title,
            'description' => $policy->description,
            'due_date' => $policy->due_date->toDateString(),
            'created_by' => $policy->creator->name,
            'has_file' => $policy->file_path !== null,
            'signed' => $signed,
            'overdue' => !$signed && $policy->due_date->lt($today),
            'signoff_summary' => [
                'total_users' => $allUsers->count(),
                'signed_count' => $signedCount,
                'signoffs' => $signoffsList->values(),
            ],
        ];

        if ($policy->file_name !== null) {
            $response['file_name'] = $policy->file_name;
        }

        return response()->json($response);
    }
}
