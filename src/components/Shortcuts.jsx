import React, { useState } from 'react';

const IconMap = {
  Gmail: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>,
  'Google Docs': <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-8-6z"/></svg>,
  GitHub: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>,
  default: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
};

export default function Shortcuts() {
  const defaultShortcuts = [
    { id: 1, name: 'Gmail', url: 'https://mail.google.com', iconKey: 'Gmail' },
    { id: 4, name: 'Google Docs', url: 'https://docs.google.com', iconKey: 'Google Docs' },
    { id: 5, name: 'GitHub', url: 'https://github.com', iconKey: 'GitHub' },
  ];

  const [shortcuts, setShortcuts] = useState(defaultShortcuts);
  const [showForm, setShowForm] = useState(false);
  const [newShortcut, setNewShortcut] = useState({ name: '', url: '', iconKey: 'default' });

  const addShortcut = () => {
    if (newShortcut.name && newShortcut.url) {
      setShortcuts([...shortcuts, { ...newShortcut, id: Date.now() }]);
      setNewShortcut({ name: '', url: '', iconKey: 'default' });
      setShowForm(false);
    }
  };

  const removeShortcut = (id) => {
    setShortcuts(shortcuts.filter(s => s.id !== id));
  };

  return (
    <section className="fade-up-delay">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl">Quick Links</h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="text-xs px-4 py-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-accent)] hover:border-[var(--accent)] transition font-medium"
        >
          {showForm ? '✕ Cancel' : '+ New'}
        </button>
      </div>

      {showForm && (
        <div className="card rounded-2xl p-5 mb-6 border border-[var(--border)] shadow-soft bg-[var(--bg)]">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Name (e.g., Gmail)"
              value={newShortcut.name}
              onChange={(e) => setNewShortcut({ ...newShortcut, name: e.target.value })}
              className="w-full rounded-lg bg-[var(--card)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] transition"
            />
            <input
              type="url"
              placeholder="https://example.com"
              value={newShortcut.url}
              onChange={(e) => setNewShortcut({ ...newShortcut, url: e.target.value })}
              className="w-full rounded-lg bg-[var(--card)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] transition"
            />
            <div className="text-xs text-[var(--muted)]">Standard icon will be used for shortcuts</div>
            <button
              type="button"
              onClick={addShortcut}
              className="w-full rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] text-white py-2 text-sm font-semibold hover:opacity-90 transition"
            >
              Add Shortcut
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.id} className="relative group">
            <a
              href={shortcut.url}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-accent)] hover:border-[var(--accent)] hover:shadow-md transition duration-200 h-full"
            >
              <div className="text-[var(--accent)] mb-3 group-hover:scale-110 transition">{IconMap[shortcut.iconKey] || IconMap.default}</div>
              <p className="text-xs text-center text-[var(--text)] font-medium line-clamp-2">{shortcut.name}</p>
            </a>
            <button
              type="button"
              onClick={() => removeShortcut(shortcut.id)}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition duration-200"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

