import React, { useRef, useState } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);

  const performSearch = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
    window.open(url, '_blank');
    setQuery('');
  };

  const performLuckySearch = (term) => {
    const trimmed = term.trim();
    const url = trimmed
      ? `https://www.google.com/search?q=${encodeURIComponent(trimmed)}&btnI=1`
      : 'https://www.google.com/doodles';
    window.open(url, '_blank');
    setQuery('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    performSearch(query);
  };

  const handleLucky = () => {
    performLuckySearch(query);
  };

  const handleVoiceSearch = () => {
    if (!SpeechRecognition) {
      window.alert('Voice search is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setQuery(transcript);
        performSearch(transcript);
      }
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const focusSearchInput = () => {
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col items-center gap-4">
        <div className="font-display text-3xl tracking-tight select-none">
          <span className="text-[#4285F4]">G</span>
          <span className="text-[#EA4335]">o</span>
          <span className="text-[#FBBC05]">o</span>
          <span className="text-[#4285F4]">g</span>
          <span className="text-[#34A853]">l</span>
          <span className="text-[#EA4335]">e</span>
        </div>
        <div className="w-full max-w-3xl flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-3 shadow-soft transition focus-within:border-[var(--accent)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-500">
            <path
              d="M10.5 18a7.5 7.5 0 1 1 5.303-12.803A7.5 7.5 0 0 1 10.5 18Zm10.5 3-5.2-5.2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={listening ? 'Listening...' : 'Search Google or type a URL'}
            className="w-full bg-transparent outline-none text-base placeholder:text-[var(--muted)]"
          />
          <div className="flex items-center gap-2 text-slate-500">
           
            <button
              type="button"
              onClick={handleVoiceSearch}
              className="rounded-full p-2 hover:bg-slate-100 transition"
              aria-label="Voice search"
            >
              <svg width="16" height="20" viewBox="0 0 24 24" fill="none" className={listening ? 'text-[var(--accent)]' : ''}>
                <path
                  d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 text-sm hover:bg-slate-200"
          >
            Google Search
          </button>
        </div>
      </div>
    </form>
  );
}
