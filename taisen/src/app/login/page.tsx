'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithGoogle, signIn } from '@/utils/supabaseFunction';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { data, error: signInError } = await signIn( email, password);

    if (signInError || !data.session) {
      setError(signInError?.message || 'ログインに失敗しました');
      return;
    }

    router.push('/account');
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error: oauthError } = await signInWithGoogle();

    if (oauthError) {
      setError('Googleでのログインに失敗しました');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center ">ログイン</h2>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        <form onSubmit={handleEmailLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-1">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition cursor-pointer"
          >
            ログイン
          </button>
        </form>

        <div className="my-4 text-center text-gray-500">または</div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition cursor-pointer"
        >
          Googleでログイン
        </button>

        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-sm text-blue-600 cursor-pointer hover:underline">
            パスワードをお忘れですか？
          </Link>
        </div>

        <div className="mt-2 text-center">
          <span className="text-sm">アカウントをお持ちでない場合は </span>
          <Link href="/register" className="text-sm text-blue-600 cursor-pointer hover:underline">
            新規登録
          </Link>
        </div>
      </div>
    </div>
);
}
