'use client'

import { useEffect, useState } from 'react'
import Link from "next/link";
import { MdHowToVote } from "react-icons/md";
import { supabase } from '@/utils/supabaseBrowserClient';
import { FightCardUI, VoteCardUI } from '@/types/types';
import { getCurrentUser } from '@/utils/supabaseFunction'

// For returning background style according to rank
const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-glossy-gold text-white";
    case 2:
      return "bg-glossy-silver text-white";
    case 3:
      return "bg-glossy-bronze text-white";
    default:
      return "bg-red-500 text-white";
  }
};

// For returning the border style according to the rank
const getRankBorderColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "gold-border";
    case 2:
      return "silver-border";
    case 3:
      return "bronze-border";
    default:
      return "";
  }
};

export default function AllRankingsPage() {
  const [filteredCards, setFilteredCards] = useState<FightCardUI[]>([]);
  const [votedCards, setVotedCards] = useState<VoteCardUI[]>([]);

  useEffect(() => {
    (async () => {
      // Get current userData
      const user = await getCurrentUser();
      
      // Get filteredCards from session storage
      if (typeof window !== 'undefined') {
        const storedCards = sessionStorage.getItem('filteredCards');
        if (storedCards) setFilteredCards(JSON.parse(storedCards));
      }

      // Get votes data for the current user
      if (user?.id) {
        const { data: votesData, error:votesError } = await supabase
          .from("votes")
          .select(`
            id,
            user_id,
            fight_card_id,
            vote_type,
            vote_for
          `).eq("user_id", user?.id) as unknown as {
              data: VoteCardUI[];
              error: Error 
          };

        if (!votesError && votesData) {
          setVotedCards(votesData);
        }
      }
    })();
  }, []);

  // For haandling popularity vote
  const handlePopularityVote = async(cardId: number) => {
    const user = await getCurrentUser();
    if (!user?.id)  {
      alert("ログインしてください");
      return;
    }

    // Get popularity vote data from userID
    const { data: existingVoteData, error: fetchError } = await supabase
      .from("votes")
      .select("id")
      .eq("user_id", user.id)
      .eq("fight_card_id", cardId)
      .eq("vote_type", "popularity")
      .maybeSingle();
    
    if (fetchError) {
      console.error("投票チェックに失敗", fetchError);
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
        console.error("投票削除に失敗", deleteError);
      } else {
        setFilteredCards(prev =>
          prev.map(c =>
            c.id === cardId
              ? { ...c, popularity_votes: Math.max((c.popularity_votes ?? 1) - 1, 0) }
              : c
          )
        );
        setVotedCards((prev) => prev.filter((v) => v.id !== existingVoteData.id));
        console.log("投票をキャンセルしました");
      }
    } else {
      // Insert popularity vote data from votes table
      const { data: voteData, error: insertError } = await supabase
      .from("votes")
      .insert({
        user_id:  user.id,
        fight_card_id: cardId,
        vote_type: "popularity",
      })
      .select()
      .single();

      if (insertError) {
        if (insertError.code === "23505") {
          console.warn("すでに投票済みです");
        } else {
          console.error("投票に失敗しました", insertError);
        }
      } else if (voteData) {
        setFilteredCards(prev =>
          prev.map(c =>
            c.id === cardId
              ? { ...c, popularity_votes: Math.max((c.popularity_votes ?? 1) + 1, 0) }
              : c
          )
        );
        setVotedCards((prev) => [...prev, voteData]);
        console.log("投票完了");
      }
    }
  };

  // For checking if you voted
  const isPopularityVoted = (cardId: number): boolean => {
    return votedCards.some(
      (v) => v.fight_card_id === cardId && v.vote_type === "popularity"
    );
  };

  return (
    <div className="space-y-4 mt-4 px-5">
      <Link href="/" className="text-gray-500 hover:text-blue-800">
        ← ランキングトップに戻る
      </Link>
      {filteredCards.length === 0 ? (
        <div className="flex justify-center items-center h-60">
          <p className="text-2xl text-gray-400">対戦カードがありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-4">
          {filteredCards.map((card, index) => {
            const popVoted = !!isPopularityVoted(card.id);
            return(
              <div
                key={card.id}
                className={`relative bg-white rounded-lg px-6 py-2 
                            shadow-[0_-2px_6px_rgba(255,0,0,0.4),0_2px_6px_rgba(255,0,0,0.4)] 
                            hover:shadow-[0_-4px_12px_rgba(255,0,0,0.8),0_4px_12px_rgba(255,0,0,0.8)]
                            ${getRankBorderColor(index + 1)}`}
              >
                <div
                  className={`absolute top-2 left-2 px-2 py-1 rounded text-sm font-bold ${getRankStyle(index + 1)}`}
                >
                  {index + 1}位
                </div>
                <div className="grid grid-cols-1">
                  <div className="flex space-x-4 mt-9">
                    <div className="text-xl font-semibold">
                      {card.fighter1?.name}
                    </div>
                    <span className="text-xl font-semibold">vs</span>
                    <div className="text-xl font-semibold">
                      {card.fighter2?.name}
                    </div>
                  </div>
                  <div className="flex-col space-x-4">
                    <div className="flex space-x-4 mt-3">
                      <span className="text-black bg-gray-100 rounded px-1 py-1">
                        {card.organization?.name}
                      </span>
                      <span className="text-black bg-gray-100 rounded px-1 py-1">
                        {card.weight_class?.name}
                      </span>
                    </div>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-1 cursor-pointer mt-3" onClick={() => handlePopularityVote(card.id)}>
                        <MdHowToVote size={24} />
                        <span className="text-sm text-gray-600">{card.popularity_votes}</span>
                      </div>
                      {popVoted && (
                        <div className="font-bold text-sm mt-5">
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
    </div>
  );
}
