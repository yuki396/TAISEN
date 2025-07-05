'use client';

import { supabase } from './supabaseBrowserClient';
import type { ProfileUI } from '@/types/types';

// For sign in
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

// For sign up
export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({ email, password });
};

// For getting settion
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const { data} = await supabase.auth.getSession()
    return !!data.session
  } catch (e: unknown) {
    console.warn('セッション取得時に例外:', e)
    return false
  }
}

// For Google OAuth sign-in
export const signInWithGoogle = async () => {
  const data = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    }
  });
  return data;
};

// For getting user info
export const getCurrentUser = async () => {
  try {
    const { data } = await supabase.auth.getUser()
    return data.user 
  } catch (e: unknown) {
    console.error('ユーザー取得時に例外:', e)
    return null
  }
}

// For getting user pofile info 
export const getProfileById = async (id: string): Promise<ProfileUI> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) throw new Error('プロフィールの取得に失敗しました')
  return data
}

// For updatting profile
export const updateProfile = async ( id: string, update: Partial<Pick<ProfileUI, 'username' | 'image_url'>>) => {
  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', id)
  if (error) throw new Error('プロフィールの更新に失敗しました')
}
