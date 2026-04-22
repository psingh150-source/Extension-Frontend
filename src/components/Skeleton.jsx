import React from 'react';

export default function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--border)] p-3">
      <div className="h-3 w-1/2 bg-[var(--border)] rounded mb-2"></div>
      <div className="h-3 w-3/4 bg-[var(--border)] rounded"></div>
    </div>
  );
}
