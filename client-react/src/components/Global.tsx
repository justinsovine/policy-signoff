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