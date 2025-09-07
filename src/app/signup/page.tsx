'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { FaGoogle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { signUp, signInWithGoogle } from '@/utils/supabaseBrowserUtils';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // For checking if email and password is valid
  const validate = () => {
    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!emailRegex.test(email)) return '正しいメールアドレスを入力してください';
    if (!pwdRegex.test(password)) return 'パスワードは8文字以上で、大文字・小文字・数字を含める必要があります';
    if (password !== confirmPassword) return 'パスワードと確認が一致しません';
    if (!agree) return '利用規約とプライバシーポリシーに同意してください';
    return '';
  };

  // For handling an account register
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent the browser's default behavior (automatic page reload)
    e.preventDefault();

    setErrorMsg('');

    // Check email and password  
    const msg = validate();
    if (msg) {
      setErrorMsg(msg);
      return;
    }

    setLoading(true)
    // Register an account 
    try {
      await signUp(email, password);
      router.push('/signup-confirm');
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error('Failed to register : ', e);
        setErrorMsg(e.message);
      } else {
        console.error('Unexpected error during registration : ', e);
        setErrorMsg('不明なエラーが発生しました。しばらくしてから再試行してください。');
      }
    } finally {
      setLoading(false);
    }
  };

  // For handling a google account register
  const handleGoogle = async () => {
    setErrorMsg('');
    // Register a google account on Supabase
    const { error: oauthError } = await signInWithGoogle();
    if (oauthError) {
      setErrorMsg('Googleでの登録に失敗しました。しばらくしてから再試行してください。');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center mt-10">
        <p className="text-gray-500">アカウント作成中...</p>
      </div>
    );
  } 

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded p-5 my-2 w-96 mx-10">
        <h2 className="text-center text-2xl font-bold">新規アカウント登録</h2>
        <p className="text-center text-gray-600 mt-2">メールアドレスまたはGoogleアカウントで登録</p>
        {error && <p className="text-red-600 bg-red-50 rounded border border-red-300 p-2 mt-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mt-4">
            <label className="text-sm font-medium">メールアドレス</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 mt-1 w-full"
              required
            />
            <p className="text-xs text-gray-500 mt-1">メールアドレスの@より前の部分がデフォルトのユーザーIDとして使用されます</p>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 mt-1 w-full"
              required
            />
            <p className="text-xs text-gray-500 mt-1">8文字以上で、大文字・小文字・数字を含める必要があります</p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium">パスワード（確認）</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 mt-1 w-full"
              required
            />
          </div>

          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm">
              <Link href="/terms" className="text-blue-600 hover:underline">利用規約</Link>と{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</Link>に同意する
            </span>
          </div>

          <button
            type="submit"
            className="text-white bg-blue-600 hover:bg-blue-700 transition duration-200 rounded py-2 mt-4 w-full cursor-pointer"
          >
            アカウントを作成
          </button>
        </form>

        <div className="text-center text-gray-500 my-4">または</div>

        <button
          onClick={handleGoogle}
          className="flex items-center justify-center text-white bg-red-600 hover:bg-red-700 transition duration-200 rounded py-2 w-full cursor-pointer">
          <FaGoogle className="mr-2"/>Googleで登録
        </button>

        <div className="text-center text-sm mt-4">
          すでにアカウントをお持ちの場合は{' '}
          <Link href="/login" className="text-blue-600 hover:underline">ログイン</Link>
        </div>
      </div>
    </div>
  );
}
