export type FightCardUI = {
  id: number;
  fighter1: { id: number; name: string; gender: string; } | null;
  fighter2: { id: number; name: string; gender: string; } | null;
  organization: { id: number; name: string; } | null;
  weight_class: { id: number; name: string; } | null;
  fighter1_votes: number;
  fighter2_votes: number;
  popularity_votes: number;
};

export type VoteCardUI = {
  id: number;
  fight_card_id: number;
  vote_type: string | null;
  vote_for: number | null;
};

export type ProfileUI = {
  id: string;
  username: string| null;
  image_url: string| null;
  email: string | null;
};

export type Fighter = { 
    id: number;
    name: string;
    gender: 'male' | 'female';
};
  
export type Organization = {
  id: number; 
  name: string;
};

export type WeightClass = {
  id: number;
  name: string;
  gender: 'male' | 'female';
};
