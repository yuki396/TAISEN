import HomeClient from '@/app/HomeClient';
import { getSupabaseServerClient} from '@/utils/supabaseServerClient';
import { FightCardUI, VoteCardUI } from '@/types/types';

export default async function Home() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch initial fight cards data
  const { data: cardsData, error: cardsError } = await supabase
    .from("fight_cards")
    .select(`
      id,
      fighter1:fighters!fight_cards_fighter1_id_fkey ( id, name, gender ),
      fighter2:fighters!fight_cards_fighter2_id_fkey ( id, name, gender ),
      organization:organizations!fight_cards_organization_id_fkey ( id, name ),
      weight_class:weight_classes!fight_cards_weight_class_id_fkey ( id, name, gender),
      fighter1_votes,
      fighter2_votes,
      popularity_votes
    `)
    .order("popularity_votes", { ascending: false })

  let cards: FightCardUI[] = [];
  if (!cardsError && cardsData) {
    cards = cardsData.map((v) => ({
      id: v.id,
      fighter1: Array.isArray(v.fighter1) ? v.fighter1[0] ?? null : (v.fighter1 ?? null),
      fighter2: Array.isArray(v.fighter2) ? v.fighter2[0] ?? null : (v.fighter2 ?? null),
      organization: Array.isArray(v.organization) ? v.organization[0] ?? null : (v.organization ?? null),
      weight_class: Array.isArray(v.weight_class) ? v.weight_class[0] ?? null : (v.weight_class ?? null),
      fighter1_votes: v.fighter1_votes ?? 0,
      fighter2_votes: v.fighter2_votes ?? 0,
      popularity_votes: v.popularity_votes ?? 0,
    }));
  } else {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          データ取得に失敗しました
        </div>
      </div>
    );
  }

  // Fetch initial votes data
  let votes: VoteCardUI[] = [];
  if (user?.id){
    const { data: votesData, error: votesError } = await supabase
      .from("votes")
      .select(`
        id,
        fight_card_id,
        vote_type,
        vote_for
      `)
      .eq("user_id", user?.id)
    
    if (!votesError && votesData) {
      votes = votesData.map((v) => ({
        id: v.id ?? 0,
        fight_card_id: v.fight_card_id ?? 0,
        vote_type: v.vote_type ?? null,
        vote_for: v.vote_for ?? null,
      }));
    } else {
      return (
      <div className="flex items-center justify-center">
        <div className="text-center ">
          データ取得に失敗しました
        </div>
      </div>
      );
    }
  }
  
  return (
    <div>
      <HomeClient initialFightCards={cards} initialVotedCards={votes}/>
    </div>
  );
}
