'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabaseBrowserClient'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    const { error } = await supabase.auth.updateUser({ password})

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
        {message && <p className="text-green-600 text-sm mb-4">{message}</p>}
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <form onSubmit={handleUpdatePassword}>
          <label className="block mb-2 text-sm">新しいパスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded mb-4"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            パスワードを更新
          </button>
        </form>
      </div>
    </div>
  )
}
