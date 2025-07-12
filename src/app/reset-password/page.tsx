'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabaseBrowserClient'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    // パスワードバリデーション: 8文字以上、大小文字、数字を含む
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!pwdRegex.test(password)) {
      setError('パスワードは8文字以上で、大文字・小文字・数字を含める必要があります')
      return
    }

    // パスワードと確認が一致しない場合
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    // Supabase でパスワード更新
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setMessage('パスワードが更新されました。ログインページに戻ります。')
      setTimeout(() => router.push('/login'), 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-xl font-bold mb-4 text-center">新しいパスワードを設定</h2>
        {message && <p className="text-green-600 text-sm mb-4 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mb-4 text-center">エラー：{error}</p>}

        <form onSubmit={handleUpdatePassword}>
          <label className="block mb-2 text-sm">新しいパスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded mb-4"
          />

          <label className="block mb-2 text-sm">パスワード（確認）</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded mb-4"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            パスワードを更新
          </button>
        </form>
      </div>
    </div>
  )
}