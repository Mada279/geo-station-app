import React from 'react';
import { cookies } from 'next/headers';
import NavbarClient from './NavbarClient';
import { getActiveAnnouncement } from '@/services/announcementService';
import { normalizeUser, AuthenticatedUser } from '@/lib/auth/userNormalizer';

export default async function Navbar() {
  const cookieStore = cookies();
  const announcement = await getActiveAnnouncement();

  let isDismissedInitial = false;
  if (announcement) {
    const dismissCookie = cookieStore.get(`survsta_banner_dismissed_${announcement.id}`);
    isDismissedInitial = Boolean(dismissCookie);
  }

  // Parse server-side session cookies to provide instant SSR hydration
  let initialUser: AuthenticatedUser | null = null;
  const sessionCookie = cookieStore.get('survsta_session')?.value;
  const roleCookie = cookieStore.get('user_role')?.value;

  if (sessionCookie) {
    try {
      const decoded = decodeURIComponent(sessionCookie);
      const parsed = JSON.parse(decoded);
      if (parsed) {
        if (roleCookie && !parsed.role) {
          parsed.role = roleCookie;
        }
        initialUser = normalizeUser(parsed);
      }
    } catch {
      // In case sessionCookie was raw string or email
      if (sessionCookie && sessionCookie !== 'undefined') {
        initialUser = normalizeUser({ email: sessionCookie, role: roleCookie || 'client' });
      }
    }
  } else if (roleCookie) {
    initialUser = normalizeUser({ role: roleCookie });
  }

  return (
    <NavbarClient
      user={initialUser}
      initialAnnouncement={announcement}
      isDismissedInitial={isDismissedInitial}
    />
  );
}
