// app/components/SkeletonLoaders.tsx
"use client";

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero card skeleton */}
      <div className="rounded-3xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-8 w-36" />
            <div className="skeleton h-3 w-28" />
            <div className="flex gap-4 mt-4">
              <div className="space-y-1">
                <div className="skeleton h-7 w-10" />
                <div className="skeleton h-3 w-16" />
              </div>
              <div className="space-y-1">
                <div className="skeleton h-7 w-10" />
                <div className="skeleton h-3 w-16" />
              </div>
              <div className="space-y-1">
                <div className="skeleton h-7 w-16" />
                <div className="skeleton h-3 w-16" />
              </div>
            </div>
          </div>
          <div className="skeleton w-28 h-28 rounded-full" />
        </div>
        <div className="skeleton h-1.5 w-full rounded-full" />
      </div>

      {/* Shopping mode button skeleton */}
      <div className="skeleton h-16 w-full rounded-2xl" />

      {/* Settings skeleton */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="skeleton w-9 h-9 rounded-xl" />
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton w-10 h-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search skeleton */}
      <div className="skeleton h-24 w-full rounded-2xl" />
      {/* Product cards skeleton */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 px-3 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="skeleton w-7 h-7 rounded-full" />
            <div className="skeleton w-9 h-9 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
            <div className="skeleton h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <div className="skeleton w-5 h-5 rounded" />
              <div className="skeleton h-3 w-20" />
            </div>
            <div className="skeleton h-6 w-24" />
          </div>
        ))}
      </div>
      <div className="skeleton h-48 w-full rounded-2xl" />
    </div>
  );
}
