import React from 'react';
import { cookies } from 'next/headers';
import NavbarClient from './NavbarClient';
import { getActiveAnnouncement } from '@/services/announcementService';
import { getAuthContext } from '@/lib/serverAuth';
import { normalizeUser, AuthenticatedUser } from '@/lib/auth/userNormalizer';

export const dynamic = 'force-dynamic';

export default async function Navbar() {
  const cookieStore = cookies();
  const [announcement, ctx] = await Promise.all([getActiveAnnouncement(), getAuthContext()]);

  let isDismissedInitial = false;
  if (announcement) {
    const dismissCookie = cookieStore.get(`survsta_banner_dismissed_${announcement.id}`);
    isDismissedInitial = Boolean(dismissCookie);
  }

  let initialUser: AuthenticatedUser | null = null;
  if (ctx) {
    initialUser = normalizeUser({
      id: ctx.user.id,
      email: ctx.email,
      name: ctx.name,
      role: ctx.role === 'customer' ? 'client' : ctx.role,
    });
  }

  return (
    <NavbarClient
      user={initialUser}
      initialAnnouncement={announcement}
      isDismissedInitial={isDismissedInitial}
    />
  );
}
