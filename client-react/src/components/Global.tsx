import { ReactNode } from 'react';
import { Link } from "react-router-dom";

import { User as UserType } from "@/types";

// Wraps page content with a max-width container and consistent padding
export function MainContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return(
    <main className={`max-w-6xl mx-auto px-4 sm:px-6 py-8 ${className}`}>
      {children}
    </main>
  );
}

interface NavBarProps {
  user: UserType | null;
  onLogout: () => void;
}

// Sticky top bar with the PS logo and sign-out button
export function NavBar({ user, onLogout }: NavBarProps) {
  // Get initials from the user's full name (e.g. "Justin Sovine" to "JS")
  const parts = user?.name?.split(' ') ?? [];
  const initials = parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.[0] ?? '').toUpperCase();

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
            {user?.name}
          </span>
          <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-600">
            {initials}
          </div>
          <button
            onClick={onLogout}
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

// Arrow link back to the dashboard
export function BackLink() {
  return(
    <>
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
      >
        <span className="text-lg leading-none">
          &larr;
        </span>
        Back to policies
      </Link>
    </>
  );
}
