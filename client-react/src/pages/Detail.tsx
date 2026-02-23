import { BackLink,MainContainer, NavBar } from "@/components/Global.tsx";
import { PolicyDetail as PolicyDetailType,User as UserType } from "@/types";
import { formatDate,getAvatarColor, getInitials, getStatusInfo } from "@/utils";

interface DetailProps {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
}

// Shows a policy's details and sign-off status.
export function Detail({ user, setUser }: DetailProps) {
  // Replace with API response (PolicyDetail)
  const policy: PolicyDetailType = {
    id: 1,
    title: "2026 Employee Handbook",
    description: "All employees must review and acknowledge the updated 2026 Employee Handbook. Key changes include updated remote work guidelines, revised PTO policy, and new data security requirements.",
    due_date: "2026-03-01",
    created_by: "Jane Admin",
    has_file: true,
    file_name: "Employee_Handbook_2026.pdf",
    signed: false,
    overdue: true,
    signoff_summary: {
      total_users: 5,
      signed_count: 3,
      signoffs: [
        { user: "Alice Thompson", signed_at: "2026-02-10", overdue: false },
        { user: "Bob Martinez",   signed_at: "2026-02-11", overdue: false },
        { user: "Charlie Kim",    signed_at: "2026-02-14", overdue: false },
        { user: "Dana Williams",  signed_at: null,          overdue: true  },
        { user: "You",            signed_at: null,          overdue: true  },
      ],
    },
  };

  return (
    <>
      <NavBar />
      <MainContainer>
        <BackLink />
        <PolicyHeader policy={policy} />
        <SignoffSummary signoffSummary={policy.signoff_summary} />
      </MainContainer>
    </>
  );
}

interface PolicyHeaderProps {
  policy: PolicyDetailType;
}
// Policy info card with the sign-off action.
function PolicyHeader({ policy }: PolicyHeaderProps) {
  return(
    <>
      {/* Policy Header */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 sm:p-8">

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight">
            {policy.title}
          </h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-200 bg-red-50 text-red-700 whitespace-nowrap self-start">
            Overdue
          </span>
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

        {/* Sign Off Button */}
        <button className="w-full h-12 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors">
          Sign Off on This Policy
        </button>
        <p className="mt-2 text-center text-xs text-zinc-400">
          By signing off, you acknowledge that you have read and understood this policy
        </p>

      </div>
    </>
  );
}

interface SignoffSummaryProps {
  signoffSummary: PolicyDetailType['signoff_summary'];
}
// Lists sign-off status for each user on this policy.
function SignoffSummary({ signoffSummary }: SignoffSummaryProps) {
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
            const initials    = getInitials(data.user);
            const avatarColor = getAvatarColor(data.user);
            const signed_at   = formatDate(data.signed_at);
            const signed      = data.signed_at !== null;
            const { statusLabel, statusStyle } = getStatusInfo(signed, data.overdue);

            return (
            <div
              key={data.user}
              className="grid sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-3.5 border-b border-zinc-100 items-center"
            >
              <div className="sm:col-span-5 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${avatarColor}`}>
                  {initials}
                </div>
                <span className="text-sm font-medium text-zinc-900">
                  {data.user}
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
