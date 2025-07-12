'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/utils/supabaseBrowserClient'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/
    if (!emailRegex.test(email)) {
      setError('正しいメールアドレスを入力してください')
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      router.push('/send-complete')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <div className="mb-4 text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            ← ログインに戻る
          </Link>
        </div>
        <h2 className="text-2xl font-bold mt-7 text-center">パスワードをお忘れですか？</h2>
        <p className="text-sm text-gray-600 mt-4 text-center">
          登録したメールアドレスを入力してください。<br />
          パスワード再設定用のリンクを送信します。
        </p>
        <form onSubmit={handleResetPassword}>
          <label htmlFor="email" className="block text-sm font-medium mt-7">
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
          {error && <p className="text-red-600 mt-5 text-center">エラー：{error}</p>}
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 mt-5 w-full rounded cursor-pointer hover:bg-blue-700 transition"
          >
            送信する
          </button>
        </form>
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
