import { User as UserType } from "../types";
import { MainContainer } from "@/components/Global.tsx";

interface DashboardProps {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
}

export function Dashboard({ user, setUser }: DashboardProps) {
  return (
    <>
      <NavBar />
      <MainContainer>
        <PageHeader />
        <SummaryStats />
        <PolicyTable />
        <PageFooter />
      </MainContainer>
    </>
  );
}

function NavBar() {
  return(
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
            <span className="text-xs font-bold tracking-tight text-white">
              PS
            </span>
          </div>
          <span className="font-serif text-lg font-medium tracking-tight">
            PolicySignoff
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500 hidden sm:inline">
            Dana Williams
          </span>
          <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-600">
            DW
          </div>
          <button className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

function PageHeader() {
  return(
    <>
      {/* <!-- Page Header --> */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Policies
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track and acknowledge your organization's policies
          </p>
        </div>
        <button 
          onClick={() => {}}
          className="inline-flex items-center justify-center h-9 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap">
          + Create policy
        </button>
      </div>
    </>
  );
}

function SummaryStats() {
  return(
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-sm text-zinc-500">
            Total Policies
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">4</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-sm text-zinc-500">
            Overdue
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-semibold tracking-tight">1</p>
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
            <p className="text-2xl font-semibold tracking-tight">2</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-amber-200 bg-amber-50 text-amber-700">
              Pending
            </span>
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-sm text-zinc-500">Signed</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-semibold tracking-tight">1</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700">
              Signed
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

function PolicyTable() {
  return(
    <>
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">

        {/* <!-- Table Header --> */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 border-b border-zinc-100 bg-zinc-50/80 text-xs font-medium text-zinc-500 uppercase tracking-wider">
          <div className="col-span-5">Policy</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-2">Created By</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>

        {/* <!-- Row 1: Overdue --> */}
        <a href="detail.html" className="grid sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer items-center">
          <div className="sm:col-span-5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-900">
                2026 Employee Handbook
              </p>
              <span className="text-zinc-400 text-xs" title="Has attached file">&#128206;</span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-zinc-500">
              Mar 1, 2026
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-zinc-500">
              Jane Admin
            </p>
          </div>
          <div className="sm:col-span-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-200 bg-red-50 text-red-700">
              Overdue
            </span>
          </div>
          <div className="sm:col-span-1 flex justify-end">
            <span className="text-zinc-400 text-sm">&#8250;</span>
          </div>
        </a>

        {/* <!-- Row 2: Pending --> */}
        <a href="detail.html" className="grid sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer items-center">
          <div className="sm:col-span-5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-900">
                HIPAA Annual Training
              </p>
              <span className="text-zinc-400 text-xs" title="Has attached file">
                &#128206;
              </span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-zinc-500">
              Mar 15, 2026
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-zinc-500">
              Jane Admin
            </p>
          </div>
          <div className="sm:col-span-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-amber-200 bg-amber-50 text-amber-700">
              Pending
            </span>
          </div>
          <div className="sm:col-span-1 flex justify-end">
            <span className="text-zinc-400 text-sm">
              &#8250;
            </span>
          </div>
        </a>

        {/* <!-- Row 3: Pending --> */}
        <a href="detail.html" className="grid sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer items-center">
          <div className="sm:col-span-5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-900">
                Workplace Safety Guidelines
              </p>
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-zinc-500">
              Apr 30, 2026
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-zinc-500">
              Mike Manager
            </p>
          </div>
          <div className="sm:col-span-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-amber-200 bg-amber-50 text-amber-700">
              Pending
            </span>
          </div>
          <div className="sm:col-span-1 flex justify-end">
            <span className="text-zinc-400 text-sm">
              &#8250;
            </span>
          </div>
        </a>

        {/* <!-- Row 4: Signed --> */}
        <a href="detail.html" className="grid sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors cursor-pointer items-center">
          <div className="sm:col-span-5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-900">
                Remote Work Policy Update
              </p>
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-zinc-500">
              Feb 10, 2026
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-zinc-500">
              Jane Admin
            </p>
          </div>
          <div className="sm:col-span-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700">
              Signed
            </span>
          </div>
          <div className="sm:col-span-1 flex justify-end">
            <span className="text-zinc-400 text-sm">
              &#8250;
            </span>
          </div>
        </a>

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
