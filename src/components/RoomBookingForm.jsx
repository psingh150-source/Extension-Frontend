import React, { useMemo, useState } from 'react';
import { api } from '../services/api.js';

function parseEmails(input) {
  if (!input || input.trim() === '') return [];
  return input
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(e => e && e.includes('@'));
}

export default function RoomBookingForm({ onBooked }) {
  const [attendeesText, setAttendeesText] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [rangeStartLocal, setRangeStartLocal] = useState('');
  const [rangeEndLocal, setRangeEndLocal] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('Enter duration in minutes');

  const [suggesting, setSuggesting] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [booking, setBooking] = useState(false);
  const [findingSlots, setFindingSlots] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [suggestion, setSuggestion] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [bestSlots, setBestSlots] = useState(null);
  const [result, setResult] = useState(null);
  
  const [activeTab, setActiveTab] = useState('suggest');

  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const clearResults = () => {
    setSuggestion(null);
    setAvailability(null);
    setBestSlots(null);
    setResult(null);
    setError('');
    setSuccess('');
  };

  const handleSuggest = async (event) => {
    event.preventDefault();
    clearResults();
    setError('');

    const attendeeEmails = parseEmails(attendeesText);

    if (attendeeEmails.length === 0) {
      setError('Please enter at least one attendee email (comma separated).');
      return;
    }

    if (!rangeStartLocal || !rangeEndLocal) {
      setError('Range start and end time are required.');
      return;
    }

    const rangeStartIso = new Date(rangeStartLocal).toISOString();
    const rangeEndIso = new Date(rangeEndLocal).toISOString();

    if (new Date(rangeEndIso) <= new Date(rangeStartIso)) {
      setError('Range end time must be after range start time.');
      return;
    }

    if (!durationMinutes || durationMinutes <= 0) {
      setError('Duration must be greater than 0 minutes.');
      return;
    }

    setSuggesting(true);
    try {
      const response = await api.suggestMeeting({
        rangeStartDateTime: rangeStartIso,
        rangeEndDateTime: rangeEndIso,
        timeZone,
        durationMinutes: Number(durationMinutes),
        attendeeEmails
      });
      setSuggestion(response);
      setSuccess('Best available slot found!');
    } catch (err) {
      console.error('Suggest error:', err);
      setError(err.message || 'Failed to suggest a time slot. Check calendar access and try again.');
    } finally {
      setSuggesting(false);
    }
  };

  const handleCheckAvailability = async (event) => {
    event.preventDefault();
    clearResults();
    setError('');

    const attendeeEmails = parseEmails(attendeesText);

    if (attendeeEmails.length === 0) {
      setError('Please enter at least one attendee email (comma separated).');
      return;
    }

    if (!rangeStartLocal || !rangeEndLocal) {
      setError('Start and end time are required for availability check.');
      return;
    }

    const startIso = new Date(rangeStartLocal).toISOString();
    const endIso = new Date(rangeEndLocal).toISOString();

    if (new Date(endIso) <= new Date(startIso)) {
      setError('End time must be after start time.');
      return;
    }

    setCheckingAvailability(true);
    try {
      const response = await api.checkAvailability({
        startDateTime: startIso,
        endDateTime: endIso,
        timeZone,
        attendeeEmails
      });
      setAvailability(response);
      if (response.allAvailable) {
        setSuccess('All attendees are available at this time!');
      } else {
        setError(`${response.unavailableAttendees.length} attendee(s) are busy at this time.`);
      }
    } catch (err) {
      console.error('Availability error:', err);
      setError(err.message || 'Failed to check availability.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleFindBestSlots = async (event) => {
    event.preventDefault();
    clearResults();
    setError('');

    const attendeeEmails = parseEmails(attendeesText);

    if (attendeeEmails.length === 0) {
      setError('Please enter at least one attendee email (comma separated).');
      return;
    }

    if (!rangeStartLocal) {
      setError('Please select a date to find slots.');
      return;
    }

    const selectedDate = new Date(rangeStartLocal);
    const dateStr = selectedDate.toISOString().split('T')[0];

    setFindingSlots(true);
    try {
      const response = await api.findBestSlot({
        date: dateStr,
        workingHoursStart: '09:00:00',
        workingHoursEnd: '17:00:00',
        durationMinutes: Number(durationMinutes),
        timeZone,
        attendeeEmails
      });
      setBestSlots(response);
      if (response.suggestions && response.suggestions.length > 0) {
        setSuccess(response.message);
      } else {
        setError('No available slots found within working hours.');
      }
    } catch (err) {
      console.error('Find slots error:', err);
      setError(err.message || 'Failed to find best slots.');
    } finally {
      setFindingSlots(false);
    }
  };

  const handleBook = async (startDateTime, endDateTime) => {
    clearResults();
    setError('');

    const attendeeEmails = parseEmails(attendeesText);

    if (!startDateTime || !endDateTime) {
      setError('No time slot selected to book.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a meeting title.');
      return;
    }

    if (attendeeEmails.length === 0) {
      setError('Please enter at least one attendee email.');
      return;
    }

    setBooking(true);
    try {
      const response = await api.createMeeting({
        title: title.trim(),
        description: description.trim() || null,
        startDateTime,
        endDateTime,
        timeZone,
        attendeeEmails,
        sendUpdates: true,
        createConferenceCall: true
      });
      setResult(response);
      setSuccess('Meeting successfully created! Email invitations have been sent to all attendees.');
      if (onBooked) onBooked(response);
      
      // Clear form after successful booking
      setTitle('');
      setDescription('');
      setAttendeesText('');
      setRangeStartLocal('');
      setRangeEndLocal('');
    } catch (err) {
      console.error('Booking error:', err);
      if (err.message && (err.message.includes('insufficient') || err.message.includes('scope') || err.message.includes('permission'))) {
        setError('Calendar invite permission missing. Please sign out and sign back in to grant email notification permissions.');
      } else {
        setError(err.message || 'Booking failed. The selected time may have conflicts or calendar permissions are missing.');
      }
    } finally {
      setBooking(false);
    }
  };

  const useSuggestedSlot = () => {
    if (suggestion) {
      handleBook(suggestion.startDateTime, suggestion.endDateTime);
    }
  };

  const useSlotFromList = (slot) => {
    handleBook(slot.startDateTime, slot.endDateTime);
  };

  const useSuggestedSlotFromAvailability = () => {
    if (availability?.suggestedSlot) {
      handleBook(availability.suggestedSlot.startDateTime, availability.suggestedSlot.endDateTime);
    }
  };

  return (
    <section className="card rounded-2xl p-6 border border-[var(--border)] shadow-lg">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] bg-clip-text text-transparent">
            Schedule a Meeting
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Enter attendee emails (comma separated) to check availability and schedule meetings with Google Meet.
          </p>
        </div>
        <div className="text-xs px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
          {timeZone}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mt-6 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => { setActiveTab('suggest'); clearResults(); }}
          className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg ${
            activeTab === 'suggest' 
              ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5' 
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg-accent)]'
          }`}
        >
          Auto Suggest
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('availability'); clearResults(); }}
          className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg ${
            activeTab === 'availability' 
              ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5' 
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg-accent)]'
          }`}
        >
          Check Time
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('findSlots'); clearResults(); }}
          className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg ${
            activeTab === 'findSlots' 
              ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5' 
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg-accent)]'
          }`}
        >
          Find All Slots
        </button>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={(e) => e.preventDefault()}>
        {/* Common Fields */}
        <div className="grid gap-3">
          <label className="text-sm font-medium text-[var(--text)]">
            Attendee Emails
            <input
              type="text"
              value={attendeesText}
              onChange={(e) => setAttendeesText(e.target.value)}
              placeholder="example@griddynamics.com"
              className="input-modern w-full mt-1"
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-[var(--text)]">
            Meeting Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly Team Sync"
              className="input-modern w-full mt-1"
              required
            />
          </label>
          <label className="text-sm font-medium text-[var(--text)]">
            Duration (minutes)
            <input
              type="number"
              min={5}
              step={5}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
              className="input-modern w-full mt-1"
            />
          </label>
        </div>

        {/* Different date inputs based on active tab */}
        {activeTab === 'suggest' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-[var(--text)]">
              Search Range Start
              <input
                type="datetime-local"
                value={rangeStartLocal}
                onChange={(e) => setRangeStartLocal(e.target.value)}
                className="input-modern w-full mt-1"
              />
            </label>
            <label className="text-sm font-medium text-[var(--text)]">
              Search Range End
              <input
                type="datetime-local"
                value={rangeEndLocal}
                onChange={(e) => setRangeEndLocal(e.target.value)}
                className="input-modern w-full mt-1"
              />
            </label>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-[var(--text)]">
              Start Time
              <input
                type="datetime-local"
                value={rangeStartLocal}
                onChange={(e) => setRangeStartLocal(e.target.value)}
                className="input-modern w-full mt-1"
              />
            </label>
            <label className="text-sm font-medium text-[var(--text)]">
              End Time
              <input
                type="datetime-local"
                value={rangeEndLocal}
                onChange={(e) => setRangeEndLocal(e.target.value)}
                className="input-modern w-full mt-1"
              />
            </label>
          </div>
        )}

        {activeTab === 'findSlots' && (
          <div className="grid gap-3">
            <label className="text-sm font-medium text-[var(--text)]">
              Select Date (9 AM - 5 PM slots)
              <input
                type="date"
                value={rangeStartLocal ? rangeStartLocal.split('T')[0] : ''}
                onChange={(e) => setRangeStartLocal(e.target.value)}
                className="input-modern w-full mt-1"
              />
            </label>
          </div>
        )}

        <label className="text-sm font-medium text-[var(--text)]">
          Description (optional)
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add meeting agenda or notes..."
            className="input-modern w-full mt-1 resize-none"
          />
        </label>

        {/* Error and Success Messages */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 animate-slideIn">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 animate-slideIn">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-emerald-500">{success}</p>
            </div>
          </div>
        )}

        {/* Tab-specific action buttons */}
        {activeTab === 'suggest' && (
          <button
            type="button"
            onClick={handleSuggest}
            disabled={suggesting}
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggesting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Finding best slot...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Suggest Best Slot
              </>
            )}
          </button>
        )}

        {activeTab === 'availability' && (
          <button
            type="button"
            onClick={handleCheckAvailability}
            disabled={checkingAvailability}
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingAvailability ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Checking availability...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Check Availability
              </>
            )}
          </button>
        )}

        {activeTab === 'findSlots' && (
          <button
            type="button"
            onClick={handleFindBestSlots}
            disabled={findingSlots}
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {findingSlots ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Finding slots...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Available Slots
              </>
            )}
          </button>
        )}

        {/* Suggestion Result */}
        {suggestion && (
          <div className="rounded-xl border border-[var(--accent)]/30 p-4 bg-gradient-to-r from-[var(--accent)]/5 to-transparent animate-slideIn">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-[var(--accent)]">Best Available Slot</p>
            </div>
            <div className="mt-2 grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Start:</span>
                <span className="text-sm font-medium">{new Date(suggestion.startDateTime).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">End:</span>
                <span className="text-sm font-medium">{new Date(suggestion.endDateTime).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)]">
                <span className="text-sm text-[var(--muted)]">Conflicts:</span>
                <span className={`text-sm font-medium ${suggestion.conflicts === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {suggestion.conflicts}
                </span>
              </div>
              {suggestion.conflictEmails?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-[var(--muted)]">Busy attendees:</p>
                  <p className="text-xs text-amber-500 mt-1">{suggestion.conflictEmails.join(', ')}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={useSuggestedSlot}
              disabled={booking}
              className="mt-4 w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {booking ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creating Meeting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Book This Slot
                </>
              )}
            </button>
          </div>
        )}

        {/* Availability Result */}
        {availability && (
          <div className="rounded-xl border border-[var(--border)] p-4 animate-slideIn">
            <p className="text-sm font-semibold mb-3">Availability Check Result</p>
            <div className="mt-2">
              {availability.allAvailable ? (
                <div className="flex items-center gap-2 text-emerald-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>All attendees are available at this time!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{availability.unavailableAttendees.length} attendee(s) are busy</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {availability.unavailableAttendees.map((email, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-500">
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {availability.suggestedSlot && !availability.allAvailable && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--accent)] mb-2">Alternative Suggested Slot:</p>
                <p className="text-sm mb-2">
                  {new Date(availability.suggestedSlot.startDateTime).toLocaleString()} -{' '}
                  {new Date(availability.suggestedSlot.endDateTime).toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={useSuggestedSlotFromAvailability}
                  disabled={booking}
                  className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {booking ? 'Creating...' : 'Use Alternative Slot'}
                </button>
              </div>
            )}

            {availability.allAvailable && (
              <button
                type="button"
                onClick={() => handleBook(
                  rangeStartLocal ? new Date(rangeStartLocal).toISOString() : '', 
                  rangeEndLocal ? new Date(rangeEndLocal).toISOString() : ''
                )}
                disabled={booking}
                className="mt-4 w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {booking ? 'Creating Meeting...' : 'Book This Time'}
              </button>
            )}
          </div>
        )}

        {/* Best Slots Result */}
        {bestSlots && bestSlots.suggestions && (
          <div className="rounded-xl border border-[var(--border)] p-4 animate-slideIn">
            <p className="text-sm font-semibold">
              Available Slots ({bestSlots.totalSlotsChecked} slots checked)
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">{bestSlots.message}</p>
            
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {bestSlots.suggestions.slice(0, 10).map((slot, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-accent)] transition-all duration-200 cursor-pointer group hover:border-[var(--accent)]"
                  onClick={() => useSlotFromList(slot)}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(slot.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(slot.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {new Date(slot.startDateTime).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    {slot.conflicts === 0 ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Free
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-500">
                        {slot.conflicts} conflict(s)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {bestSlots.suggestions.length === 0 && (
              <p className="text-sm text-[var(--muted)] text-center py-4">No slots available</p>
            )}
          </div>
        )}

        {/* Booking Result */}
        {result && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 animate-slideIn">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-emerald-500">Meeting Created Successfully!</p>
            </div>
            <p className="text-sm mt-2">
              Status: <span className="font-medium">{result.status || 'confirmed'}</span>
            </p>
            {result.meetingLink && (
              <p className="text-sm mt-2">
                Google Meet:{' '}
                <a 
                  className="text-[var(--accent)] hover:underline break-all inline-flex items-center gap-1" 
                  href={result.meetingLink} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  Join Meeting
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </p>
            )}
            {result.htmlLink && (
              <a
                className="text-sm text-[var(--accent)] mt-3 inline-flex items-center gap-1 hover:underline"
                href={result.htmlLink}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Calendar
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        )}
      </form>
    </section>
  );
}