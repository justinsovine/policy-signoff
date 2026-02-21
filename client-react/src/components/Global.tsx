// ...
export function MainContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return(
    <main className={`max-w-6xl mx-auto px-4 sm:px-6 py-8 ${className}`}>
      {children}
    </main>
  );
}

// ...
export function NavBar() {
  return(
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="PolicySignoff" className="w-8 h-8 rounded-lg" />
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
          <button
            onClick={() => {
              
            }}
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}