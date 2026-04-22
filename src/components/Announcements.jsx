import React from 'react';
import Skeleton from './Skeleton.jsx';

const priorityColor = {
  LOW: 'bg-emerald-100 text-emerald-900',
  MEDIUM: 'bg-amber-100 text-amber-900',
  HIGH: 'bg-rose-100 text-rose-900'
};

const mockMessages = [
  {
    id: 'mock-1',
    title: 'Weekly product sync',
    description: 'Product team will review roadmap items tomorrow at 10:00 AM.',
    priority: 'HIGH',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    isRead: false,
    isMock: true
  },
  {
    id: 'mock-2',
    title: 'Design system update',
    description: 'New card and button styles rolled out across the app.',
    priority: 'MEDIUM',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    isRead: true,
    isMock: true
  },
  {
    id: 'mock-3',
    title: 'Support hours changed',
    description: 'Support team will be available on weekdays from 9 AM to 5 PM.',
    priority: 'LOW',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    isRead: false,
    isMock: true
  }
];

export default function Announcements() {
  return (
    <div className="card rounded-3xl p-5 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h2 className="font-display text-xl">Admin Updates</h2>
          <p className="text-sm text-[var(--muted)] mt-1">{mockMessages.length} sample messages</p>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto pr-1 scrollbar">
        <p className="text-sm text-[var(--muted)]">
          Showing sample admin updates for demonstration purposes.
        </p>
        {mockMessages.map((message) => (
          <div key={message.id} className="border border-[var(--border)] rounded-2xl p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{message.title}</p>
              <span className={`text-[10px] px-2 py-1 rounded-full ${priorityColor[message.priority] || ''}`}>
                {message.priority}
              </span>
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">{message.description}</p>
            <div className="flex items-center justify-between mt-3 text-xs text-[var(--muted)]">
              <span>{new Date(message.createdAt).toLocaleString()}</span>
              <span className="text-[var(--accent)]">Preview</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
