'use client'
import Link from 'next/link';
import Image from 'next/image';
import { MdPerson } from 'react-icons/md';
import { useState, useEffect, useRef } from 'react';
import { getProfileById } from '@/utils/supabaseUtils';
import { ProfileUI } from '@/types/types';
import { supabase } from '@/utils/supabaseBrowserClient';
import { useRouter } from 'next/navigation';

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

    // Cleanup subsription on unmount 
    return () => subscription.unsubscribe()
  }, [])

  // Fetch profile when user ID changes
  useEffect(() => {
    // If user ID is null, reset profile
    if (!userId) {
      setProfile(null)
      return
    }
    
    // Fetch profile
    getProfileById(userId)
      .then((profile) => {
        setProfile(profile);
      })
      .catch(() => setProfile(null))
  }, [userId])

  // Handle click outside dropdown to close it
  useEffect(() => {
    // For handling click outside dropdown
    const handleClickOutside = (e: MouseEvent) => {
      // Check if dropdown is open and,
      // if the click is outside the dropdown(the clicked element is not among the elements referenced by dropdownRef)
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        // close dropdown
        setDropdownOpen(false)
      }
    }
    
    // Add event listener for clciking mouse
    document.addEventListener('mousedown', handleClickOutside)

    // Cleanup event listener on unmount
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // For handling logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserId(null)
    setProfile(null)
    setDropdownOpen(false)
    router.push('/login') 
  }

  return (
    <header className="text-white bg-gray-800">
      <div className="container grid grid-cols-2 mx-auto">
        {/* Logo and Title */}
        <h1 className="row-start-1 col-start-1 flex items-center text-2xl font-bold my-3">
          <Link href="/" className="flex items-center text-2xl font-bold">
            <Image
              src="/logo.png"
              alt="TAISEN Logo"
              width={30}
              height={30}
              className="mr-2"
              priority
            />
            TAISEN
          </Link>
        </h1>

        {/* Login or User Icon */}
        <div className="relative row-start-1 col-start-2 flex justify-end" ref={dropdownRef}>
          {userId ? (
            <button
              onClick={() => setDropdownOpen(open => !open)}
              className="cursor-pointer pt-1 focus:outline-none"
            >
              {profile?.image_url ? (
                <div className="rounded-full overflow-hidden w-10 h-10">
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
            <div className="flex items-center pt-1">
              <Link href="/login" className="font-bold hover:text-gray-300 mr-4">
                ログイン
              </Link>
              <Link
                href="/signup"
                className="font-bold rounded hover:bg-white hover:text-gray-800 transition duration-200 py-1 px-4"
              >
                登録
              </Link>
            </div>
          )}
          {dropdownOpen && (
            <div className="absolute z-20 right-0 text-black bg-white rounded shadow-lg mt-2 w-36">
              <Link
                href="/account"
                className="block text-left font-bold rounded hover:bg-gray-100 px-4 py-2 w-full"
                onClick={() => setDropdownOpen(false)}
              >
                マイページ
              </Link>
              <button
                onClick={handleLogout}
                className="block text-left font-bold rounded hover:bg-gray-100 px-4 py-2 w-full"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <div className="row-start-2 col-span-2 border-t-[1.8px] border-[rgba(0,0,0,0.3)]">
          <nav aria-label="Main navigation">
            <ul className="flex gap-x-5 py-4">
              <li>
                <Link href="/" className="font-bold hover:text-gray-300">
                  ランキング
                </Link>
              </li>
              <li>
                <Link href="/create" className="font-bold hover:text-gray-300">
                  対戦カード作成
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
