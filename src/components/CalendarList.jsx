import React, { useMemo, useEffect, useState } from 'react';
import Skeleton from './Skeleton.jsx';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (value) => {
  if (!value) return '';
  const normalized = value.includes('T') ? value : `1970-01-01T${value}`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
};

// Helper function to check if an event is in the future
const isUpcomingEvent = (event) => {
  if (!event) return false;
  
  // If event has startTime, use that
  if (event.startTime) {
    const eventDate = new Date(event.startTime);
    const now = new Date();
    return eventDate > now;
  }
  
  // If event has a date but no specific time (all-day event)
  if (event.date) {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  }
  
  return true;
};

// Sort events by date/time (earliest first)
const sortEventsByDate = (events) => {
  return [...events].sort((a, b) => {
    const dateA = a.startTime ? new Date(a.startTime) : new Date(a.date);
    const dateB = b.startTime ? new Date(b.startTime) : new Date(b.date);
    return dateA - dateB;
  });
};

export default function CalendarList({ events, loading, onRefresh, error }) {
  const [displayEvents, setDisplayEvents] = useState([]);
  const [animateIndex, setAnimateIndex] = useState(null);

  // Filter and sort events
  const upcomingEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    // Filter out past events and sort by date
    const filtered = events.filter(isUpcomingEvent);
    return sortEventsByDate(filtered);
  }, [events]);

  // Detect new events and trigger animation
  useEffect(() => {
    if (upcomingEvents.length > displayEvents.length) {
      // New event added - find which one is new
      const newEvent = upcomingEvents.find(
        event => !displayEvents.some(e => e.id === event.id)
      );
      if (newEvent) {
        const newIndex = upcomingEvents.findIndex(e => e.id === newEvent.id);
        setAnimateIndex(newIndex);
        setTimeout(() => setAnimateIndex(null), 500);
      }
    }
    setDisplayEvents(upcomingEvents);
  }, [upcomingEvents]);

  // Auto-refresh every 30 seconds to keep events up to date
  useEffect(() => {
    if (!onRefresh) return;
    
    const interval = setInterval(() => {
      onRefresh();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [onRefresh]);

  // Count how many events were removed (past events)
  const removedCount = events.length - upcomingEvents.length;

  return (
    <div className="card rounded-3xl p-5 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h2 className="font-display text-xl">Upcoming</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            {upcomingEvents.length} upcoming events 
            {/* {removedCount > 0 && ` (${removedCount} past event${removedCount > 1 ? 's' : ''} hidden)`} */}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="text-sm px-3 py-1 rounded-full border border-[var(--border)] hover:border-[var(--accent)] transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      {loading && (
        <div className="space-y-3">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      )}
      
      {!loading && error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      )}
      
      {!loading && !error && (
        <div className="space-y-3 overflow-y-auto pr-1 scrollbar max-h-[600px]">
          {upcomingEvents.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent-light)]/10 flex items-center justify-center">
                <svg 
                  className="w-10 h-10 text-[var(--accent)]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
              </div>
              <p className="text-sm text-[var(--text-secondary)] font-medium">No upcoming events</p>
              <p className="text-xs text-[var(--muted)] mt-1">Your calendar is clear. Create a meeting to get started!</p>
            </div>
          )}
          
          {upcomingEvents.map((event, index) => {
            // Determine if event is today for visual highlighting
            const isToday = (() => {
              const eventDate = event.startTime ? new Date(event.startTime) : new Date(event.date);
              const today = new Date();
              return eventDate.toDateString() === today.toDateString();
            })();
            
            // Check if this event is the newly added one
            const isNew = animateIndex === index;
            
            return (
              <div
                key={`${event.id || event.title}-${event.startTime || event.date}-${index}`}
                className={`relative overflow-hidden rounded-3xl border p-4 shadow-sm transition-all duration-300 ${
                  isNew ? 'animate-slideIn border-[var(--accent)] shadow-lg' : ''
                } ${
                  isToday 
                    ? 'border-[var(--accent)]/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent' 
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/30'
                } hover:-translate-y-0.5 hover:shadow-xl`}
              >
                {/* Animated highlight for new events */}
                {isNew && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/20 to-transparent animate-pulse" />
                )}
                
                <div className={`absolute inset-y-0 left-0 w-1 transition-all duration-300 ${
                  isToday ? 'bg-[var(--accent)]' : 'bg-[var(--accent)]/60'
                }`} />
                
                <div className="relative flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start pl-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[var(--text)] text-base">
                        {event.title}
                      </h3>
                      {isToday && (
                        <span className="badge badge-success text-xs">
                          Today
                        </span>
                      )}
                      {isNew && (
                        <span className="badge badge-info text-xs animate-pulse">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(event.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--accent)]">
                      {formatTime(event.startTime)}{event.endTime ? ` — ${formatTime(event.endTime)}` : ''}
                    </p>
                    {event.location && (
                      <p className="text-xs text-[var(--muted)] mt-1 flex items-center gap-1 justify-end">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
                
                {event.meetingLink && (
                  <div className="mt-3 pl-4">
                    <a
                      href={event.meetingLink}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-3 py-1.5 text-xs text-[var(--accent)] transition-all hover:bg-[var(--accent)] hover:text-white group"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}