export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex justify-center mt-10">
        <p className="text-gray-500">認証処理中...</p>
      </main>
    }>
      <AuthCallbackClient />
    </Suspense>
  );
}