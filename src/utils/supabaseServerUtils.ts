import { getServerSupabase } from '@/libs/supabaseServerClient';
import type { FighterRequest } from '@/types/types';

// For getting user info
export const getCurrentUser = async () => {
  try {
    const supabase = getServerSupabase();
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (e: unknown) {
    console.error('Unexpected error during getting user data : ', e);
  }
};

// For fetching fight cards
export const fetchFigherCards = async () => {
  const supabase = getServerSupabase();
  const { data: cardsData, error: cardsError } = await supabase
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
    `)
    .order('popularity_votes', { ascending: false });

  return { cardsData, cardsError };
};

export const fetchVotesByUserId = async (userId: string) => {
  const supabase = getServerSupabase();
  const { data: votesData, error: votesError } = await supabase
    .from('votes')
    .select(`
      id,
      fight_card_id,
      vote_type,
      vote_for
    `)
    .eq('user_id', userId);
  
    return { votesData, votesError};
};
// For fetching profile info for admin
export const fetchProfileForAdmin = async (userId: string) => {
  try {
    const supabase = getServerSupabase();
    const { data: pData, error: pError } = await supabase
      .from('profiles')
      .select('id, username, is_admin')
      .eq('id', userId)
      .maybeSingle();
    
    return { pData, pError };
  } catch (e: unknown) {
    console.error('Unexpected error during fetching profile data : ', e);
    return { pData: null, pError: e };
  }
};

// For fetching all fighter requests
export const fetchFighterRequests = async () => {
  try {
    const supabase = getServerSupabase();
    const { data: frData, error: frError } = await supabase
      .from('fighter_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { frData, frError };
  } catch (e: unknown) {
    console.error('Unexpected error during fetching profile data : ', e);
    return { frData: null, frError: e };
  }
};

// For fetching fighter request by id
export const fetchFighterRequestById = async (id: number) => {
  try {
    const supabase = getServerSupabase();
    const { data: frData, error: frError } = await supabase
      .from('fighter_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    return { frData, frError };
  } catch (e: unknown) {
    console.error('Unexpected error during fetching fighter request data : ', e);
    return { frData: null, frError: e};
  }
};

// For inserting fighter
export const insertFighter = async (name: string) => {
  try {
    const supabase = getServerSupabase();
    const { data: fData, error: fError } = await supabase
      .from('fighters')
      .insert({ name })
      .select()
      .single();
    
    return { fData, fError };
  } catch (e: unknown) {
    console.error('Unexpected error during fetching fighter : ', e);
    return { fData: null, fError: e };
  }
};

// For deleting fighter
export const deleteFighter = async (id: number) => {
  try {
    const supabase = getServerSupabase();
    const { error: delError } = await supabase
      .from('fighters')
      .delete()
      .eq('id', id);
    
    return delError;
  } catch (e: unknown) {
    console.error('Unexpected error during deleting fighter data : ', e);
  }
};

// For updating fighter request
export const updateFighterRequest = async (requestForm: FighterRequest) => {
  try {
    const supabase = getServerSupabase();
    const { data: upData, error: upError } = await supabase
      .from('fighter_requests')
      .update(requestForm)
      .eq('id', requestForm.id)
      .select()
      .single();
    
    return { upData, upError };
  } catch (e: unknown) {
    console.error('Unexpected error during updating fighter request data : ', e);
    return { upData: null, upError: e };
  }
};

// For deleting fighter request
export const deleteFighterRequest = async (id: number) => {
  try {
    const supabase = getServerSupabase();
    const { error: delError } = await supabase
      .from('fighter_requests')
      .delete()
      .eq('id', id);

    return delError;
  } catch (e: unknown) {
    console.error('Unexpected error during updating deleting fighter request data : ', e);
  }
};
