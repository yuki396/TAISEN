'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/utils/supabaseBrowserClient'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('パスワード再設定用のリンクを送信しました。メールをご確認ください。')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        {/* ログインに戻る */}
        <div className="mb-4 text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            ← ログインに戻る
          </Link>
        </div>

        {/* タイトル */}
        <h2 className="text-2xl font-bold mt-10 text-center">パスワードをお忘れですか？</h2>

        {/* 説明文 */}
        <p className="text-sm text-gray-600 mt-5 text-center">
          登録したメールアドレスを入力してください。<br />
          パスワード再設定用のリンクを送信します。
        </p>

        {/* 成功・エラーメッセージ */}
        {message && <p className="text-green-600 text-sm mt-10">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-10">{error}</p>}

        {/* フォーム */}
        <form onSubmit={handleResetPassword}>
          <label htmlFor="email" className="block text-sm font-medium mt-8">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded mt-3"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 mt-5 w-full rounded cursor-pointer hover:bg-blue-700 transition"
          >
            送信する
          </button>
        </form>

        {/* 新規登録リンク */}
        <div className="mt-4 text-center text-sm">
          アカウントをお持ちでない場合は{' '}
          <Link href="/signup" className="text-blue-600 cursor-pointer hover:underline">
            新規登録
          </Link>
        </div>
      </div>
    </div>
  )
}