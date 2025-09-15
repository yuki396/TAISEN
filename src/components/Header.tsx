'use client'
import Link from 'next/link';
import Image from 'next/image';
import { MdPerson } from 'react-icons/md';
import { useState, useEffect, useRef } from 'react';
import { fetchProfileById, signOut } from '@/utils/supabaseBrowserUtils';
import { ProfileUI } from '@/types/types';
import { supabase } from '@/libs/supabaseBrowserClient';
import { useRouter } from 'next/navigation';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export default function Header() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileUI| null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAdmin, loading } = useIsAdmin();


  // Handle click outside dropdown to close it
  const handledropdown = () => {
    // For handling click outside dropdown
    const handleClickOutside = (e: MouseEvent) => {
      // Check if dropdown is open and,
      // if the click is outside the dropdown(the clicked element is not among the elements referenced by dropdownRef)
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        // close dropdown
        setDropdownOpen(false);
      }
    };
    
    // Add event listener for clciking mouse
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup event listener on unmount
    return () => document.removeEventListener('mousedown', handleClickOutside);
    
  };

  useEffect(() => {
    // Set UserID on login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    // Set UserID on first mount
    supabase.auth.getSession()
      .then(({ data }) => setUserId(data.session?.user.id ?? null));

    // Handle dropdown
    handledropdown();

    // Cleanup subsription on unmount 
    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile when user ID changes
  useEffect(() => {
    (async () => {
      // If user ID is null, reset profile
      if (!userId) {
        setProfile(null);
        return;
      }
      
      // Fetch profile
      const {pData, pError} = await fetchProfileById(userId);
      
      if (pError) {
        console.error('Failed to fetch profile', JSON.stringify(pError));
      } else {
        setProfile(pData);
      }
    })();
  }, [userId]);

  // For handling logout
  const handleLogout = async () => {
    await signOut();
    setUserId(null);
    setProfile(null);
    setDropdownOpen(false);
    router.push('/login');
  };

  return (
    <header className="bg-gray-800">
      <div className="container grid grid-cols-2 mx-auto px-3 mt-2">
        {/* Logo and Title */}
        <h1 className="row-start-1 col-start-1 flex items-center text-2xl font-bold my-1 sm:my-3">
          <Link href="/" className="flex items-center text-2xl text-white font-bold italic">
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
              className="pt-1 sm:mb-1 focus:outline-none cursor-pointer"
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
              <Link href="/login" className="text-sm sm:text-base text-white font-bold hover:text-gray-300 sm:mr-4">
                ログイン
              </Link>
              <Link
                href="/signup"
                className="text-sm sm:text-base text-white font-bold rounded hover:bg-white hover:text-gray-800 transition duration-200 py-1 px-4"
              >
                登録
              </Link>
            </div>
          )}
          {dropdownOpen && (
            <div className="absolute z-20 right-0 bg-white rounded shadow-lg mt-2 w-36">
              <Link
                href="/account"
                className="block text-sm sm:text-base text-left font-bold rounded hover:bg-gray-100 px-4 py-2 w-full"
                onClick={() => setDropdownOpen(false)}
              >
                マイページ
              </Link>
              <Link
                href="/create"
                className="block text-sm sm:text-base text-left font-bold rounded hover:bg-gray-100 px-4 py-2 w-full"
                onClick={() => setDropdownOpen(false)}
              >
                対戦カード作成
              </Link>
              <Link
                href="/request"
                className="block text-sm sm:text-base text-left font-bold rounded hover:bg-gray-100 px-4 py-2 w-full"
                onClick={() => setDropdownOpen(false)}
              >
                選手申請
              </Link>
              {!loading && isAdmin && (
                <Link 
                  href="/api/admin/request-msg" 
                  className="block text-sm sm:text-base text-left font-bold rounded hover:bg-gray-100 px-4 py-2 w-full"
                  onClick={() => setDropdownOpen(false)}
                >
                  申請一覧
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="block text-sm sm:text-base text-left font-bold rounded hover:bg-gray-100 px-4 py-2 w-full cursor-pointer"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <div className="row-start-2 col-span-2 ">
          <nav aria-label="Main navigation">
            <ul className="flex gap-x-6 py-3">
              <li>
                <Link href="/" className="text-sm sm:text-base text-white font-bold hover:text-gray-300">
                  対戦カードランキング
                </Link>
              </li>
              <li>
                <Link href="/top4" className="text-sm sm:text-base text-white font-bold hover:text-gray-300">
                  トップフォーファイター
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
