'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MdPerson } from 'react-icons/md'
import { useState, useEffect, useRef } from 'react'
import { getProfileById } from '@/utils/supabaseFunction';
import { ProfileUI } from '@/types/types';
import { supabase } from '@/utils/supabaseBrowserClient'
import { useRouter } from 'next/navigation'

export default function Header() {
  const router = useRouter()  
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileUI| null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Set UserID on login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
    })

    // Set UserID on first mount
    supabase.auth.getSession()
      .then(({ data }) => setUserId(data.session?.user.id ?? null))

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }
    getProfileById(userId)
      .then(setProfile)
      .catch(() => setProfile(null))
  }, [userId])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserId(null)
    setProfile(null)
    setDropdownOpen(false)
    router.push('/login') 
  }

  return (
    <header className="bg-gray-800 text-white">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Logo and Navigation */}
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

        {/* Login or User Icon */}
        <div className="relative inline-block" ref={dropdownRef}>
          {userId ? (
            <button
              onClick={() => setDropdownOpen(open => !open)}
              className="cursor-pointer focus:outline-none"
            >
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
            </button>
          ) : (
            <>
              <Link href="/login" className="mx-2 hover:text-gray-300">
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
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded shadow-lg z-20">
              <Link
                href="/account"
                className="block px-4 py-2 rounded hover:bg-gray-100"
                onClick={() => setDropdownOpen(false)}
              >
                マイページ
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left rounded px-4 py-2 hover:bg-gray-100"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
