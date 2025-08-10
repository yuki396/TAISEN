# TAISEN
**TAISEN** は、キックボクシングファンが作ったキックボクシングファンのためのサイトです。
現在はキックボクシングファンの「こんな試合カードが見たい！」を集め、投票やランキングで盛り上がれるサービスとなっています。
今後機能を追加していく予定です。


## ✨ 主な機能
- 🔐 ユーザー認証（メールアドレス & Google OAuth）  
- 🎴 対戦カードの作成
- ✅ 投票機能（人気投票 & 勝敗予想）
- 📊 対戦カードの階級別・団体別のランキング表示・検索
- 👤 マイページ 

## 🌲 プロジェクト構成
```
TAISEN/
├── public/                # 静的ファイル（画像・favicon等）
├── src/
│   ├── app/
│   │     ├── account/         # マイページ
│   │     ├── allrankings/     # 11位以降のランキング一覧ページ
│   │     ├── auth-callback/   # メールアドレスの認証完了ページ
│   │     ├── create/          # 対戦カード作成ページ
│   │     ├── forgot-password/ # パスワードリセットページ
│   │     ├── login/           # ログインページ
│   │     ├── privacy/         # プライバシーポリシーページ
│   │     ├── reset-comp/      # パスワードリセット完了ページ
│   │     ├── reset-password/  # 新パスワード入力ページ
│   │     ├── reset-send/      # パスワードリセットメール送信完了ページ
│   │     ├── signup/          # 新規登録ページ
│   │     ├── signup-confirm/  # 登録確認メール送信完了ページ
│   │     └── terms/           # 利用規約ページ
│   ├── componets/          # 再利用可能なReactコンポーネント
│   ├── types/               # Supabaseクライアントやユーティリティ
│   └── utils/             # 型定義（TypeScript用）
├── .env.local             # 環境変数（SupabaseのURLやキー等）
└── ...（その他設定ファイル）
```

## 🛠️ 技術スタック
Supabase をバックエンドに、Next.js／React／TypeScript で開発し、Vercel へデプロイしています。
- **フロントエンド**  
  - Next.js 15  
  - React + TypeScript  
  - Tailwind CSS  
  - React Icons  
- **バックエンド／データベース**  
  - Supabase (PostgreSQL + Auth + Storage)  
- **デプロイ**  
  - Vercel  

## 🚀 セットアップ  
以下の手順で、ローカル開発環境を構築できます。

1. **リポジトリをクローン**
  ```
  git clone https://github.com/yuki396/TAISEN.git
  ```
2. **パッケージをインストール** 
  ```
  npm install
  # または
  yarn install
  ```
3. **Tailwind CSS を初期化（初回のみ）** 
  ```
  npx tailwindcss init -p
  ```
4. **環境変数ファイルを作成**
  プロジェクトルートに .env.local を作成し、以下を設定します。
  ```
  NEXT_PUBLIC_SUPABASE_URL=＜Supabase URL＞
  NEXT_PUBLIC_SUPABASE_ANON_KEY=＜Supabase 匿名キー＞
  ```
5. **開発サーバーを起動**
  ```
  npm run dev
  # または
  yarn dev
  ```