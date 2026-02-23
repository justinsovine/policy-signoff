import { type SubmitEvent, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api, ApiError } from "@/api";
import { BackLink, MainContainer, NavBar } from "@/components/Global";
import { Policy as PolicyType, User as UserType, ValidationErrors } from "@/types";

// Maps file extensions to MIME types that the upload-url endpoint validates against
const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// Extracts the extension from a filename and looks up its MIME type
function getContentType(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPES[ext] ?? null;
}

// Converts raw byte count to a human-readable string (e.g. 2.4 MB)
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface CreateProps {
  user: UserType | null;
  onLogout: () => void;
}

// Handles creating a new policy with a required file attachment.
// Two-step submit: POST the policy metadata to the API, then upload the file to S3 via presigned URL.
export function Create({ user, onLogout }: CreateProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null); // ref to the hidden file input so we can reset it on "Remove"

  // Controlled form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState<File | null>(null); // the browser File object from the native picker

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({}); // keyed by field name, matches Laravel's 422 shape

  // Validates the selected file client-side before accepting it
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null; // only care about the first file
    if (!selected) return;

    const contentType = getContentType(selected.name);
    if (!contentType) {
      setErrors((prev) => ({ ...prev, file: ['File must be a PDF, DOC, or DOCX.'] }));
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, file: ['File must be under 10 MB.'] }));
      return;
    }

    setFile(selected);
    setErrors((prev) => {
      const { file: _, ...rest } = prev; // drop the file key from errors, keep the rest
      return rest;
    });
  }

  // Clears both the React state and the native input (so re-selecting the same file triggers onChange)
  function handleRemoveFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Handles the two-step create flow: save the policy, then upload the file to S3
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setErrors({});

    if (!file) {
      setErrors({ file: ['Please attach a file.'] });
      return;
    }

    setSubmitting(true);

    // Step 1: create the policy record in the database
    let policyId: number;
    try {
      const policy = await api<PolicyType>('POST', '/api/policies', {
        title,
        description,
        due_date: dueDate,
      });
      policyId = policy.id;
    } catch (err: unknown) {
      const e = err as ApiError;
      if (e.status === 401) { navigate('/login?expired=1'); return; }
      if (e.status === 422 && 'errors' in e) {
        setErrors(e.errors as ValidationErrors); // Laravel sends field-keyed error arrays
      }
      setSubmitting(false);
      return;
    }

    // Step 2: get a presigned URL from the API and PUT the file directly to MinIO.
    // If this fails the policy still exists without a file - we navigate anyway.
    try {
      const contentType = getContentType(file.name)!; // safe because we validated above
      const { upload_url } = await api<{ upload_url: string; key: string }>(
        'POST', `/api/policies/${policyId}/upload-url`, {
          filename: file.name,
          content_type: contentType,
        }
      );

      // raw fetch to MinIO - no session cookies or XSRF token, just the file body
      await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      });
    } catch {
      // upload failed but the policy was created - still navigate to the detail page
    }

    navigate(`/policies/${policyId}`);
  }

  return (
    <>
      <NavBar user={user} onLogout={onLogout} />
      <MainContainer>
        <BackLink />

        <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
          Create Policy
        </h1>
        <p className="text-sm text-zinc-500 mb-8">
          Create a new policy for your organization. All users will be able to view and sign off on it.
        </p>

        <form
          className="space-y-6"
          onSubmit={handleSubmit}
        >

          {/* Title */}
          <div>
            <label
              className="block text-sm font-medium text-zinc-700 mb-1.5"
              htmlFor="title"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2026 Employee Handbook"
              className={`w-full h-10 px-3 text-sm border rounded-lg bg-white placeholder:text-zinc-400 transition-shadow ${errors.title ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-200'}`}
            />
            {errors.title && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.title[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-sm font-medium text-zinc-700 mb-1.5"
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the policy and what employees need to know..."
              className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white placeholder:text-zinc-400 transition-shadow resize-y ${errors.description ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-200'}`}
            ></textarea>
            {errors.description ? (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.description[0]}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-zinc-400">
                Provide details about the policy content, key changes, and what acknowledgment means.
              </p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label
              className="block text-sm font-medium text-zinc-700 mb-1.5"
              htmlFor="due_date"
            >
              Due date
            </label>
            <input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`w-full sm:w-64 h-10 px-3 text-sm border rounded-lg bg-white text-zinc-700 transition-shadow ${errors.due_date ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-200'}`}
            />
            {errors.due_date ? (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.due_date[0]}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-zinc-400">
                Deadline for all users to sign off on this policy.
              </p>
            )}
          </div>

          {/* File Attachment */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Attachment
            </label>

            {file ? (
              /* File selected */
              <div className={`border rounded-lg p-4 flex items-center gap-4 ${errors.file ? 'border-red-300' : 'border-zinc-200'}`}>
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
                    {file.name.split('.').pop()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-sm text-zinc-500 hover:text-red-600 transition-colors flex-shrink-0 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              /* Empty state */
              <div className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-zinc-300 transition-colors ${errors.file ? 'border-red-300' : 'border-zinc-200'}`}>
                <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                  <span className="text-zinc-400 text-lg">
                    &uarr;
                  </span>
                </div>
                <p className="text-sm text-zinc-600 mb-1">
                  Drop your file here, or
                </p>
                <label className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer">
                  Select file
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                <p className="mt-3 text-xs text-zinc-400">
                  PDF, DOC, or DOCX up to 10 MB
                </p>
              </div>
            )}

            {errors.file && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.file[0]}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-200 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
              <Link
                to="/"
                className="inline-flex items-center justify-center h-10 px-5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center h-10 px-5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Policy'}
              </button>
            </div>
          </div>

        </form>
      </MainContainer>
    </>
  );
}
