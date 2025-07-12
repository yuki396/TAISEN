'use client'

export default function SendCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md">
        <h2 className="text-4xl font-bold text-center mt-3">パスワード再設定メールを送信しました</h2>
        <p className="text-lg text-gray-600 mt-8">
          登録したメールアドレスにパスワード再設定用のリンクを送信しました。<br />
          メールをご確認ください。
        </p>
        <p className="text-lg text-gray-600 mt-5">
          メールが届かない場合は、迷惑メールフォルダもご確認ください。
        </p>
        <div className="text-center mt-6">
          <a href="/login" className="text-blue-600 hover:underline">
            ← ログインページに戻る
          </a>
        </div>
      </div>
    </div>
  )
}
