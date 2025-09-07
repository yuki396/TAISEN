'use client'
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RequestCompletePage() {

  const router = useRouter();
  useEffect(() => {
    // Redirect to login page wihin 6 seconds
    setTimeout(() => {
      router.replace('/');
    }, 6000);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-12 rounded shadow-md">
        <p className="lg:text-center text-4xl font-bold mt-3">選手の申請が完了しました</p>
        <p className="lg:text-center text-gray-600 text-xl mt-7">選手データの最新化にご協力いただき、ありがとうございます！<br/>運営チームで申請の承諾/拒否を検討させていただきます。</p>
        <p className="lg:text-center text-gray-600 text-xl mt-7">数秒後に自動的にホーム画面へ移動します。引き続き、サービスをお楽しみください。</p>
        <div className="text-center mt-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}