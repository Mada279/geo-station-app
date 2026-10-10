import { redirect } from 'next/navigation';

export default function JoinPage() {
  // Permanent redirect from legacy /join registration route to unified /onboarding flow
  redirect('/onboarding');
}
