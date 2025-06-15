import { supabase } from './supabaseBrowserClient';
import type { ProfileUI } from '@/types/types';


// For getting settion
export const isLoggedIn = async () => {
  const { data: sessionData, error } = await supabase.auth.getSession()
  if (error) {
    console.error('セッション取得エラー:', error.message)
    return false
  }
  return !!sessionData.session
}

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

// For sign up
export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({ email, password });
};

// For Google OAuth sign-in
export const signInWithGoogle = async () => {
  const data = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/account`,
    }
  });
  return data;
};

// For getting user info
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data) throw new Error('ユーザー情報の取得に失敗しました')
  return data.user
}

// For getting user pofile info 
export const getProfileById = async (id: string): Promise<ProfileUI> => {
  console.log("id：", id)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) throw new Error('プロフィールの取得に失敗しました')
  return data
}

// For updatting profile
export const updateProfile = async (
  id: string,
  update: Partial<Pick<ProfileUI, 'username' | 'image_url'>>
) => {
  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', id)

  if (error) throw new Error('プロフィールの更新に失敗しました')
}
