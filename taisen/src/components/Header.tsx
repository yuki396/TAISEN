'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MdPerson } from 'react-icons/md'
import { useState, useEffect } from 'react'
import { getCurrentUser, getProfileById} from '@/utils/supabaseFunction';
import { ProfileUI } from '@/types/types';

export default function Header() {
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<ProfileUI| null>(null)

    useEffect(() => {
    const load = async () => {
      try{
        const userData = await getCurrentUser();
        if (userData) setUserId(userData.id);

        const prof = await getProfileById(userData.id)
        if(prof)
        setProfile(prof)
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.log(e.message)
        } else {
          console.log('不明なエラーが発生しました')
        }
      }
    }
    load()
  }, [])

  return (
    <header className="bg-gray-800 text-white">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* 左側：ロゴ＋ナビゲーション */}
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold">
            <Link href="/">TAISEN</Link>
          </h1>
          <nav aria-label="Main navigation">
            <ul className="flex space-x-4">
              <li>
                <Link href="/" className="hover:text-gray-300">
                  ランキング
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-gray-300">
                  対戦カード作成
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* 右側：ログイン or ユーザーアイコン */}
        <div className="flex items-center space-x-4">
          {userId ? (
            <Link href="/account" className="block">
              {profile?.image_url ? (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={profile.image_url}
                    alt="ユーザーアイコン"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>
              ) : (
                <MdPerson size={40} color="#ccc" />
              )}
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:text-gray-300">
                ログイン
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1 rounded hover:bg-white hover:text-gray-800 transition"
              >
                登録
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
