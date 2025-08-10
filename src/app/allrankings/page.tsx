'use client'
import { useEffect, useState, useMemo} from 'react';
import Link from "next/link";
import { MdHowToVote } from "react-icons/md";
import { supabase } from '@/utils/supabaseBrowserClient';
import { FightCardUI, VoteCardUI } from '@/types/types';
import { getCurrentUser, isLoggedIn, fetchVotesForCurrentUser } from '@/utils/supabaseUtils';
import { isSmallFont, insertLineBreak, noBreakDots } from '@/utils/textUtils';

export default function AllRankingsPage() {
  const [filteredCards, setFilteredCards] = useState<FightCardUI[]>([]);
  const [votedCards, setVotedCards] = useState<VoteCardUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const DISPLAY_INITIAL = 30;
  const [displayCount, setDisplayCount] = useState(DISPLAY_INITIAL);

  useEffect(() => {
    (async () => {
      //Display Loading 
      setLoading(true)
      
      // Get current userData
      const user = await getCurrentUser();
      if (user) setUserId(user.id)
      
      // Get filteredCards from session storage
      if (typeof window !== 'undefined') {
        const storedCards = sessionStorage.getItem('filteredCards');
        if (storedCards) setFilteredCards(JSON.parse(storedCards));
      }

      // Fetch votes for ther current user
      if (user?.id) {
        const { votesData, votesError } = await fetchVotesForCurrentUser(user.id);

        if (!votesError && votesData) {
          const votes: VoteCardUI[] = votesData.map((v) => ({
            id: v.id ?? 0,
            fight_card_id: v.fight_card_id ?? 0,
            vote_type: v.vote_type ?? null,
            vote_for: v.vote_for ?? null,
          }));
          setVotedCards(votes);
        } else {
          console.error("Failed to fetch votes", votesError)
        }
      }      
      setLoading(false)
    })();
  }, []);

  // For haandling popularity vote
  const handlePopularityVote = async(cardId: number) => {
    try{
      // Confirm login
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        alert('ログインしてください。')
        return
      };

      // Get popularity vote data from user ID
      const { data: existingVoteData, error: fetchError } = await supabase
        .from("votes")
        .select("id")
        .eq("user_id", userId)
        .eq("fight_card_id", cardId)
        .eq("vote_type", "popularity")
        .maybeSingle();
      
      if (fetchError) {
        console.error("Failed to ", fetchError);
        return;
      }

      // Check the limit of the number of popular votes
      const popularityCount = votedCards.filter(v => v.vote_type === "popularity").length;
      if (!existingVoteData && popularityCount >= 30) {
        alert("人気投票は30件までです。");
        return;
      }
    
      // Check if you've already voted
      if (existingVoteData) {
        // Delete popularity vote data from votes table
        const { error: deleteError } = await supabase
          .from("votes")
          .delete()
          .eq("id", existingVoteData.id);

        if (deleteError) {
          console.error("Failed to delete vote : ", deleteError);
        } else {
          // Remove the vote from the state
          setVotedCards((prev) => prev.filter((v) => v.id !== existingVoteData.id));
          setFilteredCards((prev) =>
            prev.map((c) => 
              c.id === cardId ? { ...c, popularity_votes: Math.max((c.popularity_votes ?? 1) - 1, 0) } : c
            )
          );
        }
      } else {
        // Insert popularity vote data into votes table
        const { data: voteData, error: insertError } = await supabase
        .from("votes")
        .insert({
          user_id: userId,
          fight_card_id: cardId,
          vote_type: "popularity",
        })
        .select()
        .single();

        if (insertError) {
          if (insertError.code === "23505") {
            console.warn("already voted for this card");
          } else {
            console.error("Failed to vote : ", insertError);
          }
        } else if (voteData) {
          // Add the new vote to the state
          setVotedCards((prev) => [...prev, voteData]);
          setFilteredCards((prev) =>
            prev.map((c) =>
              c.id === cardId
                ? {
                    ...c,
                    popularity_votes: (c.popularity_votes ?? 0) + 1,
                  }
                : c
            )
          );
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(e.message);
      } else {
        console.error('Unexpected error during popularity vote : ', e);
      }
    }
  };

  // For reordering fightCards based on popularity votes
  const sortedFilteredCards = useMemo(() => {
    return [...filteredCards].sort(
      (card1, card2) => (card2.popularity_votes ?? 0) - (card1.popularity_votes ?? 0)
    );
  }, [filteredCards]);
  const under10 = sortedFilteredCards.slice(9, 9 + displayCount);

  // For checking if you voted
  const isPopularityVoted = (cardId: number): boolean => {
    return votedCards.some(
      (v) => v.fight_card_id === cardId && v.vote_type === "popularity"
    );
  };

  // For displaying more cards
  const DISPLAY_INCREMENT = 20;
  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + DISPLAY_INCREMENT);
  };

  if (loading) return <div className="min-h-screen text-center p-4">読み込み中...</div>

  return (
    <div className="min-h-screen mt-4">
      <Link href="/" className="text-gray-500 hover:text-blue-800 cursor-pointer">
        ← ランキングトップに戻る
      </Link>
      {under10.length === 0 ? (
        <div className="flex justify-center items-center h-60">
          <p className="text-2xl text-gray-400">対戦カードがありません</p>
        </div>
      ) : (
        <div className="grid justify-center items-center gap-5 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {under10.map((card, index) => {
            const popVoted = !!isPopularityVoted(card.id);
            return(
              <div
                key={card.id}
                className="relative bg-white rounded-lg px-6 py-3 h-[240px] min-w-[200px] md:min-w-[300px] lg:min-w-[300px] 
                            shadow-[0_-2px_6px_rgba(255,0,0,0.4),0_2px_6px_rgba(255,0,0,0.4)] 
                            hover:shadow-[0_-4px_12px_rgba(255,0,0,0.8),0_4px_12px_rgba(255,0,0,0.8)]"
              >
                <div className="absolute top-2 left-2 text-sm font-bold bg-gray-100 rounded  px-2 py-1">
                  {index + 11}位
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center text-center gap-x-4 mt-9 h-[90px]">
                    <div 
                      className={`flex-1 font-semibold whitespace-pre-line break-keep overflow-hidden rounded px-3 py-1 min-w-[100px]
                      ${isSmallFont(card.fighter1?.name) ? "text-lg" : "text-xl"}`}
                    >
                      {noBreakDots(insertLineBreak(card.fighter1?.name, 6))}
                    </div>
                    <span className="text-xl font-semibold">vs</span>
                    <div 
                      className={`flex-1 font-semibold whitespace-pre-line break-keep overflow-hidden rounded px-3 py-1 min-w-[100px]
                      ${isSmallFont(card.fighter2?.name) ? "text-lg" : "text-xl"}`}
                    >
                      {noBreakDots(insertLineBreak(card.fighter2?.name, 6))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-y-2 mt-5">
                    <div className="flex gap-x-2">
                      <span className="text-black bg-gray-100 rounded px-1 py-1">
                        {card.organization?.name}
                      </span>
                      <span className="text-black bg-gray-100 rounded px-1 py-1">
                        {card.weight_class?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-x-4">
                      <div 
                        className="flex items-center gap-x-1 cursor-pointer"
                        onClick={() => handlePopularityVote(card.id)}
                      >
                        <MdHowToVote size={24} />
                        <span className="text-sm text-gray-600">{card.popularity_votes}</span>
                      </div>
                        {popVoted && (
                          <div className="text-sm font-bold">
                            投票済み
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {displayCount + 9 < sortedFilteredCards.length && (
        <div className="text-center mt-6">
          <button
            onClick={handleLoadMore}
            className="text-gray-500 hover:text-blue-800 px-4 py-2 cursor-pointer"
          >
            もっと見る
          </button>
        </div>
      )}
    </div>
  );
}
