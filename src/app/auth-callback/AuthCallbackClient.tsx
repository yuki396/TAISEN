'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/libs/supabaseBrowserClient';
import { isLoggedIn } from '@/utils/supabaseBrowserUtils';

export default function AuthCallbackClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('認証処理中...');

  useEffect(() => {
    (async () => {
      // Get access and refresh tokens from URL parameters
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      // If no logged in, login by access and refresh tokens
      const loggedIn = await isLoggedIn();
      if (!loggedIn && accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        // If running in the browser, remove URL hash and Supabase tokens from the URL
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.hash = '';
          url.searchParams.delete('access_token');
          url.searchParams.delete('refresh_token');
          window.history.replaceState({}, '', url.toString());
        }
      }

      // Check login and email confirmation
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        setStatus('error');
        return;
      }
      if (!session?.user.email_confirmed_at) {
        setStatus('error');
        return;
      }

      setStatus('success');
      setMessage('');

      // Redirect to account page wihin 6 seconds
      setTimeout(() => {
        router.replace('/account');
      }, 6000);
    })();
  }, [params, router]);

  return (
    <main className="container flex justify-center px-4 py-8">
      {status === 'loading' && (
        <p className="tex-xl text-center p-4">{message}</p>
      )}
      {status === 'error' && (
        <div className="rounded shadow-md p-8 mx-3">
          <p className="text-center text-2xl sm:text-3xl font-bold mt-3">認証に失敗しました</p>
          <p className="sm:text-center text-base sm:text-xl text-gray-600 mt-5">リンクの有効期限が切れているか、古いリンクの可能性があります。</p>
          <p className="sm:text-center text-base sm:text-xl text-gray-600 mt-2">もう一度メールからアクセスするか、再度新規アカウント登録をお試しください。</p>
          <div className="text-center mt-6">
            <Link href="/signup" className="text-sm text-blue-600 hover:underline">
              ← 登録ページに戻る
            </Link>
          </div>
        </div>
      )}
      {status === 'success' && (
        <div className="p-8 rounded shadow-md mx-3">
          <p className="text-2xl sm:text-3xl font-bold text-center mt-3">メールアドレスの認証が完了しました</p>
          <p className="text-gray-600 text-base sm:text-xl sm:text-center mt-7">数秒後に自動的にアカウント画面へ移動します。<br/>サービスをお楽しみください。</p>
          <div className="text-center mt-6">
            <Link href="/" className="text-blue-600 hover:underline">
              ← トップページに戻る
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
