/**
 * Single logout path. The session itself lives in the @supabase/ssr cookies, so
 * clearing it has to happen on the server — the browser cannot revoke it.
 */
export async function logoutAndRedirect(redirectTo = '/login'): Promise<void> {
  try {
    await fetch('/api/auth/session', { method: 'DELETE', cache: 'no-store' });
  } catch {}

  try {
    localStorage.removeItem('SURVSTA_AUTH_USER');
    localStorage.removeItem('SURVSTA_LOGGED_OUT');
    // Legacy display-only cookies from earlier builds.
    document.cookie = 'survsta_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  } catch {}

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('survsta_auth_channel');
      bc.postMessage({ type: 'LOGOUT' });
      bc.close();
    }
  } catch {}

  window.location.replace(redirectTo);
}
