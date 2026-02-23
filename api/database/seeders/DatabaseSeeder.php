<?php

namespace Database\Seeders;

use App\Models\Policy;
use App\Models\Signoff;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        Signoff::query()->delete();
        Policy::query()->delete();
        User::query()->delete();

        $jane    = User::create(['name' => 'Jane Admin',     'email' => 'jane@example.com',    'password' => Hash::make('password')]);
        $mike    = User::create(['name' => 'Mike Manager',   'email' => 'mike@example.com',    'password' => Hash::make('password')]);
        $alice   = User::create(['name' => 'Alice Thompson', 'email' => 'alice@example.com',   'password' => Hash::make('password')]);
        $bob     = User::create(['name' => 'Bob Martinez',   'email' => 'bob@example.com',     'password' => Hash::make('password')]);
        $charlie = User::create(['name' => 'Charlie Kim',    'email' => 'charlie@example.com', 'password' => Hash::make('password')]);
        $dana    = User::create(['name' => 'Dana Williams',  'email' => 'dana@example.com',    'password' => Hash::make('password')]);

        // Each entry: creator, policy fields, and an array of [user, signed_at] pairs.
        // All six users owe sign-offs on every policy — signers here are the ones who have.
        $policies = [
            [
                'creator'     => $jane,
                'title'       => '2026 Employee Handbook',
                'description' => 'Annual employee handbook covering company policies, benefits, code of conduct, and expectations for the 2026 fiscal year. All employees are required to review and acknowledge receipt.',
                'due_date'    => '2026-01-15',
                'file_name'   => 'employee-handbook-2026.pdf',
                'slug'        => 'employee-handbook-2026',
                'signers'     => [
                    [$alice,   '2026-01-10 09:15:00'],
                    [$bob,     '2026-01-12 14:32:00'],
                    [$charlie, '2026-01-13 11:08:00'],
                    [$mike,    '2026-01-14 16:20:00'],
                ],
            ],
            [
                'creator'     => $jane,
                'title'       => 'HIPAA Annual Training Acknowledgment',
                'description' => 'Required annual acknowledgment of HIPAA compliance training for all staff with access to protected health information. Failure to complete by the deadline may result in restricted system access.',
                'due_date'    => '2026-02-01',
                'file_name'   => 'hipaa-training-2026.pdf',
                'slug'        => 'hipaa-training-2026',
                'signers'     => [
                    [$alice, '2026-01-28 10:00:00'],
                    [$mike,  '2026-01-30 16:45:00'],
                ],
            ],
            [
                'creator'     => $mike,
                'title'       => 'Remote Work Policy 2026',
                'description' => 'Revised remote work policy outlining expectations for home office setup, core availability windows, communication standards, and equipment reimbursement procedures.',
                'due_date'    => '2026-02-28',
                'file_name'   => 'remote-work-policy-2026.pdf',
                'slug'        => 'remote-work-policy-2026',
                'signers'     => [
                    [$jane,  '2026-02-15 08:30:00'],
                    [$alice, '2026-02-17 11:45:00'],
                    [$bob,   '2026-02-18 09:20:00'],
                ],
            ],
            [
                'creator'     => $jane,
                'title'       => 'Workplace Safety Guidelines',
                'description' => 'Updated workplace safety guidelines covering emergency procedures, ergonomics standards, incident reporting protocols, and return-to-work procedures following injury or illness.',
                'due_date'    => '2026-03-15',
                'file_name'   => 'workplace-safety-guidelines.pdf',
                'slug'        => 'workplace-safety-guidelines',
                'signers'     => [
                    [$jane,  '2026-02-20 09:00:00'],
                    [$alice, '2026-02-21 14:15:00'],
                    [$bob,   '2026-02-21 15:30:00'],
                    [$mike,  '2026-02-22 10:45:00'],
                ],
            ],
            [
                'creator'     => $mike,
                'title'       => 'Code of Conduct Refresh',
                'description' => 'Updated code of conduct reflecting organizational values, conflict resolution procedures, anti-harassment commitments, and revised social media guidelines effective Q2 2026.',
                'due_date'    => '2026-04-30',
                'file_name'   => 'code-of-conduct-2026.pdf',
                'slug'        => 'code-of-conduct-2026',
                'signers'     => [
                    [$jane, '2026-02-22 13:00:00'],
                ],
            ],
            [
                'creator'     => $jane,
                'title'       => 'IT Acceptable Use Policy',
                'description' => 'Acceptable use policy for all company systems, devices, and networks. Covers software installation, data classification, password requirements, and security incident reporting.',
                'due_date'    => '2026-06-30',
                'file_name'   => 'it-acceptable-use-policy.pdf',
                'slug'        => 'it-acceptable-use-policy',
                'signers'     => [],
            ],
        ];

        foreach ($policies as $data) {
            $key     = 'policies/' . $data['slug'] . '.pdf';
            $content = file_get_contents(database_path('seeders/files/' . $data['slug'] . '.pdf'));

            Storage::disk('s3')->put($key, $content, ['mimetype' => 'application/pdf']);

            $policy = $data['creator']->policies()->create([
                'title'       => $data['title'],
                'description' => $data['description'],
                'due_date'    => $data['due_date'],
                'file_path'   => $key,
                'file_name'   => $data['file_name'],
            ]);

            foreach ($data['signers'] as [$user, $signedAt]) {
                Signoff::create([
                    'policy_id' => $policy->id,
                    'user_id'   => $user->id,
                    'signed_at' => $signedAt,
                ]);
            }
        }
    }

}
