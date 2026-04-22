import React from 'react';

export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium shadow-soft transition hover:border-[var(--accent)] hover:bg-[var(--bg-accent)]"
    >
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}
