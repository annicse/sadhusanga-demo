export default function AppLoading() {
  return (
    <div className="mobile-page-transition space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-muted rounded-md" />
          <div className="h-4 w-64 bg-muted/60 rounded-md" />
        </div>
        <div className="h-9 w-28 bg-muted rounded-md" />
      </div>

      {/* Search / Filter bar skeleton */}
      <div className="h-10 w-full max-w-sm bg-muted rounded-md" />

      {/* Content list / card skeletons */}
      <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden divide-y divide-white/10">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted/60 rounded" />
            </div>
            <div className="h-5 w-16 bg-muted/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
