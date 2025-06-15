// src/hooks/useUser.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabaseBrowserClient'
import type { Profile } from '@/types/supabase'

export function useUser(): Profile | null {
  const [user, setUser] = useState<Profile | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchUser = async () => {
      // 現在のセッションを取得
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        if (isMounted) setUser(null)
        return
      }

      const authUser = session.user

      // profiles テーブルからプロフィールを取得
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error || !profile) {
        console.error('プロフィールの取得に失敗しました', error)
        if (isMounted) setUser(null)
      } else if (isMounted) {
      if (profile && isMounted) {
        setUser({
          id: authUser.id,
          email: authUser.email ?? null, 
          username: profile.username,
          avatar_url: profile.avatar_url,
        })
      }
      }
    }

    // 初回フェッチ
    fetchUser()

    // 認証状態の変化を監視
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser()
      } else if (isMounted) {
        setUser(null)
      }
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return user
}
