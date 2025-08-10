'use client'
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import VoteGauge from "./VoteGauge";
import { MdHowToVote } from "react-icons/md";
import { supabase } from '@/utils/supabaseBrowserClient';
import { FightCardUI, VoteCardUI } from '@/types/types';
import { getCurrentUser, isLoggedIn, fetchFightCards, fetchVotesForCurrentUser } from '@/utils/supabaseUtils';
import { insertLineBreak, isSmallFont, noBreakDots } from '@/utils/textUtils';

// For returning background style according to rank
const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1: return "bg-glossy-gold text-white";
    case 2: return "bg-glossy-silver text-white";
    case 3: return "bg-glossy-bronze text-white";
    default: return "bg-red-500 text-white";
  }
};

/// For returning the border style according to the rank
const getRankBorderColor = (rank: number) => {
  switch (rank) {
    case 1: return "gold-border";
    case 2: return "silver-border";
    case 3: return "bronze-border";
    default: return "";
  }
};

type Props = {
  initialFightCards: FightCardUI[];
  initialVotedCards: VoteCardUI[];
  organization: string;
  weight: string;
  keyword: string;
  gender: "male" | "female";
};

const FightCardList = ({ initialFightCards, initialVotedCards, gender, weight, organization, keyword}: Props) => {
  const [fightCards, setFightCards] = useState<FightCardUI[]>(initialFightCards);
  const [filteredCards, setFilteredCards] = useState<FightCardUI[]>(initialFightCards);
  const [votedCards, setVotedCards] = useState<VoteCardUI[]>(initialVotedCards);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Get current userData
      const user = await getCurrentUser();
      if (user) setUserId(user.id);

      // Fetch fight cards
      const { cardsData, cardsError } = await fetchFightCards()
      if (!cardsError && cardsData) {
        const cards: FightCardUI[] = cardsData.map((v) => ({
          id: v.id,
          fighter1: Array.isArray(v.fighter1) ? v.fighter1[0] ?? null : (v.fighter1 ?? null),
          fighter2: Array.isArray(v.fighter2) ? v.fighter2[0] ?? null : (v.fighter2 ?? null),
          organization: Array.isArray(v.organization) ? v.organization[0] ?? null : (v.organization ?? null),
          weight_class: Array.isArray(v.weight_class) ? v.weight_class[0] ?? null : (v.weight_class ?? null),
          fighter1_votes: v.fighter1_votes ?? 0,
          fighter2_votes: v.fighter2_votes ?? 0,
          popularity_votes: v.popularity_votes ?? 0,
        }));
        setFightCards(cards);
      } else {
        console.error("Failed to fetch fight cards", cardsError);
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
          console.error("Failed to fetch vote data", votesError)
        }
      }
    })();
  }, []);

  // Filter fight cards
  useMemo(() => {
    const filteredData = fightCards.filter((card) => {
      // By weight
      const matchWeight =
        weight === "指定なし" || card.weight_class?.name === weight;
      // By organization
      const matchOrganization =
        organization === "指定なし" || card.organization?.name === organization;
      // By keyword
      const matchKeyword =
        card.fighter1?.name.toLowerCase().includes(keyword.toLowerCase()) ||
        card.fighter2?.name.toLowerCase().includes(keyword.toLowerCase());
      // By gender
      const matchGender =
        card.fighter1?.gender === gender && card.fighter2?.gender === gender;

      return matchWeight && matchOrganization && matchKeyword && matchGender;
    });
    
    setFilteredCards(filteredData);
  }, [fightCards, weight, organization, keyword, gender]);

  // Persist filtered fightCards to sessionStorage
  useEffect(() => {
    // Check if it's running in the browser
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('filteredCards', JSON.stringify(filteredCards));
    }
  }, [filteredCards]);

  /// For reordering fightCards based on popularity votes
  const sortedFilteredCards = useMemo(() => {
    return [...filteredCards].sort(
      (card1, card2) => (card2.popularity_votes ?? 0) - (card1.popularity_votes ?? 0)
    );
  }, [filteredCards]);
  const top3 = sortedFilteredCards.slice(0, 3);
  const others = sortedFilteredCards.slice(3, 10);

  // For handling prediction vote
  const handlePredictionVote = async(cardId: number, votedSide: 1 | 2) => {
    try {
      // Confirm login
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        alert('ログインしてください')
        return
      };

      // Get prediction vote data from userID
      const { data: existingVoteData, error: fetchError } = await supabase
        .from("votes")
        .select("id")
        .eq("user_id", userId)
        .eq("fight_card_id", cardId)
        .eq("vote_type", "prediction")
        .maybeSingle();

      if (fetchError) {
        console.error("Failed to fetch vote data", fetchError);
        return;
      }

      // Check if you've already voted
      if (existingVoteData) {
        // Delete prediction vote data from votes table
        const { error: deleteError } = await supabase
          .from("votes")
          .delete()
          .eq("id", existingVoteData.id);

        if (deleteError) {
          console.error("Failed to delete vote : ", deleteError);
        } else {
          // Remove the vote from votedCards state
          setVotedCards((prev) => 
            prev.filter((v) => 
              v.id !== existingVoteData.id
            )
          );
          // Update the vote counts in fightCards
          const deletedSide = votedCards.find(v => v.id === existingVoteData.id);
          setFightCards((prev) =>
            prev.map((c) =>
              c.id === cardId
                ? {
                    ...c,
                    fighter1_votes:
                      deletedSide?.vote_for === 1 ? Math.max(c.fighter1_votes - 1, 0) : c.fighter1_votes,
                    fighter2_votes:
                      deletedSide?.vote_for === 2 ? Math.max(c.fighter2_votes - 1, 0) : c.fighter2_votes,
                  }
                : c
            )
          );
        }
      } else {
        // Insert prediction vote data into votes table
        const { data: voteData, error: insertError } = await supabase
        .from("votes")
        .insert({
          user_id: userId,
          fight_card_id: cardId,
          vote_type: "prediction",
          vote_for: votedSide,
        })
        .select()
        .single();

        if (insertError) {
          if (insertError.code === "23505") {
            console.warn("already voted for this card");
          } else {
            console.error("Failed to insert vote data : ", insertError);
          }
        } else if(voteData) {
          // Add the new vote to the state
          setVotedCards((prev) => [...prev, voteData]);
          setFightCards((prev) =>
            prev.map((c) =>
              c.id === cardId
                ? {
                    ...c,
                    fighter1_votes:
                      votedSide === 1 ? c.fighter1_votes + 1 : c.fighter1_votes,
                    fighter2_votes:
                      votedSide === 2 ? c.fighter2_votes + 1 : c.fighter2_votes,
                  }
                : c
            )
          );
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(e.message)
      } else {
        console.error('Unexpected error during prediction vote : ', e)
      }
    }
  }

  // For haandling popularity vote
  const handlePopularityVote = async(cardId: number) => {
    try{
      // Confirm login
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        alert('ログインしてください')
        return
      };

      // Get popularity vote data from userID
      const { data: existingVoteData, error: fetchError } = await supabase
        .from("votes")
        .select("id")
        .eq("user_id", userId)
        .eq("fight_card_id", cardId)
        .eq("vote_type", "popularity")
        .maybeSingle();
      
      if (fetchError) {
        console.error("Failed to fetch vote data : ", fetchError);
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
          setFightCards((prev) =>
            prev.map((c) =>
              c.id === cardId
                ? {
                    ...c,
                    popularity_votes: Math.max((c.popularity_votes ?? 1) - 1, 0),
                  }
                : c
            )
          );
        }
      } else {
        // Insert popularity vote data from votes table
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
            console.error("Failed to insert vote data : ", insertError);
          }
        } else if (voteData) {
          // Add the new vote to the state
          setVotedCards((prev) => [...prev, voteData]);
          setFightCards((prev) =>
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
        console.error(e.message)
      } else {
        console.error('Unexpected error during popularity vote : ', e)
      }
    }
  };

  // For calculating the winning percentage from votes
  const calcPercent = (left: number, right: number) => {
    const total = left + right;
    if (total === 0) return [0, 0];
    return [ Math.round((left / total) * 100), Math.round((right / total) * 100)];
  };

  // For returning witch side you voted for from 
  const predictionVoteFor = (cardId: number): number | null => {
    if (!votedCards) return null;
    const vote = votedCards.find( (v) => v.fight_card_id === cardId && v.vote_type === "prediction" );
    return vote?.vote_for ?? null;
  };

  // For returning whether you voted for popularity vote
  const isPopularityVoted = (cardId: number): boolean => {
    if (!votedCards) return false;
    return votedCards.some( (v) => v.fight_card_id === cardId && v.vote_type === "popularity" );
  };

  // No cards that match your search criteria.
  if (filteredCards.length === 0) {
    return (
      <div className="my-8 text-center text-gray-500">
        検索条件に一致する対戦カードが見つかりませんでした。
      </div>
    );
  };

  if (!fightCards) return <div>読み込み中...</div>;

  return (
    <div className="px-5 mt-10">
      {/* Top 3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {top3.map((card, idx) => {
          const [leftPct, rightPct] = calcPercent(card.fighter1_votes, card.fighter2_votes);
          const votedPrediction = predictionVoteFor(card.id);
          const popVoted = !!isPopularityVoted(card.id);

          return (
            <div
              key={card.id}
              className={`relative bg-white px-6 py-5 h-[400px] 
                          shadow-[0_-4px_10px_rgba(255,0,0,0.4),0_4px_10px_rgba(255,0,0,0.4)] 
                          hover:shadow-[0_-8px_20px_rgba(255,0,0,0.8),0_8px_20px_rgba(255,0,0,0.8)] 
                          ${getRankBorderColor(idx + 1)}`}
            >
              <div className={`absolute top-2 left-2 text-sm font-bold px-2 py-1 rounded ${getRankStyle(idx + 1)}`}>
                {idx + 1}位
              </div>
              <div className="flex gap-x-2 mt-8 h-[130px]">
                <button 
                  className={`flex-1 font-semibold whitespace-pre-line break-keep overflow-hidden rounded px-2 py-1 min-w-[100px] h-full cursor-pointer
                  ${isSmallFont(card.fighter1?.name) ? "text-xl" : "text-2xl"}
                  ${votedPrediction === 1 ? "border-2 border-red-300 bg-red-50" : "border border-transparent hover:border-red-300"}`} 
                  onClick={() => handlePredictionVote(card.id, 1)}
                >
                  {noBreakDots(insertLineBreak(card.fighter1?.name, 6))}
                </button>
                <span className="flex items-center text-2xl font-semibold">vs</span>
                <button 
                  className={`flex-1 font-semibold whitespace-pre-line break-keep overflow-hidden rounded px-2 py-1 h-full min-w-[100px] cursor-pointer
                  ${isSmallFont(card.fighter2?.name) ? "text-xl" : "text-2xl"}
                  ${votedPrediction === 2 ? "bg-blue-50 border-2 border-blue-300" : "border border-transparent hover:border-blue-300"}`} 
                  onClick={() => handlePredictionVote(card.id, 2)}
                >
                  {noBreakDots(insertLineBreak(card.fighter2?.name, 6))}
                </button>
              </div>
              <div className="flex gap-x-3 mt-4">
                <span className="bg-gray-100 rounded px-1 py-1">{card.organization?.name}</span>
                <span className="bg-gray-100 rounded px-1 py-1">{card.weight_class?.name}</span>
              </div>
              <div className="grid px-1 py-3 mt-5">
                <span className="text-center">勝敗予想</span>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>{leftPct}%</span>
                  <span>{rightPct}%</span>
                </div>
                <VoteGauge leftVotes={card.fighter1_votes} rightVotes={card.fighter2_votes} />
              </div>
              <div className="flex gap-x-1 items-center mt-3 cursor-pointer" onClick={() => handlePopularityVote(card.id)}>
                <MdHowToVote size={24} />
                <span className="text-sm text-gray-600">{card.popularity_votes}</span>
              </div>
              {popVoted && (
                <div className="text-sm font-bold">
                  投票済み
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Under 4 */}
      <div className="flex flex-col gap-y-6 mt-15">
        {others.map((card, idx) => {
          const [leftPct, rightPct] = calcPercent(card.fighter1_votes, card.fighter2_votes);
          const votedPrediction = predictionVoteFor(card.id);
          const popVoted = !!isPopularityVoted(card.id);
          
          return (
            <div
              key={card.id}
              className="relative grid lg:grid-cols-12 lg:grid-rows-12 rounded-lg px-8 lg:px-0 pt-10 pb-5 lg:py-0 h-auto
                          shadow-[0_-2px_6px_rgba(255,0,0,0.4),0_2px_6px_rgba(255,0,0,0.4)] 
                          hover:shadow-[0_-4px_12px_rgba(255,0,0,0.8),0_4px_12px_rgba(255,0,0,0.8)]"
            >
              <div className={`absolute top-2 left-2 text-sm font-bold rounded px-2 py-1 ${getRankStyle(idx + 4)}`}>
                {idx + 4}位
              </div>
              <div className="flex items-center gap-x-2 lg:gap-x-6 lg:row-start-2 lg:row-end-10 lg:col-start-1 lg:col-end-6 lg:pl-14 lg:pr-5 h-[120px] lg:h-[130px]">
                <button 
                  className={`flex-1 font-semibold whitespace-pre-line break-keep overflow-hidden rounded px-3 py-1 min-w-[110px] h-full cursor-pointer
                  ${isSmallFont(card.fighter1?.name) ? "text-lg" : "text-xl"}
                  ${votedPrediction === 1 ? "border-2 border-red-300 bg-red-50" : "border border-transparent hover:border-red-300"}`} 
                  onClick={() => handlePredictionVote(card.id, 1)}
                >
                  {noBreakDots(insertLineBreak(card.fighter1?.name, 7))}
                </button>
                <span className="text-xl font-semibold">vs</span>
                <button
                  className={`flex-1 font-semibold whitespace-pre-line break-keep overflow-hidden rounded px-3 py-1 min-w-[100px] h-full cursor-pointer
                  ${isSmallFont(card.fighter2?.name) ? "text-lg" : "text-xl"}
                  ${votedPrediction === 2 ? "bg-blue-50 border-2 border-blue-300" : "border border-transparent hover:border-blue-300"}`} 
                  onClick={() => handlePredictionVote(card.id, 2)}
                >
                  {noBreakDots(insertLineBreak(card.fighter2?.name, 7))}
                </button>
              </div>
              <div className="flex lg:row-start-9 lg:row-end-12 lg:col-start-1 lg:col-end-6 mt-4 lg:mt-4.5">
                <div className="flex gap-x-2 items-center justify-between px-0 lg:px-10">
                  <span className="bg-gray-100 rounded p-1">{card.organization?.name}</span>
                  <span className="bg-gray-100 rounded p-1">{card.weight_class?.name}</span>
                </div>
              </div>
              <div className="lg:row-start-5 lg:row-end-10 lg:col-start-6 lg:col-end-12">
                <div className="flex text-xs justify-between text-gray-700">
                  <span>{leftPct}%</span>
                  <span>{rightPct}%</span>
                </div>
                <VoteGauge leftVotes={card.fighter1_votes} rightVotes={card.fighter2_votes} />
              </div>
              <div className="flex lg:row-start-10 lg:row-end-12 lg:col-start-6 lg:col-end-12 pt-3 lg:pt-0">
                <div className="flex gap-x-2 lg:items-center lg:justify-between cursor-pointer" onClick={() => handlePopularityVote(card.id)}>
                  <MdHowToVote size={24} />
                  <span className="text-sm text-gray-600">{card.popularity_votes}</span>
                  {popVoted && (
                    <div className="text-sm font-bold">
                      投票済み
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      { 10 < filteredCards.length && (
        <div className="text-center mt-8 mb-3">
          <Link href="/allrankings" className="text-gray-500 hover:text-blue-800 cursor-pointer">
            10位以降のランキングを見る
          </Link>
        </div>
      )}
    </div>
  );
};

export default FightCardList;