'use client';

import { AuthLayout } from '@/app/components/AuthLayout';
import { ChangePasswordForm } from '@/app/components/ChangePasswordForm';

export default function ChangePasswordPage() {
  return (
    <AuthLayout 
      title="Zmiana hasła"
      subtitle="Utwórz nowe, bezpieczne hasło"
    >
      <ChangePasswordForm isForced={true} />
    </AuthLayout>
  );
}

