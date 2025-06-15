import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import Header from '../components/Header'
import Footer from '../components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "TAISEN",
  description: "TAISENは、ファンが望む対戦カードを作成、投票できるプラットフォームです。ファンの思いを団体/選手に伝えよう！",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="jp">
      <body className={`${inter.className} flex flex-col min-h-screen bg-white text-black`}>
        <Header />
        <main className="container mx-auto flex-grow px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
