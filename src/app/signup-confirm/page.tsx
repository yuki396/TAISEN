'use client'
import Link from 'next/link';

export default function SignupConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
      <div className="bg-white shadow-md rounded p-8">
        <h2 className="lg:text-center text-4xl font-bold mt-3">メールアドレス確認メールを送信しました</h2>
        <p className="lg:text-center text-lg text-gray-600 mt-8">
          登録したメールアドレスにメールアドレス認証用のリンクを送信しました。<br/>
          メールをご確認ください。メールアドレスの認証を行わないと、ログインができません。
        </p>
        <p
          className="lg:text-center text-sm text-gray-600 mt-5"
        >
          ＊メールが届かない場合は、迷惑メールフォルダもご確認ください。<br/>
          ＊すでにアカウントをお持ちの場合は、メールが届きません。<br/>
            <span className="ml-3">
              <Link href="/auth/login" className="text-blue-600 underline ml-1">ログイン</Link>をお試しください。
            </span>
        </p>
        <div className="text-center mt-6">
          <Link href="/signup" className="text-blue-600 hover:underline">
            ← 登録ページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}