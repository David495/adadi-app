import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SESSION_KEY = 'adadi.mobile.auth.session.v1';

export type MobileUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type MobileSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: MobileUser;
};

function authHeaders() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase is not configured. Check the app environment settings.');
  }
  return {
    apikey: SUPABASE_KEY,
    'Content-Type': 'application/json',
  };
}

async function authRequest(path: string, body: Record<string, unknown>) {
  const response = await fetch(SUPABASE_URL + '/auth/v1/' + path, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload?.msg === 'string' ? payload.msg : typeof payload?.message === 'string' ? payload.message : typeof payload?.error_description === 'string' ? payload.error_description : 'Authentication failed. Please try again.');
  }
  return payload;
}

async function saveSession(value: MobileSession | null) {
  if (value) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(value));
  else await AsyncStorage.removeItem(SESSION_KEY);
}

export async function signIn(email: string, password: string): Promise<MobileSession> {
  const data = await authRequest('token?grant_type=password', { email: email.trim().toLowerCase(), password });
  if (!data?.access_token || !data?.refresh_token || !data?.user?.id) {
    throw new Error('Supabase did not return a session. Check your email confirmation settings.');
  }
  const session: MobileSession = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: typeof data.expires_at === 'number' ? data.expires_at : Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600),
    user: data.user,
  };
  await saveSession(session);
  return session;
}

export async function signUp(name: string, email: string, password: string): Promise<MobileSession | null> {
  const data = await authRequest('signup', {
    email: email.trim().toLowerCase(),
    password,
    data: { full_name: name.trim(), name: name.trim() },
  });
  if (!data?.access_token || !data?.refresh_token || !data?.user?.id) return null;
  const session: MobileSession = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: typeof data.expires_at === 'number' ? data.expires_at : Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600),
    user: data.user,
  };
  await saveSession(session);
  return session;
}

export async function getMobileSession(): Promise<MobileSession | null> {
  const stored = await AsyncStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  let session: MobileSession;
  try {
    session = JSON.parse(stored) as MobileSession;
  } catch {
    await saveSession(null);
    return null;
  }
  if (!session?.access_token || !session?.refresh_token || !session?.user?.id) {
    await saveSession(null);
    return null;
  }
  if (session.expires_at && session.expires_at > Math.floor(Date.now() / 1000) + 60) return session;

  try {
    const data = await authRequest('token?grant_type=refresh_token', { refresh_token: session.refresh_token });
    if (!data?.access_token || !data?.refresh_token || !data?.user?.id) {
      await saveSession(null);
      return null;
    }
    const refreshed: MobileSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: typeof data.expires_at === 'number' ? data.expires_at : Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600),
      user: data.user,
    };
    await saveSession(refreshed);
    return refreshed;
  } catch {
    await saveSession(null);
    return null;
  }
}

export async function signOut() {
  const session = await getMobileSession();
  if (session && SUPABASE_URL && SUPABASE_KEY) {
    await fetch(SUPABASE_URL + '/auth/v1/logout', {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + session.access_token },
    }).catch(() => undefined);
  }
  await saveSession(null);
}

export function displayUserName(session: MobileSession | null) {
  const metadata = session?.user?.user_metadata;
  const value = metadata?.full_name ?? metadata?.name;
  return typeof value === 'string' && value.trim() ? value.trim() : session?.user?.email?.split('@')[0] ?? 'ADADI customer';
}
