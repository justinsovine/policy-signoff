<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileController extends Controller
{
    public function uploadUrl(Request $request, Policy $policy)
    {
        $validated = $request->validate([
            'filename' => ['required', 'string', 'regex:/\.(pdf|doc|docx)$/i'],
            'content_type' => ['required', 'in:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        ]);

        $ext = pathinfo($validated['filename'], PATHINFO_EXTENSION);
        $key = 'policies/' . Str::uuid() . '.' . strtolower($ext);

        $disk = Storage::disk('s3');
        $client = $disk->getAdapter()->getClient();
        $bucket = config('filesystems.disks.s3.bucket');

        $command = $client->getCommand('PutObject', [
            'Bucket' => $bucket,
            'Key' => $key,
            'ContentType' => $validated['content_type'],
        ]);

        $presignedRequest = $client->createPresignedRequest($command, '+15 minutes');
        $internalUrl = (string) $presignedRequest->getUri();

        $externalBase = rtrim(env('AWS_URL'), '/');
        $uploadUrl = preg_replace('#^https?://[^/]+#', $externalBase, $internalUrl);

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

        $internalUrl = Storage::disk('s3')->temporaryUrl($policy->file_path, now()->addMinutes(60));

        $externalBase = rtrim(env('AWS_URL'), '/');
        $downloadUrl = preg_replace('#^https?://[^/]+#', $externalBase, $internalUrl);

        return response()->json([
            'download_url' => $downloadUrl,
            'file_name' => $policy->file_name,
        ]);
    }
}
