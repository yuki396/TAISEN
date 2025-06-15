'use client';
import React, { useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { signUp, signInWithGoogle } from '@/utils/supabaseFunction';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!emailRegex.test(email)) return '正しいメールアドレスを入力してください';
    if (!pwdRegex.test(password)) return 'パスワードは8文字以上で、大文字・小文字・数字を含める必要があります';
    if (password !== confirmPassword) return 'パスワードと確認が一致しません';
    if (!agree) return '利用規約とプライバシーポリシーに同意してください';
    return '';
  };

  // Handle an account register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    // Register an account on Supabase
    const { error: signUpError } = await signUp(email, password);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    
    router.push('/');
  };

  // Handle a google account register
  const handleGoogle = async () => {
    setError('');
    // Register a google account on Supabase
    const { error: oauthError } = await signInWithGoogle();
    if (oauthError) {
      setError('Googleでの登録に失敗しました');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-2 text-center">新規アカウント登録</h2>
        <p className="text-center text-gray-600 mb-6">メールアドレスまたはGoogleアカウントで登録</p>

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">メールアドレス</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded"
              required
            />
            <p className="text-xs text-gray-500 mt-1">メールアドレスの@より前の部分がユーザーIDとして使用されます</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">パスワード</label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded"
              required
            />
            <p className="text-xs text-gray-500 mt-1">8文字以上で、大文字・小文字・数字を含める必要があります</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">パスワード（確認）</label>
            <input
              type="password"
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded"
              required
            />
          </div>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">利用規約とプライバシーポリシーに同意する</span>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            アカウントを作成
          </button>
        </form>

        <div className="text-center my-4 text-gray-500">または</div>

        <button
          onClick={handleGoogle}
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition flex items-center justify-center"
        >
          <FaGoogle className="mr-2" />Googleで登録
        </button>

        <div className="mt-4 text-center text-sm">
          すでにアカウントをお持ちの場合は{' '}
          <a href="/login" className="text-blue-600 hover:underline">ログイン</a>
        </div>
      </div>
    </div>
  );
}
