import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TAISEN',
  description: 'キックボクシングファンが作ったキックボクシングファンのためのサイトです！実現したい対戦カードの投票/勝敗予想ができます。今後機能を追加していく予定です。'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="jp">
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className={`${inter.className} flex flex-col text-black bg-white min-h-screen`}>
        <Header />
        <main className="container flex-1 mx-auto px-4 py-8">
          <Toaster position="top-center" reverseOrder={false} />
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
