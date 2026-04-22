import React, { useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar.jsx';
import CalendarList from '../components/CalendarList.jsx';
import Shortcuts from '../components/Shortcuts.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import RoomBookingForm from '../components/RoomBookingForm.jsx';
import { api } from '../services/api.js';
import {
  clearGoogleAccessToken,
  getGoogleAccessToken,
  saveGoogleAccessToken,
  saveJwt,
  clearJwt,
  signInWithGoogle,
  signOutGoogle,
  checkTokenScopes,
  forceReauthentication
} from '../services/googleAuth.js';

export default function NewTab() {
  
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorEvents, setErrorEvents] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [needsReauth, setNeedsReauth] = useState(false);
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });


  const formattedDate = useMemo(
    () => currentTime.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }),
    [currentTime]
  );

  const formattedTime = useMemo(
    () => currentTime.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    }),
    [currentTime]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  
  const fetchEvents = async () => {
    setLoadingEvents(true);
    setErrorEvents('');
    try {
      const data = await api.calendar();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setErrorEvents('Unable to load calendar events. Please try again.');
    } finally {
      setLoadingEvents(false);
    }
  };

  
  const handleLogin = async () => {
    setSigningIn(true);
    setLoginError('');
    let googleToken;
    
    try {
      googleToken = await signInWithGoogle();
      await saveGoogleAccessToken(googleToken);
      
      const response = await api.login(googleToken);
      await saveJwt(response.accessToken);
      setUser(response.user);
      
      const hasCorrectScopes = await checkTokenScopes(googleToken);
      setNeedsReauth(!hasCorrectScopes);
      
      await fetchEvents();
    } catch (error) {
      console.error('Google login error:', error);
      if (googleToken) {
        await signOutGoogle(googleToken);
        await clearGoogleAccessToken();
      }
      setLoginError(error?.message || 'Authentication failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleReauthenticate = async () => {
    setSigningIn(true);
    setLoginError('');
    
    try {
      const googleToken = await forceReauthentication();
      await saveGoogleAccessToken(googleToken);
      
      const response = await api.login(googleToken);
      await saveJwt(response.accessToken);
      setUser(response.user);
      setNeedsReauth(false);
      
      await fetchEvents();
    } catch (error) {
      console.error('Re-authentication error:', error);
      setLoginError('Please sign out and sign back in to grant calendar permissions.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    const token = await getGoogleAccessToken();
    await signOutGoogle(token);
    await clearGoogleAccessToken();
    await clearJwt();
    setUser(null);
    setEvents([]);
    setNeedsReauth(false);
  };

  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const initializeAuth = async () => {
      const existingToken = await getGoogleAccessToken();
      if (!existingToken) {
        setLoadingEvents(false);
        return;
      }
      
      try {
        const response = await api.login(existingToken);
        await saveJwt(response.accessToken);
        setUser(response.user);
        
        const hasCorrectScopes = await checkTokenScopes(existingToken);
        setNeedsReauth(!hasCorrectScopes);
        
        await fetchEvents();
      } catch (error) {
        console.error('Auto-login error:', error);
        await signOutGoogle(existingToken);
        await clearGoogleAccessToken();
        setLoadingEvents(false);
      }
    };
    
    initializeAuth();
  }, []);

  
  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header Section */}
        <header className="space-y-6 fade-up">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Date & Time */}
            <div className="space-y-1">
              <div className="text-xs md:text-sm font-medium text-[var(--accent)] uppercase tracking-wider">
                {formattedDate}
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                  {greeting}
                  {user && <span className="text-[var(--accent)]">, {user.name?.split(' ')[0] || user.name}</span>}
                </h1>
                <span className="text-xl md:text-2xl font-light text-[var(--text-secondary)]">
                  {formattedTime}
                </span>
              </div>
              <p className="text-sm text-[var(--muted)] max-w-2xl">
                Your centralized hub for meetings, quick links, and daily productivity.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {user && (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-medium hover:border-[var(--accent)] hover:bg-[var(--bg-accent)] transition-all duration-200"
                >
                  Sign Out
                </button>
              )}
              <ThemeToggle isDark={isDark} onToggle={() => setIsDark(prev => !prev)} />
            </div>
          </div>

          {/* Search Bar */}
          <div className="card p-4 md:p-6">
            <SearchBar />
          </div>
        </header>

        {/* Login Section */}
        {!user && (
          <div className="card p-8 md:p-12 text-center fade-up-delay">
            <div className="max-w-md mx-auto">
             
              
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Welcome to Your Dashboard</h2>
              <p className="text-[var(--text-secondary)] mb-8">
                Sign in with Google to sync your calendar, schedule meetings, and access all features.
              </p>
              
              <button
                onClick={handleLogin}
                disabled={signingIn}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signingIn ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>
              
              {loginError && (
                <p className="mt-4 text-sm text-red-500">{loginError}</p>
              )}
            </div>
          </div>
        )}

        {/* Re-authentication Warning */}
        {needsReauth && user && (
          <div className="card p-6 border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent fade-up-delay">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-amber-500">Additional Permissions Required</h3>
                  <p className="text-sm text-[var(--muted)]">
                    To send email invitations when scheduling meetings, please grant additional calendar permissions.
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleReauthenticate}
                disabled={signingIn}
                className="px-5 py-2 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
              >
                Grant Permissions
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {user && (
          <div className="space-y-6 md:space-y-8">
            {/* Meeting Scheduler */}
            <div className="fade-up-delay">
              <RoomBookingForm onBooked={fetchEvents} />
            </div>
            
            {/* Quick Links */}
            <div className="fade-up-delay">
              <Shortcuts />
            </div>
            
            {/* Calendar Events */}
            <div className="fade-up-delay">
              <CalendarList
                events={events}
                loading={loadingEvents}
                onRefresh={fetchEvents}
                error={errorEvents}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="pt-8 pb-4 text-center">
          <p className="text-xs text-[var(--muted)]">
            © 2026 Dashboard • Powered by GridDynamics
          </p>
        </footer>
        
      </div>
    </div>
  );
}