'use client';

import { AuthLayout } from '@/app/components/AuthLayout';
import { LoginForm } from '@/app/components/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
      
      <div className="mt-6 border-t border-gray-700 pt-6">
        <div className="text-xs text-gray-400 space-y-2">
          <p className="font-semibold text-gray-300">Testowe konta:</p>
          <div className="space-y-1 font-mono bg-gray-700 p-3 rounded text-[10px]">
            <p className="text-blue-400 font-semibold">AGENCI:</p>
            <p>👨‍💼 admin@tickflow.com / Admin123!@#</p>
            <p>👨‍💼 agent@tickflow.com / Agent123!@#</p>
            <p>👩‍💼 agent2@tickflow.com / Agent2123!@#</p>
            <p className="text-green-400 font-semibold mt-2">UŻYTKOWNICY:</p>
            <p>👤 user@tickflow.com / User123!@#</p>
            <p>👤 user2@tickflow.com / User2123!@#</p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
