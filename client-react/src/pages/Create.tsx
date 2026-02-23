import { Link } from "react-router-dom";

import { BackLink,MainContainer, NavBar } from "@/components/Global";
import { Policy as PolicyType,User as UserType } from "@/types";

interface CreateProps {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
}

// Form for creating a new policy.
export function Create({ user, setUser }: CreateProps) {
  return (
    <>
      <NavBar />
      <MainContainer>
        <BackLink />

        <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
          Create Policy
        </h1>
        <p className="text-sm text-zinc-500 mb-8">
          Create a new policy for your organization. All users will be able to view and sign off on it.
        </p>

        <form className="space-y-6">

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
              placeholder="e.g. 2026 Employee Handbook"
              className="w-full h-10 px-3 text-sm border border-red-300 ring-1 ring-red-300 rounded-lg bg-white placeholder:text-zinc-400 transition-shadow"
            />
            <p className="mt-1.5 text-sm text-red-600">
              The title field is required.
            </p>
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
              placeholder="Describe the policy and what employees need to know..."
              className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg bg-white placeholder:text-zinc-400 transition-shadow resize-y"
            ></textarea>
            <p className="mt-1.5 text-xs text-zinc-400">
              Provide details about the policy content, key changes, and what acknowledgment means.
            </p>
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
              className="w-full sm:w-64 h-10 px-3 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-700 transition-shadow"
            />
            <p className="mt-1.5 text-xs text-zinc-400">
              Deadline for all users to sign off on this policy.
            </p>
          </div>

          {/* File Upload Drop Zone */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Attachment <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <div className="border-2 border-dashed border-zinc-200 rounded-lg p-8 text-center hover:border-zinc-300 transition-colors">
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
                  type="file"
                  className="sr-only"
                />
              </label>
              <p className="mt-3 text-xs text-zinc-400">
                PDF, DOC, or DOCX up to 10 MB
              </p>
            </div>
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
                className="inline-flex items-center justify-center h-10 px-5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Create Policy
              </button>
            </div>
          </div>

        </form>
      </MainContainer>
    </>
  );
}
