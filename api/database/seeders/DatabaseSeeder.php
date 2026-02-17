<?php

namespace Database\Seeders;

use App\Models\Policy;
use App\Models\Signoff;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Idempotent: clear existing data
        Signoff::query()->delete();
        Policy::query()->delete();
        User::query()->delete();

        // Users
        $jane = User::create([
            'name' => 'Jane Admin',
            'email' => 'jane@example.com',
            'password' => Hash::make('password'),
        ]);
        $mike = User::create([
            'name' => 'Mike Manager',
            'email' => 'mike@example.com',
            'password' => Hash::make('password'),
        ]);
        $alice = User::create([
            'name' => 'Alice Thompson',
            'email' => 'alice@example.com',
            'password' => Hash::make('password'),
        ]);
        $bob = User::create([
            'name' => 'Bob Martinez',
            'email' => 'bob@example.com',
            'password' => Hash::make('password'),
        ]);
        $charlie = User::create([
            'name' => 'Charlie Kim',
            'email' => 'charlie@example.com',
            'password' => Hash::make('password'),
        ]);
        $dana = User::create([
            'name' => 'Dana Williams',
            'email' => 'dana@example.com',
            'password' => Hash::make('password'),
        ]);

        // Policies
        $handbook = $jane->policies()->create([
            'title' => '2026 Employee Handbook',
            'description' => 'Annual employee handbook covering company policies, benefits, and code of conduct for 2026.',
            'due_date' => '2026-03-01',
            'file_path' => 'policies/employee-handbook-2026.pdf',
            'file_name' => 'employee-handbook-2026.pdf',
        ]);

        $hipaa = $jane->policies()->create([
            'title' => 'HIPAA Annual Training',
            'description' => 'Required annual HIPAA compliance training acknowledgment for all staff with access to protected health information.',
            'due_date' => '2026-03-15',
            'file_path' => 'policies/hipaa-training-2026.pdf',
            'file_name' => 'hipaa-training-2026.pdf',
        ]);

        $jane->policies()->create([
            'title' => 'Workplace Safety Guidelines',
            'description' => 'Updated workplace safety guidelines including emergency procedures, ergonomics standards, and incident reporting protocols.',
            'due_date' => '2026-04-30',
        ]);

        $mike->policies()->create([
            'title' => 'Remote Work Policy Update',
            'description' => 'Revised remote work policy outlining expectations for home office setup, availability, and communication standards.',
            'due_date' => '2026-02-10',
        ]);

        // Sign-offs for Employee Handbook
        Signoff::insert([
            [
                'policy_id' => $handbook->id,
                'user_id' => $alice->id,
                'signed_at' => Carbon::parse('2026-02-10 09:15:00'),
            ],
            [
                'policy_id' => $handbook->id,
                'user_id' => $bob->id,
                'signed_at' => Carbon::parse('2026-02-11 14:32:00'),
            ],
            [
                'policy_id' => $handbook->id,
                'user_id' => $charlie->id,
                'signed_at' => Carbon::parse('2026-02-14 11:08:00'),
            ],
        ]);

        // A few sign-offs for HIPAA too, for variety
        Signoff::insert([
            [
                'policy_id' => $hipaa->id,
                'user_id' => $alice->id,
                'signed_at' => Carbon::parse('2026-02-12 10:00:00'),
            ],
            [
                'policy_id' => $hipaa->id,
                'user_id' => $mike->id,
                'signed_at' => Carbon::parse('2026-02-13 16:45:00'),
            ],
        ]);
    }
}
