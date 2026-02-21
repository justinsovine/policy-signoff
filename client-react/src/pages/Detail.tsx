import { User as UserType, Policy as PolicyType } from "@/types";
import { MainContainer, NavBar } from "@/components/Global.tsx";
import { Link } from "react-router-dom";

interface DetailProps {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
}

export function Detail({ user, setUser }: DetailProps) {
  return (
    <>
      <NavBar />
      <MainContainer>
        {/* <!-- Back link --> */}
        <a href="dashboard.html" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6">
          <span className="text-lg leading-none">&larr;</span>
          Back to policies
        </a>

        {/* <!-- Policy Header --> */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6 sm:p-8">

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight">2026 Employee Handbook</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-200 bg-red-50 text-red-700 whitespace-nowrap self-start">Overdue</span>
          </div>

          {/* <!-- Metadata --> */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500 mb-6 pb-6 border-b border-zinc-100">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Created by</span>
              <span className="font-medium text-zinc-700">Jane Admin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Due date</span>
              <span className="font-medium text-zinc-700">March 1, 2026</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Signed</span>
              <span className="font-medium text-zinc-700">3 of 5 users</span>
            </div>
          </div>

          {/* <!-- Download button --> */}
          <div className="mb-6 pb-6 border-b border-zinc-100">
            <a href="#" className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              <span className="text-base leading-none">&darr;</span>
              Download Document
              <span className="text-zinc-400 font-normal">&mdash; Employee_Handbook_2026.pdf</span>
            </a>
          </div>

          {/* <!-- Description --> */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Description</h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              All employees must review and acknowledge the updated 2026 Employee Handbook. Key changes include updated remote work guidelines, revised PTO policy, and new data security requirements.
            </p>
          </div>

          {/* <!-- Sign Off Button --> */}
          <button className="w-full h-12 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors">
            Sign Off on This Policy
          </button>
          <p className="mt-2 text-center text-xs text-zinc-400">By signing off, you acknowledge that you have read and understood this policy</p>

        </div>

        {/* <!-- Sign-off Summary --> */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold tracking-tight">Sign-off Summary</h2>
            <span className="text-sm text-zinc-500">3 of 5 signed</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">

            {/* <!-- Table Header --> */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 border-b border-zinc-100 bg-zinc-50/80 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              <div className="col-span-5">User</div>
              <div className="col-span-4">Status</div>
              <div className="col-span-3">Signed At</div>
            </div>

            {/* <!-- Alice: Signed --> */}
            <div className="grid sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-3.5 border-b border-zinc-100 items-center">
              <div className="sm:col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-700">AT</div>
                <span className="text-sm font-medium text-zinc-900">Alice Thompson</span>
              </div>
              <div className="sm:col-span-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700">Signed</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-sm text-zinc-500">Feb 10, 2026</span>
              </div>
            </div>

            {/* <!-- Bob: Signed --> */}
            <div className="grid sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-3.5 border-b border-zinc-100 items-center">
              <div className="sm:col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-700">BM</div>
                <span className="text-sm font-medium text-zinc-900">Bob Martinez</span>
              </div>
              <div className="sm:col-span-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700">Signed</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-sm text-zinc-500">Feb 11, 2026</span>
              </div>
            </div>

            {/* <!-- Charlie: Signed --> */}
            <div className="grid sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-3.5 border-b border-zinc-100 items-center">
              <div className="sm:col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-700">CK</div>
                <span className="text-sm font-medium text-zinc-900">Charlie Kim</span>
              </div>
              <div className="sm:col-span-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700">Signed</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-sm text-zinc-500">Feb 14, 2026</span>
              </div>
            </div>

            {/* <!-- Dana: Overdue --> */}
            <div className="grid sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-3.5 border-b border-zinc-100 items-center">
              <div className="sm:col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-semibold text-red-700">DW</div>
                <span className="text-sm font-medium text-zinc-900">Dana Williams</span>
              </div>
              <div className="sm:col-span-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-200 bg-red-50 text-red-700">Overdue</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-sm text-zinc-400">&mdash;</span>
              </div>
            </div>

            {/* <!-- You: Overdue --> */}
            <div className="grid sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-3.5 items-center bg-zinc-50/50">
              <div className="sm:col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-semibold text-red-700">You</div>
                <div>
                  <span className="text-sm font-medium text-zinc-900">You</span>
                  <span className="text-xs text-zinc-400 ml-1.5">(current user)</span>
                </div>
              </div>
              <div className="sm:col-span-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-200 bg-red-50 text-red-700">Overdue</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-sm text-zinc-400">&mdash;</span>
              </div>
            </div>

          </div>
        </div>
      </MainContainer>
    </>
  );
}