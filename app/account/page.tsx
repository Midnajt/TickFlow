import { redirect } from 'next/navigation';
import AccountPageClient from './AccountPageClient';
import { getUserFromCookies } from '@/app/lib/utils/session';

export default async function AccountPage() {
  const user = await getUserFromCookies();

  if (!user) {
    redirect('/login');
  }

  if (user.passwordResetRequired) {
    redirect('/change-password');
  }

  return <AccountPageClient user={user} />;
}

