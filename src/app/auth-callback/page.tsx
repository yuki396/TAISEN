export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="container flex justify-center mx-auto mt-30">
        <p className="text-gray-500">認証処理中...</p>
      </main>
    }>
      <AuthCallbackClient />
    </Suspense>
  );
}