import { redirect } from 'next/navigation';

export default function ProviderSettingsPage() {
  redirect('/provider/dashboard#profile');
}

