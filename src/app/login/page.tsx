'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithGoogle, signIn } from '@/utils/supabaseUtils';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // For handling email aond password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    // Prevent the browser's default behavior (automatic page reload)
    e.preventDefault();

    setError('');

    try {
      await signIn(email, password);
      router.push('/account');
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error('Login error:', e);
        setError(e.message);
      } else {
        console.error('Unexpected error during login:', e);
        setError('ログインに失敗しました');
      }
    }
  };

  // For handling Google login
  const handleGoogleLogin = async () => {
    setError('');

    const { error: oauthError } = await signInWithGoogle();

    if (oauthError) {
      console.error('Google login error:', oauthError);
      setError('Googleでのログインに失敗しました');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded p-8 w-96">
        <h2 className="text-center text-2xl font-bold">ログイン</h2>
        {error && <p className="text-red-600 rounded bg-red-50 border border-red-300 p-2 mt-5">{error}</p>}
        <form onSubmit={handleEmailLogin}>
          <div className="mt-6">
            <label htmlFor="email" className="text-sm font-medium">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-gray-300 rounded px-3 py-2 mt-1 w-full"
            />
          </div>

          <div className="mt-3">
            <label htmlFor="password" className="text-sm font-medium">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border border-gray-300 rounded px-3 py-2 mt-1 w-full"
            />
          </div>

          <button
            type="submit"
            className="text-white bg-blue-600 hover:bg-blue-700 transition duration-200 rounded py-2 mt-6 w-full cursor-pointer"
          >
            ログイン
          </button>
        </form>

        <div className="text-center text-gray-500 my-4">または</div>

        <button
          onClick={handleGoogleLogin}
          className="text-white bg-red-500 hover:bg-red-600 transition duration-200 rounded py-2 w-full cursor-pointer"
        >
          Googleでログイン
        </button>

        <div className="text-center mt-4">
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline cursor-pointer">
            パスワードをお忘れですか？
          </Link>
        </div>

        <div className="mt-2 text-center">
          <span className="text-sm">アカウントをお持ちでない場合は </span>
          <Link href="/signup" className="text-sm text-blue-600 hover:underline cursor-pointer">
            新規登録
          </Link>
        </div>
      </div>
    </div>
);
}
