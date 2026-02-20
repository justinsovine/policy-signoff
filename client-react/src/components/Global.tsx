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
export function PageHeader() {
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