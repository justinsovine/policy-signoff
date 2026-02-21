import { User as UserType, Policy as PolicyType } from "@/types";
import { MainContainer, NavBar } from "@/components/Global.tsx";
import { Link } from "react-router-dom";
import { Plus } from 'lucide-react';

interface DashboardProps {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
}

export function Dashboard({ user, setUser }: DashboardProps) {
  // Mock data
  const tableData: PolicyType[] = [
    {
      id: 1,
      title: '2026 Employee Handbook',
      due_date: '2026-03-01',
      created_by: 'Jane Admin',
      has_file: true,
      signed: false,
      overdue: true,
    },
    {
      id: 2,
      title: 'HIPAA Annual Training',
      due_date: '2026-03-15',
      created_by: 'Jane Admin',
      has_file: true,
      signed: false,
      overdue: false,
    },
    {
      id: 3,
      title: 'Workplace Safety Guidelines',
      due_date: '2026-04-30',
      created_by: 'Mike Manager',
      has_file: false,
      signed: false,
      overdue: false,
    },
    {
      id: 4,
      title: 'Remote Work Policy Update',
      due_date: '2026-02-10',
      created_by: 'Jane Admin',
      has_file: false,
      signed: true,
      overdue: false,
    },
  ];

  return (
    <>
      <NavBar />
      <MainContainer>
        <DashboardHeader />
        <SummaryStats tableData={tableData} />
        <PolicyTable tableData={tableData} />
        <PageFooter />
      </MainContainer>
    </>
  );
}

// ...
export function DashboardHeader() {
  return(
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Policies
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track and acknowledge your organization's policies
          </p>
        </div>
        <Link 
          to="/create"
          className="inline-flex items-center justify-center h-9 px-3 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap">
          <Plus className="size-4 mr-1" /> Create Policy
        </Link>
      </div>
    </>
  );
}

function SummaryStats({
  tableData,
} : {
  tableData: PolicyType[];
}) {
  const totalPolicies: number = tableData.length;
  const overduePolicies: number = tableData.filter((data) => data.overdue === true).length;
  const pendingPolicies: number = tableData.filter((data) => data.overdue === false && data.signed === false).length;
  const signedPolicies: number = tableData.filter((data) => data.signed === true).length;

  return(
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-sm text-zinc-500">
            Total Policies
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {totalPolicies}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-sm text-zinc-500">
            Overdue
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-semibold tracking-tight">
              {overduePolicies}
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-red-200 bg-red-50 text-red-700">
              Overdue
            </span>
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-sm text-zinc-500">
            Pending
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-semibold tracking-tight">
              {pendingPolicies}
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-amber-200 bg-amber-50 text-amber-700">
              Pending
            </span>
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-sm text-zinc-500">
            Signed
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-semibold tracking-tight">
              {signedPolicies}
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700">
              Signed
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

// 
function getStatusInfo(signed: boolean, overdue: boolean) {
  if (signed) return { policyLabel: 'Signed', policyStyle: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  if (overdue) return { policyLabel: 'Overdue', policyStyle: 'border-red-200 bg-red-50 text-red-700' };
  return { policyLabel: 'Pending', policyStyle: 'border-amber-200 bg-amber-50 text-amber-700' };
}

function PolicyTable({
  tableData,
} : {
  tableData: PolicyType[];
}) {

  return(
    <>
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">

        <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 border-b border-zinc-100 bg-zinc-50/80 text-xs font-medium text-zinc-500 uppercase tracking-wider">
          <div className="col-span-5">Policy</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-2">Created By</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>

        {tableData.map((policy) => {
          const { policyLabel, policyStyle } = getStatusInfo(policy.signed, policy.overdue);
          
          return(
            <Link
              key={policy.id} 
              to={`/policies/${policy.id}`}
              className="grid sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer items-center"
            >
              <div className="sm:col-span-5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-900">
                    {policy.title}
                  </p>
                  {policy.has_file && <span className="text-zinc-400 text-xs" title="Has attached file">&#128206;</span>}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-zinc-500">
                  {policy.due_date}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-zinc-500">
                  {policy.created_by}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${policyStyle}`}>
                  {policyLabel}
                </span>
              </div>
              <div className="sm:col-span-1 flex justify-end">
                <span className="text-zinc-400 text-sm">&#8250;</span>
              </div>
            </Link>
          );
        })}

      </div>
    </>
  );
}

function PageFooter() {
  return(
    <>
      <p className="mt-4 text-xs text-zinc-400">
        Showing all 4 policies, sorted by due date
      </p>
    </>
  );
}
