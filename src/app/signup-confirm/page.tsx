'use client'
import Link from "next/link";

export default function SignupConfirmPage() {
  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded p-8">
        <h2 className="text-center text-4xl font-bold mt-3">メールアドレス確認メールを送信しました</h2>
        <p className="text-center text-lg text-gray-600 mt-8">
          登録したメールアドレスにメールアドレス認証用のリンクを送信しました。<br />
          メールをご確認ください。メールアドレスの認証を行わないと、ログインができません。
        </p>
        <p className="text-center text-lg text-gray-600 mt-5">
          メールが届かない場合は、迷惑メールフォルダもご確認ください。
        </p>
        <div className="text-center mt-6">
          <Link href="/signup" className="text-blue-600 hover:underline cursor-pointer">
            ← 登録ページに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}