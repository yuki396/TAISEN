'use client'
import { supabase } from './supabaseBrowserClient';
import type { ProfileUI } from '@/types/types';

// For sign in
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('email not confirmed')) {
      throw new Error('このメールアドレスは認証されていません。メールのリンクから認証を完了してください。');
    }
    if (msg.includes('invalid login credentials')) {
      throw new Error('メールアドレスかパスワードが正しくありません。');
    }
    throw new Error('ログインに失敗しました。');
  }

  return data;
};

// For sign up
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth-callback`,
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('already registered')) {
      throw new Error('このメールアドレスは既に登録されています');
    }
    if (msg.includes('rate limit')) {
      throw new Error('新規登録試行の回数制限を超えました。しばらくしてから再試行してください');
    }
    throw new Error(`アカウント登録に失敗しました`);
  }
  
  return data;
};


// For getting settion
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession()
    return !!data.session
  } catch (e: unknown) {
    console.warn('Failed to get session : ', e)
    return false
  }
}

// For Google OAuth sign-in
export const signInWithGoogle = async () => {
  const data = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`
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
    console.error('Unexpected error during getting user data : ', e)
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

// For fetching fight cards
export const fetchFightCards = async () => {
  const { data: cardsData, error: cardsError } = await supabase
    .from("fight_cards")
    .select(`
      id,
      fighter1:fighters!fight_cards_fighter1_id_fkey ( id, name, gender ),
      fighter2:fighters!fight_cards_fighter2_id_fkey ( id, name, gender ),
      organization:organizations!fight_cards_organization_id_fkey ( id, name ),
      weight_class:weight_classes!fight_cards_weight_class_id_fkey ( id, name ),
      fighter1_votes,
      fighter2_votes,
      popularity_votes
    `)
    .order("popularity_votes", { ascending: false }) 
  
  return { cardsData, cardsError };
}

// For fetching fighter
export const fetchFighters = async () => {
    const { data: fData, error:fError } = await supabase
        .from('fighters')
        .select('id, name, gender');
      
    return {fData, fError};
}

// For fetching organizations
export const fetchOrganizations = async () => {
    const { data: oData, error:oError } = await supabase
      .from('organizations')
      .select('id, name')
      .order('id', { ascending: true });
      
    return {oData, oError};
}


// For fetching weight classes
export const fetchWeightClassesByGender = async (gender: "male" | "female") => { 
  const { data: wData, error: wError } = await supabase
    .from('weight_classes')
    .select('id, name, gender')
    .eq('gender', gender)
    .order('id', { ascending: true });
      
    return {wData, wError};
}

// For fetching weight classes
export const fetchWeightClasses = async () => { 
  const { data: wData, error: wError } = await supabase
    .from('weight_classes')
    .select('id, name, gender')
    .order('id', { ascending: true });
      
    return {wData, wError};
}

// For fetching votes for the current user
export const fetchVotesForCurrentUser = async (userId : string  | null ) => {
  const { data: votesData, error: votesError } = await supabase
    .from("votes")
    .select(`
      id,
      fight_card_id,
      vote_type,
      vote_for
    `).eq("user_id", userId)

  return { votesData, votesError};
}
  
