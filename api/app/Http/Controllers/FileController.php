<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use Aws\S3\S3Client;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FileController extends Controller
{
    public function uploadUrl(Request $request, Policy $policy)
    {
        if ($request->user()->id !== $policy->created_by) {
            abort(403);
        }

        $validated = $request->validate([
            'filename' => ['required', 'string', 'regex:/\.(pdf|doc|docx)$/i'],
            'content_type' => ['required', 'in:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        ]);

        $ext = pathinfo($validated['filename'], PATHINFO_EXTENSION);
        $key = 'policies/' . Str::uuid() . '.' . strtolower($ext);

        $disk = config('filesystems.disks.s3');
        $client = $this->makeS3Client($disk);

        $command = $client->getCommand('PutObject', [
            'Bucket' => $disk['bucket'],
            'Key' => $key,
            'ContentType' => $validated['content_type'],
        ]);

        $uploadUrl = (string) $client->createPresignedRequest($command, '+15 minutes')->getUri();

        $policy->update([
            'file_path' => $key,
            'file_name' => $validated['filename'],
        ]);

        return response()->json([
            'upload_url' => $uploadUrl,
            'key' => $key,
        ]);
    }

    public function downloadUrl(Request $request, Policy $policy)
    {
        if (! $policy->file_path) {
            return response()->json(['message' => 'No file attached'], 404);
        }

        $disk = config('filesystems.disks.s3');
        $client = $this->makeS3Client($disk);

        $command = $client->getCommand('GetObject', [
            'Bucket' => $disk['bucket'],
            'Key'    => $policy->file_path,
        ]);
        $downloadUrl = (string) $client->createPresignedRequest($command, '+60 minutes')->getUri();

        return response()->json([
            'download_url' => $downloadUrl,
            'file_name' => $policy->file_name,
        ]);
    }

    // Use the external URL (AWS_URL) as the S3 endpoint so presigned URLs are
    // signed for the host the browser will actually send requests to.
    private function makeS3Client(array $disk): S3Client
    {
        return new S3Client([
            'version'                 => 'latest',
            'region'                  => $disk['region'],
            'endpoint'                => $disk['url'],
            'use_path_style_endpoint' => $disk['use_path_style_endpoint'] ?? true,
            'credentials'             => [
                'key'    => $disk['key'],
                'secret' => $disk['secret'],
            ],
        ]);
    }
}
