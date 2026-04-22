import React, { useState } from 'react';

const IconMap = {
  News: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm0 2v10h4V5H5zm6 0v14h8V5h-8zm-8 0h2v10H3V5z"/></svg>,
  Tech: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>,
  Community: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  Reading: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-2.29-2.92c-.2-.26-.53-.4-.85-.4-.35 0-.68.15-.88.4-.25.33-.22.8.08 1.1l3.15 4c.2.26.53.4.85.4.32 0 .65-.14.85-.4l3.79-4.84c.31-.39.25-.96-.1-1.27-.36-.31-.92-.25-1.23.1l-.79 1.01z"/></svg>,
  Video: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-6.6-10c-2.4 0-4.4 2-4.4 4.4s2 4.4 4.4 4.4 4.4-2 4.4-4.4-2-4.4-4.4-4.4z"/></svg>,
  Social: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.39v-1.2h-2.5v8.5h2.5v-4.34c0-.77.62-1.4 1.4-1.4.77 0 1.4.63 1.4 1.4v4.34h2.5M6.5 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3m1.237 9.5h-2.5V9.242h2.5v8.258z"/></svg>,
  General: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>,
  Work: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.39.18-.8.18-1.22V4c0-.9-.32-1.75-.84-2.4A2.014 2.014 0 0016 1c-.55 0-1.07.2-1.49.55-.42-.35-.94-.55-1.51-.55-1.1 0-2.1.62-2.6 1.52C9.54 1.6 8.55 1 7.5 1c-.55 0-1.07.2-1.49.55C5.59 1.2 5.06 1 4.5 1 2.56 1 1 2.57 1 4.5V6c0 .42.07.83.18 1.22H1c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h1v9c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-9h1c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1zm-5-2c.55 0 1 .45 1 1v1H12V5c0-.55.45-1 1-1zm-4 0c.55 0 1 .45 1 1v1H8V5c0-.55.45-1 1-1zM4.5 3H5v3H3V4.5C3 3.67 3.67 3 4.5 3zm12 15H3v-9h13.5v9z"/></svg>
};

export default function Bookmarks() {
  const defaultBookmarks = [
    { id: 1, name: 'News', url: 'https://news.google.com', category: 'News' },
    { id: 2, name: 'Reddit', url: 'https://reddit.com', category: 'Community' },
    { id: 3, name: 'Medium', url: 'https://medium.com', category: 'Reading' },
    { id: 4, name: 'Dev.to', url: 'https://dev.to', category: 'Tech' },
    { id: 5, name: 'YouTube', url: 'https://youtube.com', category: 'Video' },
    { id: 6, name: 'Twitter', url: 'https://twitter.com', category: 'Social' }
  ];

  const [bookmarks, setBookmarks] = useState(defaultBookmarks);
  const [showForm, setShowForm] = useState(false);
  const [newBookmark, setNewBookmark] = useState({ name: '', url: '', category: 'General' });

  const categories = ['General', 'News', 'Tech', 'Community', 'Reading', 'Video', 'Social', 'Work'];

  const addBookmark = () => {
    if (newBookmark.name && newBookmark.url) {
      setBookmarks([...bookmarks, { ...newBookmark, id: Date.now() }]);
      setNewBookmark({ name: '', url: '', category: 'General' });
      setShowForm(false);
    }
  };

  const removeBookmark = (id) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const groupedBookmarks = bookmarks.reduce((acc, bookmark) => {
    if (!acc[bookmark.category]) acc[bookmark.category] = [];
    acc[bookmark.category].push(bookmark);
    return acc;
  }, {});

  return (
    <section className="fade-up-delay">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl">Bookmarks</h2>
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
              placeholder="Bookmark name"
              value={newBookmark.name}
              onChange={(e) => setNewBookmark({ ...newBookmark, name: e.target.value })}
              className="w-full rounded-lg bg-[var(--card)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] transition"
            />
            <input
              type="url"
              placeholder="https://example.com"
              value={newBookmark.url}
              onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
              className="w-full rounded-lg bg-[var(--card)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] transition"
            />
            <select
              value={newBookmark.category}
              onChange={(e) => setNewBookmark({ ...newBookmark, category: e.target.value })}
              className="w-full rounded-lg bg-[var(--card)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] transition"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addBookmark}
              className="w-full rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] text-white py-2 text-sm font-semibold hover:opacity-90 transition"
            >
              Add Bookmark
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedBookmarks).map(([category, items]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[var(--accent)]">{IconMap[category]}</span>
              <h3 className="text-sm uppercase tracking-[0.24em] text-[var(--muted)] font-semibold">{category}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((bookmark) => (
                <div key={bookmark.id} className="relative group">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-accent)] hover:border-[var(--accent)] hover:shadow-md transition duration-200"
                  >
                    <span className="text-sm font-medium text-[var(--text)] truncate flex-1">{bookmark.name}</span>
                    <span className="text-xs text-[var(--muted)] ml-2 group-hover:text-[var(--accent)]">↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => removeBookmark(bookmark.id)}
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition duration-200"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
