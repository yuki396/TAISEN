'use client'
import Link from 'next/link';

export default function SignupConfirmPage() {
  return (
    <div className="container flex justify-center py-8">
      <div className="rounded shadow-md border border-gray-100 px-4 py-6 mx-3">
        <h2 className="lg:text-center text-2xl sm:text-3xl font-bold mt-3">メールアドレス認証メールを送信しました</h2>
        <p className="lg:text-center text-base sm:text-lg text-gray-600 mt-4 sm:mt-8">
          登録したメールアドレスにメールアドレス認証用のメールを送信しました。<br/>メールをご確認いただき、認証を完了してください。
        </p>
        <p
          className="lg:text-center text-sm text-gray-600 mt-3 sm:mt-5"
        >
          ＊メールアドレスの認証を行わないと、ログインができません。<br/>
          ＊メールが届かない場合は、迷惑メールフォルダもご確認ください。<br/>
          ＊すでにアカウントをお持ちの場合は、メールが届きません。
            <Link href="/auth/login" className="text-blue-600 underline sm:ml-1">ログイン</Link>をお試しください。
        </p>
        <div className="text-center mt-5 sm:mt-6">
          <Link href="/signup" className="text-sm text-blue-600 hover:underline">
            ← 登録ページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}