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
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Header />
        <main className="container flex-1 mx-auto sm:px-4 sm:py-8 py-2">
          <Toaster position="top-center" reverseOrder={false} />
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
