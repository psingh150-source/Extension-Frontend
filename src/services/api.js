const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const storage = {
  async get(key) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const data = await chrome.storage.local.get([key]);
      return data[key];
    }
    return localStorage.getItem(key);
  },
  async set(key, value) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [key]: value });
      return;
    }
    localStorage.setItem(key, value);
  },
  async remove(key) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.remove([key]);
      return;
    }
    localStorage.removeItem(key);
  }
};

export async function getToken() {
  return storage.get('dashboard_jwt');
}

export async function setToken(token) {
  return storage.set('dashboard_jwt', token);
}

export async function clearToken() {
  return storage.remove('dashboard_jwt');
}

async function request(path, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMessage = text;
    try {
      const errorJson = JSON.parse(text);
      errorMessage = errorJson.message || text;
    } catch (e) {
      // Use text as is
    }
    throw new Error(errorMessage || 'Request failed');
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  // Auth endpoints
  login: (accessToken, refreshToken) =>
    request('/api/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ accessToken, refreshToken })
    }),
  
  // User endpoints
  me: () => request('/api/user/me'),
  
  // Calendar endpoints
  calendar: () => request('/api/calendar/events'),
  
  // Meeting scheduling endpoints
  suggestMeeting: (payload) =>
    request('/api/calendar/suggest', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  
  bookMeeting: (payload) =>
    request('/api/calendar/book', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  
  checkAvailability: (payload) =>
    request('/api/calendar/check-availability', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  
  createMeeting: (payload) =>
    request('/api/calendar/create-meeting', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  
  findBestSlot: (payload) =>
    request('/api/calendar/find-best-slot', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};