'use client'
import { useState } from 'react';
import { supabase } from '@/utils/supabaseBrowserClient';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setErrorMsg] = useState('')

  // For handling password upadate
  const handleUpdatePassword = async (e: React.FormEvent) => {
    // Prevent the browser's default behavior (automatic page reload)
    e.preventDefault()

    setMessage('')
    setErrorMsg('')

    // Check if password is valid (at least 8 characters, uppercase and lowercase, and numbers)
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!pwdRegex.test(password)) {
      setErrorMsg('パスワードは8文字以上で、大文字・小文字・数字を含める必要があります')
      return
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setErrorMsg('パスワードが一致しません')
      return
    }

    // Update the password
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('rate limit')) {
        setErrorMsg('メール送信の回数制限を超えました。しばらくしてから再試行してください。');
        return
      }
      console.error('Failed to reset password : ', error)
      setErrorMsg(`パスワードのリセットに失敗しました。`)
    } else {
      router.push('/reset-comp')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded shadow-md p-8 w-100">
        <h2 className="text-center text-xl font-bold">新しいパスワードを設定</h2>
        {message && <p className="text-center text-sm text-green-600 mt-4">{message}</p>}
        {error && <p className="text-red-600 bg-red-50 border border-red-300 rounded p-2 mt-4">{error}</p>}

        <form onSubmit={handleUpdatePassword} className="mt-6">
          <label className="text-sm">新しいパスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-300 rounded px-3 py-2 mt-2 w-full"
          />

          <label className="text-sm mt-4">パスワード（確認）</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="border border-gray-300 rounded px-3 py-2 mt-2 w-full"
          />

          <button
            type="submit"
            className="text-white bg-blue-600 hover:bg-blue-700 transition buration-200 rounded py-2 mt-5 w-full cursor-pointer"
          >
            パスワードを更新
          </button>
        </form>
      </div>
    </div>
  )
}