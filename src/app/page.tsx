export const dynamic = 'force-dynamic';

import HomeClient from '@/app/HomeClient';
import { fetchFigherCards, getCurrentUser, fetchVotesByUserId } from '@/utils/supabaseServerUtils';
import { FightCardUI, VoteCardUI } from '@/types/types';

export default async function Home() {
  const user = await getCurrentUser();

  // Fetch initial fight cards data
  const { cardsData, cardsError } = await fetchFigherCards();

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
        <div className="text-gray-500">
          データ取得に失敗しました
        </div>
      </div>
    );
  }

  // Fetch initial votes data
  let votes: VoteCardUI[] = [];
  if (user?.id){
    const { votesData, votesError } = await fetchVotesByUserId(user.id);
    
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
        <div className="text-gray-500">
          データ取得に失敗しました
        </div>
      </div>
      );
    }
  }
  
  return (
    <div className="min-h-screen px-4">
      <HomeClient initialFightCards={cards} initialVotedCards={votes}/>
    </div>
  );
}
