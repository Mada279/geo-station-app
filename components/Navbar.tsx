import React from 'react';
import { cookies } from 'next/headers';
import NavbarClient from './NavbarClient';
import { getActiveAnnouncement } from '@/services/announcementService';

export default async function Navbar() {
  const cookieStore = cookies();
  const announcement = await getActiveAnnouncement();

  let isDismissedInitial = false;
  if (announcement) {
    const dismissCookie = cookieStore.get(`survsta_banner_dismissed_${announcement.id}`);
    isDismissedInitial = Boolean(dismissCookie);
  }

  return (
    <NavbarClient
      initialAnnouncement={announcement}
      isDismissedInitial={isDismissedInitial}
    />
  );
}
