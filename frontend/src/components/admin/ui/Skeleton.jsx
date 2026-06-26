export function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-20" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}
