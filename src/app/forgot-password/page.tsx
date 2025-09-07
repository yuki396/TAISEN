'use client'
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/libs/supabaseBrowserClient';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // For handling the password reset 
  const handleResetPassword = async (e: React.FormEvent) => {
    // Prevent the browser's default behavior (automatic page reload)
    e.preventDefault();

    setErrorMsg('');

    setLoading(true)
    try {
      // Validate email format
      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/
      if (!emailRegex.test(email)) {
        setErrorMsg('正しいメールアドレスを入力してください。');
        return;
      }

      // Reset password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email, 
        { redirectTo: `${location.origin}/reset-password` }
      );

      if (resetError) {
        if (resetError.status === 429 || resetError.code === 'over_email_send_rate_limit') {
          console.error('Failed to reset password for email:', JSON.stringify(resetError));
          setErrorMsg("試行回数の制限を超えました。しばらくしてから再試行してください。");
          return;
        }
        console.error('Failed to reset password for email:', JSON.stringify(resetError));
        setErrorMsg(`メールの送信に失敗しました。しばらくしてから再試行してください。`);
        return;
      } else {
        router.push('/reset-send');
      }
    } catch (e: unknown) {
      console.error('Unexpected error during sending reset mail : ', e);
      setErrorMsg('不明なエラーが発生しました。しばらくしてから再試行してください。');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center mt-10">
        <p className="text-gray-500">送信中...</p>
      </div>
    );
  } 

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded shadow-md p-8 w-full max-w-md">
        <div className="text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            ← ログインに戻る
          </Link>
        </div>
        <h2 className="text-center text-2xl font-bold mt-7">パスワードをお忘れですか？</h2>
        <p className="text-center text-sm text-gray-600 mt-4">
          登録したメールアドレスを入力してください。<br />
          パスワード再設定メールを送信します。
        </p>
        {error && <p className="text-red-600 bg-red-50 border border-red-300 rounded p-2 mt-2">{error}</p>}
        <form onSubmit={handleResetPassword} className="mt-5">
          <label htmlFor="email" className="text-sm font-medium mt-10">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded px-3 py-2 mt-2 w-full"
          />
          <button
            type="submit"
            className="text-white rounded bg-blue-600 hover:bg-blue-700 transition duration-200 py-2 mt-5 w-full cursor-pointer"
          >
            送信する
          </button>
        </form>
        <div className="text-center text-sm mt-4">
          アカウントをお持ちでない場合は{' '}
          <Link href="/signup" className="text-blue-600 hover:underline">
            新規登録
          </Link>
        </div>
      </div>
    </div>
  )
}
