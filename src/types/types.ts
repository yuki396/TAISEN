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
  username: string | null;
  image_url: string | null;
  email: string | null;
};

export type Fighter = { 
    id: number;
    name: string;
    gender?: 'male' | 'female';
};
  
export type Organization = {
  id: number; 
  name: string;
};

export type WeightClass = {
  id: number;
  name: string;
  gender?: 'male' | 'female';
};

export type FighterRequestForm =
  | {
      request_type: 'add';
      player_name: string;
      created_by: string;
    }
  | {
      request_type: 'delete';
      player_name: string;
      target_fighter_id: number | undefined;
      delete_reason: DeleteReason;
      created_by: string;
    };

export type RequestType = 'add' | 'delete';

export type DeleteReason = 'retirement' | 'switch_sport';

export type FighterRequest = {
  id: number;
  request_type?: RequestType;
  player_name?: string | null;
  target_fighter_id?: number | null;
  delete_reason?: DeleteReason | null;
  status: 'pending' | 'approved' | 'rejected';
  created_by?: string;
  created_at?: string;
  processed_by?: string | null;
  processed_at?: string | null;
};

export type Top4 = {
  user_id?: string | null;
  fighter: { id: number; name: string; };
  weightClass: { id: number; name: string; };
  position: number;
};

export type Top4UI = {
  weightClass: {id: number; name:string},
  fighters: [{id: number, name:string}, {id: number, name: string}, {id: number, name: string}, {id: number, name: string}];
};

export type MyTop4 = {
  user_id: string | null,
  weight_class_id: number,
  fighter_id: number,
  position: number
};
