'use client'
import Link from 'next/link';

export default function ResetSendPage() {
  return (
    <div className="container flex justify-center py-8">
      <div className="rounded shadow-md border border-gray-100 px-4 py-6 mx-2">
        <h2 className="lg:text-center text-2xl sm:text-3xl font-bold mt-3">パスワード再設定メールを送信しました</h2>
        <p className="text-base sm:text-lg text-gray-600 mt-8">
          登録したメールアドレスにパスワード再設定用のリンクを送信しました。
        </p>
        <p className="text-base sm:text-lg text-gray-600 mt-3 sm:mt-5">
          メールが届かない場合は、迷惑メールフォルダもご確認ください。
        </p>
        <div className="text-center mt-6">
          <Link href="/login" className="text-blue-600 hover:underline">
            ← ログインページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
