export type FightCardUI = {
  id: number;
  fighter1: { id: number; name: string } | null;
  fighter2: { id: number; name: string } | null;
  organization: { id: number; name: string } | null;
  weight_class: { id: number; name: string } | null;
  fighter1_votes: number | 0;
  fighter2_votes: number | 0;
  popularity_votes: number | 0;
};

export type VoteCardUI = {
    id: number;
    fight_card_id: number;
    user_id: { id: string; name: string } | null;
    fighter1: { name: string} | null;
    fighter2: { name: string } | null;
    vote_type: string | null;
    vote_for: number | null;
};

export type ProfileUI = {
    id: string;
    username: string| null;
    image_url: string| null;
    created_at: string | null;
    updated_at: string | null;
    email: string | null;
};