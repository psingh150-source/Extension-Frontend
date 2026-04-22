import { setToken, clearToken, getToken } from './api.js';

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

// Required OAuth scopes for Calendar operations with email notifications
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// Scopes needed for email notifications to work
const EMAIL_NOTIFICATION_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose'
];

// Full scopes for complete functionality
const FULL_SCOPES = [...REQUIRED_SCOPES, ...EMAIL_NOTIFICATION_SCOPES];

export async function signInWithGoogle() {
  if (typeof chrome === 'undefined' || !chrome.identity) {
    throw new Error('Google sign-in requires the Chrome extension context.');
  }

  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ 
      interactive: true,
      scopes: REQUIRED_SCOPES
    }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message || 'Failed to get token'));
        return;
      }
      resolve(token);
    });
  });
}

// Sign in with full scopes for email notifications
export async function signInWithFullScopes() {
  if (typeof chrome === 'undefined' || !chrome.identity) {
    throw new Error('Google sign-in requires the Chrome extension context.');
  }

  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ 
      interactive: true,
      scopes: FULL_SCOPES
    }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message || 'Failed to get token'));
        return;
      }
      resolve(token);
    });
  });
}

// Add this to your googleAuth.js exports (already should be there)
export async function forceReauthentication() {
  if (typeof chrome === 'undefined' || !chrome.identity) {
    throw new Error('Google sign-in requires the Chrome extension context.');
  }

  // Clear existing cached token first
  const existingToken = await getGoogleAccessToken();
  if (existingToken) {
    await signOutGoogle(existingToken);
  }
  
  await clearGoogleAccessToken();
  await clearJwt();
  
  // Force new authentication with full scopes
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ 
      interactive: true,
      scopes: REQUIRED_SCOPES
    }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message || 'Failed to get token'));
        return;
      }
      resolve(token);
    });
  });
}
// Alternative: Use launchWebAuthFlow for more control over scopes
export async function signInWithGoogleAdvanced() {
  if (typeof chrome === 'undefined' || !chrome.identity) {
    throw new Error('Google sign-in requires the Chrome extension context.');
  }

  const redirectUri = chrome.identity.getRedirectURL();
  // Get client ID from environment or chrome extension manifest
  const clientId = await getClientId();
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('response_type', 'token');
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', FULL_SCOPES.join(' '));
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: true
      },
      (redirectedTo) => {
        if (chrome.runtime.lastError || !redirectedTo) {
          reject(new Error(chrome.runtime.lastError?.message || 'Authentication failed'));
          return;
        }

        const url = new URL(redirectedTo);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          resolve({ accessToken, refreshToken });
        } else {
          reject(new Error('No access token received'));
        }
      }
    );
  });
}

// Get client ID from chrome extension manifest
async function getClientId() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
      const manifest = chrome.runtime.getManifest();
      const clientId = manifest.oauth2?.client_id;
      if (clientId) {
        resolve(clientId);
      } else {
        resolve('542366028313-4tvn3vmvejhfff7mhjeotl3gcpo3lmfe.apps.googleusercontent.com'); // Fallback
      }
    } else {
      resolve('542366028313-4tvn3vmvejhfff7mhjeotl3gcpo3lmfe.apps.googleusercontent.com'); // Fallback
    }
  });
}

// Check if current token has required scopes
export async function checkTokenScopes(token) {
  if (!token) return false;
  
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
    const data = await response.json();
    const scopes = data.scope?.split(' ') || [];
    
    const hasCalendarScope = scopes.some(scope => 
      scope.includes('calendar') || 
      scope === 'https://www.googleapis.com/auth/calendar' ||
      scope === 'https://www.googleapis.com/auth/calendar.events'
    );
    
    return hasCalendarScope;
  } catch (error) {
    console.error('Failed to check token scopes:', error);
    return false;
  }
}

export async function signOutGoogle(token) {
  if (typeof chrome === 'undefined' || !chrome.identity || !token) return;
  
  return new Promise((resolve) => {
    // Remove cached token from Chrome
    chrome.identity.removeCachedAuthToken({ token }, () => {
      // Also revoke the token on Google's side
      fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`, {
        method: 'POST',
        mode: 'no-cors'
      }).catch(() => {});
      resolve();
    });
  });
}

export async function saveGoogleAccessToken(token) {
  return storage.set('google_access_token', token);
}

export async function getGoogleAccessToken() {
  return storage.get('google_access_token');
}

export async function clearGoogleAccessToken() {
  return storage.remove('google_access_token');
}

export async function saveJwt(token) {
  return setToken(token);
}

export async function clearJwt() {
  return clearToken();
}

export async function getJwt() {
  return getToken();
}

// Get user info from Google
export async function getUserInfo(accessToken) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
}

// Refresh the access token using refresh token (if available)
export async function refreshAccessToken(refreshToken) {
  try {
    const clientId = await getClientId();
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    const data = await response.json();
    if (data.access_token) {
      return data.access_token;
    }
    return null;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
}