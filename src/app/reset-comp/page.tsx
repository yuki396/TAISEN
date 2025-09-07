'use client'
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SendCompletePage() {

  const router = useRouter();
  useEffect(() => {
      // Redirect to login page wihin 6 seconds
      setTimeout(() => {
        router.replace('/login');
      }, 6000);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded shadow-md">
        <p className="lg:text-center text-4xl font-bold mt-3">パスワードのリセットが完了しました</p>
        <p className="lg:text-center text-gray-600 text-xl mt-7">数秒後に自動的にログイン画面へ移動します。<br/>サービスをお楽しみください。</p>
        <div className="text-center mt-6">
          <Link href="/login" className="text-blue-600 hover:underline">
            ← ログインページに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
