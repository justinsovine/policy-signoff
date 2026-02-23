import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api, ApiError } from "@/api";
import { BackLink,MainContainer, NavBar } from "@/components/Global";
import { PolicyDetail as PolicyDetailType, User as UserType } from "@/types";
import { formatDate, formatDateTime, getAvatarColor, getInitials, getStatusInfo } from "@/utils";

interface DetailProps {
  user: UserType | null;
  onLogout: () => void;
}

// Shows a policy's details and sign-off status.
export function Detail({ user, onLogout }: DetailProps) {
  const { id } = useParams<{ id: string }>(); // policy ID from the route, e.g. /policies/3
  const [policyDetail, setPolicyDetail] = useState<PolicyDetailType>();
  const [loading, setLoading] = useState(true);
  const [signingOff, setSigningOff] = useState(false); // true while POST is in-flight — disables the button
  const navigate = useNavigate();

  // Load the policy on mount (and if the ID somehow changes)
  useEffect(() => {
    api<PolicyDetailType>('GET', `/api/policies/${id}`)
      .then((data) => setPolicyDetail(data))
      .catch((err) => {
        if (err.status === 401) navigate('/login?expired=1');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  async function handleSignOff() {
    setSigningOff(true);
    try {
      await api('POST', `/api/policies/${id}/signoff`);
    } catch (err: unknown) {
      const e = err as ApiError;
      if (e.status === 401) { navigate('/login?expired=1'); return; }
      if (e.status !== 409) { setSigningOff(false); return; } // unexpected error (bail)
      // 409 means already signed (e.g. double-click race). treat it as success and re-fetch
    }
    // Re-fetch the full policy so the badge, confirmation box, and table all update together
    api<PolicyDetailType>('GET', `/api/policies/${id}`)
      .then((data) => setPolicyDetail(data))
      .catch((err) => { if (err.status === 401) navigate('/login?expired=1'); })
      .finally(() => setSigningOff(false));
  }

  if (loading || !policyDetail) return null;

  return (
    <>
      <NavBar user={user} onLogout={onLogout} />
      <MainContainer>
        <BackLink />
        <PolicyHeader
          policy={policyDetail}
          currentUser={user}
          onSignOff={handleSignOff}
          signingOff={signingOff}
        />
        <SignoffSummary
          signoffSummary={policyDetail.signoff_summary}
          currentUser={user}
        />
      </MainContainer>
    </>
  );
}

interface PolicyHeaderProps {
  policy: PolicyDetailType;
  currentUser: UserType | null;
  onSignOff: () => void;
  signingOff: boolean;
}
// Policy info card with the sign-off action.
function PolicyHeader({ policy, currentUser, onSignOff, signingOff }: PolicyHeaderProps) {
  const { statusLabel, statusStyle } = getStatusInfo(policy.signed, policy.overdue);

  return(
    <>
      {/* Policy Header */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 sm:p-8">

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight">
            {policy.title}
          </h1>
          {(policy.signed || policy.overdue) && (
            // Only show badge for Signed or Overdue
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap self-start ${statusStyle}`}>
              {statusLabel}
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500 mb-6 pb-6 border-b border-zinc-100">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">
              Created by
            </span>
            <span className="font-medium text-zinc-700">
              {policy.created_by}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">
              Due date
            </span>
            <span className="font-medium text-zinc-700">
              {formatDate(policy.due_date)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">
              Signed
            </span>
            <span className="font-medium text-zinc-700">
              {policy.signoff_summary.signed_count} of {policy.signoff_summary.total_users} users
            </span>
          </div>
        </div>

        {/* Download button */}
        <div className="mb-6 pb-6 border-b border-zinc-100">
          <a
            href="#"
            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <span className="text-base leading-none">
              &darr;
            </span>
            Download Document
            <span className="text-zinc-400 font-normal">
              -&nbsp; {policy.file_name}
            </span>
          </a>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Description
          </h2>
          <p className="text-sm leading-relaxed text-zinc-700">
            {policy.description}
          </p>
        </div>

        {/* Sign-off action */}
        {policy.signed ? (() => {
          // Pull the current user's signed_at from the summary to show in the confirmation box
          // IIFE (Immediately Invoked Function Expression) used so we can declare signedAt before returning JSX
          const signedAt = policy.signoff_summary.signoffs.find((s) => s.user_id === currentUser?.id)?.signed_at ?? null;
          return (
            <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-200 bg-white text-emerald-700 self-start">
                Signed
              </span>
              <div>
                <p className="text-sm font-medium text-emerald-900">
                  You signed off on this policy
                </p>
                <p className="text-xs text-emerald-700">
                  {formatDateTime(signedAt)}
                </p>
              </div>
            </div>
          );
        })() : (
          <>
            <button
              onClick={onSignOff}
              disabled={signingOff}
              className="w-full h-12 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              Sign Off on This Policy
            </button>
            <p className="mt-2 text-center text-xs text-zinc-400">
              By signing off, you acknowledge that you have read and understood this policy
            </p>
          </>
        )}

      </div>
    </>
  );
}

interface SignoffSummaryProps {
  signoffSummary: PolicyDetailType['signoff_summary'];
  currentUser: UserType | null;
}
// Lists sign-off status for each user on this policy.
function SignoffSummary({ signoffSummary, currentUser }: SignoffSummaryProps) {
  return(
    <>
      {/* Sign-off Summary */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold tracking-tight">
            Sign-off Summary
          </h2>
          <span className="text-sm text-zinc-500">
            {signoffSummary.signed_count} of {signoffSummary.total_users} signed
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">

          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 border-b border-zinc-100 bg-zinc-50/80 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <div className="col-span-5">
              User
            </div>
            <div className="col-span-4">
              Status
            </div>
            <div className="col-span-3">
              Signed At
            </div>
          </div>

          {signoffSummary.signoffs.map((data) => {
            const isCurrentUser = data.user_id === currentUser?.id;
            const displayName = isCurrentUser ? `${data.user} (You)` : data.user;
            const initials = getInitials(data.user); // always from the real name, not displayName
            const avatarColor = getAvatarColor(data.user);
            const signed_at = formatDate(data.signed_at);
            const signed = data.signed_at !== null;
            const { statusLabel, statusStyle } = getStatusInfo(signed, data.overdue);

            return (
            // Highlight the current user's row so it stands out at a glance
            <div
              key={data.user_id}
              className={`grid sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-3.5 border-b border-zinc-100 items-center${isCurrentUser ? ' bg-zinc-50/50' : ''}`}
            >
              <div className="sm:col-span-5 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${avatarColor}`}>
                  {initials}
                </div>
                <span className="text-sm font-medium text-zinc-900">
                  {displayName}
                </span>
              </div>
              <div className="sm:col-span-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle}`}>
                  {statusLabel}
                </span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-sm text-zinc-500">
                  {signed_at}
                </span>
              </div>
            </div>
            );
          })}

        </div>
      </div>
    </>
  );
}
