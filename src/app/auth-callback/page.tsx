'use client'
import { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabaseBrowserClient';
import { isLoggedIn } from '@/utils/supabaseUtils';

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('認証処理中...');

  useEffect(() => {
    (async () => {
      // Get access and refresh tokens from URL parameters
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      // If no lgged in, login by access and refresh tokens
      const loggedIn = await isLoggedIn()
      if (!loggedIn && accessToken && refreshToken){
        await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      {status === 'loading' && (
        <p className="tex-xl text-center p-4">{message}</p>
      )}
      {status === 'error' && (
        <div className="bg-white rounded shadow-md p-8">
          <p className="text-center text-4xl font-bold mt-3">認証に失敗しました</p>
          <p className="text-center text-xl text-gray-600 mt-7">リンクの有効期限が切れているか、古いリンクの可能性があります。</p>
          <p className="text-center text-xl text-gray-600">もう一度メールからアクセスするか、再度新規アカウント登録をお試しください。</p>
          <div className="text-center mt-6">
            <Link href="/signup" className="text-blue-600 hover:underline cursor-pointer">
              ← 登録ページに戻る
            </Link>
          </div>
        </div>
      )}
      {status === 'success' && (
        <div className="bg-white p-8 rounded shadow-md">
          <p className="text-4xl font-bold text-center mt-3">メールアドレスの認証が完了しました</p>
          <p className="text-gray-600 text-xl text-center mt-7">数秒後に自動的にアカウント画面へ移動します。<br/>サービスをお楽しみください。</p>
          <div className="text-center mt-6">
            <Link href="/" className="text-blue-600 cursor-pointer hover:underline">
              ← トップページに戻る
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
