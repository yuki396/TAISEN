'use client'
import Link from 'next/link';

export default function ResetSendPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded shadow-md p-8">
        <h2 className="lg:text-center text-4xl font-bold mt-3">パスワード再設定メールを送信しました</h2>
        <p className="text-lg text-gray-600 mt-8">
          登録したメールアドレスにパスワード再設定用のリンクを送信しました。
        </p>
        <p className="text-lg text-gray-600 mt-5">
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
