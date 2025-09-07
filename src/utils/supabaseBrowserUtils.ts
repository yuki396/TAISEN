'use client'
import { supabase } from '@/libs/supabaseBrowserClient';
import type { ProfileUI, FighterRequestForm } from '@/types/types';

// For sign in
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message.toLowerCase();
    const code = error.code;
    const status = error.status;

    if (msg.includes('email not confirmed') || code === 'unconfirmed_email') {
      throw new Error(
        'このメールアドレスは認証されていません。メールのリンクから認証を完了してください。'
      );
    } else if (msg.includes('invalid login credentials') || code === 'invalid_credentials' || status === 400) {
      throw new Error('メールアドレスかパスワードが正しくありません。');
    }else if (msg.includes('rate limit') || code === 'over_request_limit' || status === 429) {
      throw new Error('試行回数の制限を超えました。しばらくしてから再試行してください。');
    }
    throw new Error('不明なエラーが発生しました。しばらくしてから再試行してください。');
  }

  return data;
};

// For sign out
export const signOut = async () => {
  await supabase.auth.signOut();
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
    if (msg.includes('already registered') || msg.includes('user already')) {
      throw new Error('このメールアドレスはすでに登録されています');
    }
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      throw new Error('新規登録試行の回数制限を超えました。しばらくしてから再試行してください');
    }
    throw new Error(`不明なエラーが発生しました。しばらくしてから再試行してください。`);
  }
  
  return data;
};


// For getting settion
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (e: unknown) {
    console.error('Unexpected error during getting session : ', e);
    return false;
  }
};

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
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Failed to get user', JSON.stringify(error));
      return null;
    }
    
    return data.user;
  } catch (e: unknown) {
    console.error('Unexpected error during getting user data : ', e);
    return null;
  }
};

// For fetching user pofile
export const fetchProfileById = async (userId: string) => {
  const { data: pData, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { pData, pError };
};

// For fetching adimin profile
export const fetchAdminStatusbyId = async (userId: string) => {
  const { data: apData, error: apError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  
  return { apData, apError };
};

// For updatting profile
export const updateProfile = async ( id: string, update: Partial<Pick<ProfileUI, 'username' | 'image_url'>>) => {
  const { error: upError } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', id);

  return upError;
};

// For updating image
export const uploadImage = async (filePath: string, file:File) => {
  const { error: upError } = await supabase.storage
  .from('profile')
  .upload(
    filePath, 
    file, 
    { cacheControl: '3600',  upsert: false, } // Set cache expiry to 1 hour and prevent overwriting
  );
  return upError;
}

// For removing image
export const removeImage = async (oldImagePath: string) => {
  await supabase.storage.from('profile').remove([oldImagePath])
}

// For fetching all fight cards
export const fetchFightCards = async (fightCardIds?: string[]) => {
  let query = supabase
    .from('fight_cards')
    .select(`
      id,
      fighter1:fighters!fight_cards_fighter1_id_fkey ( id, name, gender ),
      fighter2:fighters!fight_cards_fighter2_id_fkey ( id, name, gender ),
      organization:organizations!fight_cards_organization_id_fkey ( id, name ),
      weight_class:weight_classes!fight_cards_weight_class_id_fkey ( id, name ),
      fighter1_votes,
      fighter2_votes,
      popularity_votes
    `);

  if (fightCardIds && fightCardIds.length > 0) {
    query = query.in('id', fightCardIds);
  }
  
  const { data: cardsData, error: cardsError } = await query.order(
    'popularity_votes',
    { ascending: false }
  );

  return { cardsData, cardsError };
};

// For inserting fight card
export const insertFightCard = async (
  fighter1Id: number, 
  fighter2Id: number, 
  organizationId: number, 
  weightClassId: number, 
  userId: string
) => {
  const {data: insertData, error: insertCardError} = await supabase
  .from('fight_cards')
  .insert({
    fighter1_id: fighter1Id,
    fighter2_id: fighter2Id,
    organization_id: organizationId,
    weight_class_id: weightClassId,
    created_by: userId
  })
  .select(`
    id,
    fighter1:fighters!fight_cards_fighter1_id_fkey ( id, name, gender ),
    fighter2:fighters!fight_cards_fighter2_id_fkey ( id, name, gender ),
    organization:organizations!fight_cards_organization_id_fkey ( id, name ),
    weight_class:weight_classes!fight_cards_weight_class_id_fkey ( id, name ),
    fighter1_votes,
    fighter2_votes,
    popularity_votes
  `);

  return { insertData, insertCardError }
};

// For counting fighter requests created by user today
export const countTodayFightCard = async (userId: string) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error: countError } = await supabase
    .from('fight_cards')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)
    .gte('created_at', todayStart.toISOString());
  
  return { count, countError };
};

// For fetching all fighters
export const fetchFighters = async () => {
  const { data: fData, error:fError } = await supabase
    .from('fighters')
    .select('id, name, gender');
    
  return { fData, fError };
};

// For fetching fighters by gender
export const fetchFightersByGender = async (gender: 'male' | 'female') => {
  const { data: fData, error:fError } = await supabase
    .from('fighters')
    .select('id, name, gender')
    .eq('gender', gender);
    
  return { fData, fError };
};

// For fetching all organizations
export const fetchOrganizations = async () => {
  const { data: oData, error:oError } = await supabase
    .from('organizations')
    .select('id, name')
    .order('id', { ascending: true });
      
  return { oData, oError };
};

// For fetching all weight classes
export const fetchWeightClasses = async () => { 
  const { data: wData, error: wError } = await supabase
    .from('weight_classes')
    .select('id, name, gender')
    .order('id', { ascending: true });
      
    return { wData, wError };
};

// For fetching weight classes by gender
export const fetchWeightClassesByGender = async (gender: 'male' | 'female') => { 
  const { data: wData, error: wError } = await supabase
    .from('weight_classes')
    .select('id, name, gender')
    .eq('gender', gender)
    .order('id', { ascending: true });
      
    return { wData, wError };
};

// For fetching votes for the current user
export const fetchVotesForCurrentUser = async (userId : string  | null ) => {
  const { data: votesData, error: votesError } = await supabase
    .from('votes')
    .select(`
      id,
      fight_card_id,
      vote_type,
      vote_for
    `).eq('user_id', userId);

  return { votesData, votesError };
};

// For fetching popularity votes for the current use
export const fetchPopularityVotes = async (userId: string | null) => {
  const { data: votesData, error: votesError } = await supabase
    .from('votes')
    .select(`fight_card_id`)
    .eq('user_id', userId)
    .eq('vote_type', 'popularity');
  
  return { votesData, votesError };
};

// For fetching single popularity votes for the card ID
export const fetchVoteByCardId = async (userId: string | null, cardId: number | null, voteType: string) => {
  const { data: voteData, error: voteError } = await supabase
    .from('votes')
    .select('id')
    .eq('user_id', userId)
    .eq('fight_card_id', cardId)
    .eq('vote_type', voteType)
    .maybeSingle();
  
  return { voteData, voteError };
};

// For deleting popurality vote
export const deletePopuralityVotes = async(userId : string | null, selectedCardIds: number[]) => {
  const { data: votesData, error: votesError } = await supabase
    .from('votes')
    .delete()
    .match({ user_id: userId, vote_type: 'popularity' })
    .in('fight_card_id', selectedCardIds);
  
  return { votesData, votesError };
};

// For deleting vote
export const deleteVote = async (voteId: string) => {
  const { error: voteError } = await supabase
    .from('votes')
    .delete()
    .eq('id', voteId);
  
  return voteError;
};

// For inserting prediction vote
export const insertPreVote = async (userId: string | null, cardId: number | null, voteType: string, votedSide?: 1 | 2) => {
   const { data: voteData, error: voteError } = await supabase
    .from('votes')
    .insert({
      user_id: userId,
      fight_card_id: cardId,
      vote_type: voteType,
      vote_for: votedSide
    })
    .select()
    .single();

  return { voteData, voteError };
};

// For inserting popularity vote
export const insertPopVote = async (userId: string | null, cardId: number | null, voteType: string) => {
   const { data: voteData, error: voteError } = await supabase
    .from('votes')
    .insert({
      user_id: userId,
      fight_card_id: cardId,
      vote_type: voteType,
    })
    .select()
    .single();

  return { voteData, voteError };
};

// For fetching all fighter requests
export const fetchFighterRequests = async () => {
  const { data: frData, error: frError } = await supabase
    .from('fighter_requests')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { frData, frError };
};

// For counting fighter requests created by user today
export const countTodayFighterRequests = async (userId: string) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error: countError } = await supabase
    .from('fighter_requests')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)
    .gte('created_at', todayStart.toISOString());

  return { count, countError };
};

// For inserting fighter request
export const insertFighterRequest = async (requestForm: FighterRequestForm) => {

  const { error: insertError } = await supabase
    .from('fighter_requests')
    .insert(requestForm)
    .select('*')
    .single();

  return insertError;
};

// For fetching user top 4 by userId
export const fetchMyTop4 = async (userId: string | null, gender: 'male' | 'female') => {
  const { data: t4Data, error: t4Error } = await supabase
    .from('user_top4')
    .select(`
      fighter:fighter_id ( id, name, gender ),
      weight_class:weight_class_id ( id, name, gender ),
      position
    `)
    .eq('user_id', userId)
    .eq('fighter.gender', gender)
    .order("position", { ascending: true });

  return { t4Data, t4Error };
};

// For deleting user top 4 by weight class id
export const deleteMyTop4 = async (userId: string | null, weightClassId: number, position?: number) => {
  let query  = supabase
    .from('user_top4')
    .delete()
    .eq('user_id', userId)
    .eq('weight_class_id', weightClassId);

  if (position !== undefined) {
    query = query.eq('position', position);
  }
  const { error: t4Error } = await query;

  return t4Error;
};

// For fetching top 4 aggregate view by gender
export async function fetchTop4(gender: 'male' | 'female') {
  const { data, error } = await supabase
    .from('top4_per_wc_slots')
    .select('*')
    .eq('gender', gender)

  return { t4Data: data, t4Error: error };
}

// For fetching top 4 by gender
export const fetchTop4Counts = async (gender: 'male' | 'female') => {
  const { data: t4cData, error: t4cError } = await supabase
    .from('top4_fighters_per_class')
    .select(`
      fighter:fighter_id ( id, name ),
      weight_class:weight_class_id ( id, name ),
      counts,
      rank
    `)
    .eq('gender', gender)
    .order('weight_class_id', { ascending: true })
    .order('rank', { ascending: true });

  return { t4cData, t4cError };
}