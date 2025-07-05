'use client';

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import VoteGauge from "./VoteGauge";
import { MdHowToVote } from "react-icons/md";
import { supabase } from '@/utils/supabaseBrowserClient';
import { FightCardUI, VoteCardUI } from '@/types/types';
import { getCurrentUser, isLoggedIn } from '@/utils/supabaseFunction'

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
};

const FightCardList = ({ initialFightCards, initialVotedCards, organization, weight, keyword}: Props) => {
  const [fightCards, setFightCards] = useState<FightCardUI[]>(initialFightCards);
  const [filteredCards, setFilteredCards] = useState<FightCardUI[]>(initialFightCards);
  const [votedCards, setVotedCards] = useState<VoteCardUI[]>(initialVotedCards);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Get current userData
      const user = await getCurrentUser();
      if (user) setUserId(user.id);

      //Get fight cards data
      const { data: cardsData, error: cardsError } = await supabase
        .from("fight_cards")
        .select(`
          id,
          fighter1:fighters!fight_cards_fighter1_id_fkey ( id, name ),
          fighter2:fighters!fight_cards_fighter2_id_fkey ( id, name ),
          organization:organizations!fight_cards_organization_id_fkey ( id, name ),
          weight_class:weight_classes!fight_cards_weight_class_id_fkey ( id, name ),
          fighter1_votes,
          fighter2_votes,
          popularity_votes
        `)
        .order("popularity_votes", { ascending: false }) 

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

  // Filter fight cards
  useEffect(() => {
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

      return matchWeight && matchOrganization && matchKeyword;
    });
    
    setFilteredCards(filteredData);
  }, [fightCards, weight, organization, keyword]);

  // Persist filtered fightCards to sessionStorage
  useEffect(() => {
    // Check if it's running in the browser
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('filteredCards', JSON.stringify(filteredCards));
    }
  }, [filteredCards]);

  // Reorder fightCards based on popularity votes
  const sortedFilteredCards = useMemo(() => {
    return [...filteredCards].sort(
      (a, b) => (b.popularity_votes ?? 0) - (a.popularity_votes ?? 0)
    );
  }, [filteredCards]);

  const top3 = sortedFilteredCards.slice(0, 3);
  const others = sortedFilteredCards.slice(3, 10);

  // For checking if user has voted for popularity
  const handlePredictionVote = async(cardId: number, votedSide: 1 | 2) => {
    try {
      // Confirm login
      const session = await isLoggedIn();
      if (!session) {
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
          console.error("投票チェックに失敗", fetchError);
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
          console.error("投票削除に失敗", deleteError);
        } else {
          console.log("投票をキャンセルしました");
          setVotedCards((prev) => prev.filter((v) => v.id !== existingVoteData.id));
          setFightCards((prev) =>
            prev.map((c) =>
              c.id === cardId
                ? {
                    ...c,
                    fighter1_votes:
                      votedSide === 1 ? Math.max(c.fighter1_votes - 1, 0) : c.fighter1_votes,
                    fighter2_votes:
                      votedSide === 2 ? Math.max(c.fighter2_votes - 1, 0) : c.fighter2_votes,
                  }
                : c
            )
          );
        }
      } else {
        // Insert prediction vote data from votes table
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
            console.warn("すでに投票済みです");
          } else {
            console.error("投票に失敗しました", insertError);
          }
        } else if(voteData) {
          console.log("投票完了");
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
        alert(e.message)
      } else {
        alert('不明なエラーが発生しました')
      }
    }
  }

  // For haandling popularity vote
  const handlePopularityVote = async(cardId: number) => {
    try{
      // Confirm login
      const session = await isLoggedIn();
      if (!session) {
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
        console.error("投票チェックに失敗", fetchError);
        return;
      }

      // ── ここで「人気投票」の投票済み件数をカウント
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
          console.error("投票削除に失敗", deleteError);
        } else {
          console.log("投票をキャンセルしました");
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
            console.warn("すでに投票済みです");
          } else {
            console.error("投票に失敗しました", insertError);
          }
        } else if (voteData) {
          console.log("投票完了");
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
        alert(e.message)
      } else {
        alert('不明なエラーが発生しました')
      }
    }
  };

  // For calculating the winning percentage from the winning predictions
  const calcPercent = (left: number, right: number) => {
    const total = left + right;
    if (total === 0) return [0, 0];
    return [ Math.round((left / total) * 100), Math.round((right / total) * 100)];
  };

  // No cards that match your search criteria.
  if (filteredCards.length === 0) {
    return (
      <div className="m-10 text-center text-gray-600">
        検索条件に一致する対戦カードが見つかりませんでした。
      </div>
    );
  };

  // For checking which player you predicted to win
  const predictionVoteFor = (cardId: number): number | null => {
    if (!votedCards) return null;
    const vote = votedCards.find(
      (v) => v.fight_card_id === cardId && v.vote_type === "prediction"
    );
    return vote?.vote_for ?? null;
  };

  // For checking if you voted
  const isPopularityVoted = (cardId: number): boolean => {
    if (!votedCards) return false;
    return votedCards.some(
      (v) => v.fight_card_id === cardId && v.vote_type === "popularity"
    );
  };

  if (!fightCards) return <div>Loading...</div>;

  return (
    <div className="space-y-3 mt-8 px-5">
      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {top3.map((card, idx) => {
          const [leftPct, rightPct] = calcPercent(card.fighter1_votes, card.fighter2_votes);
          const votedPrediction = predictionVoteFor(card.id);
          const popVoted = !!isPopularityVoted(card.id);

          return (
            <div
              key={card.id}
              className={`relative bg-white px-6 py-5 h-[400px] overflow-hidden shadow-[0_-4px_10px_rgba(255,0,0,0.4),0_4px_10px_rgba(255,0,0,0.4)] 
                          hover:shadow-[0_-8px_20px_rgba(255,0,0,0.8),0_8px_20px_rgba(255,0,0,0.8)] 
                          ${getRankBorderColor(idx + 1)}`}
            >
              <div className={`absolute top-2 left-2 px-2 py-1 rounded text-sm font-bold ${getRankStyle(idx + 1)}`}>
                {idx + 1}位
              </div>
              <div className="h-[130px] flex mt-8 space-x-2 overflow-hidden">
                <button 
                  className={`w-full text-2xl font-semibold cursor-pointer px-4 py-2 rounded 
                  ${votedPrediction === 1 ? "border-2 border-red-300 bg-red-50" : "border border-transparent hover:border-red-300"}`} 
                  onClick={() => handlePredictionVote(card.id, 1)}
                >
                  {card.fighter1?.name}
                </button>
                <span className="text-2xl font-semibold flex items-center">vs</span>
                <button 
                  className={`w-full text-2xl font-semibold cursor-pointer px-4 py-2 rounded 
                  ${votedPrediction === 2 ? "border-2 border-blue-300 bg-blue-50" : "border border-transparent hover:border-blue-300"}`} 
                  onClick={() => handlePredictionVote(card.id, 2)}
                >
                  {card.fighter2?.name}
                </button>
              </div>
              <div className="flex mt-5 gap-2">
                <span className="bg-gray-100 rounded px-1 py-1 whitespace-nowrap">{card.organization?.name}</span>
                <span className="bg-gray-100 rounded px-1 py-1 whitespace-nowrap">{card.weight_class?.name}</span>
              </div>
              <div className="grid mt-6">
                <span>勝敗予想</span>
                <div className="flex justify-between mt-4 text-sm text-gray-700">
                  <span>{leftPct}%</span>
                  <span>{rightPct}%</span>
                </div>
                <VoteGauge leftVotes={card.fighter1_votes} rightVotes={card.fighter2_votes} />
              </div>
              <div className="flex items-center space-x-1 cursor-pointer mt-3" onClick={() => handlePopularityVote(card.id)}>
                <MdHowToVote size={24} />
                <span className="text-sm text-gray-600">{card.popularity_votes}</span>
              </div>
              {popVoted && (
                <div className="font-bold text-sm">
                  投票済み
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Under 4 */}
      <div className="space-y-6 mt-9">
        {others.map((card, idx) => {
          const [leftPct, rightPct] = calcPercent(card.fighter1_votes, card.fighter2_votes);
          const votedPrediction = predictionVoteFor(card.id);
          const popVoted = !!isPopularityVoted(card.id);
          
          return (
            <div
              key={card.id}
              className="relative rounded-lg flex flex-col px-10 pt-10 pb-5 md:px-0 md:py-0 md:grid md:grid-cols-12 md:grid-rows-12 
                          shadow-[0_-2px_6px_rgba(255,0,0,0.4),0_2px_6px_rgba(255,0,0,0.4)] 
                          hover:shadow-[0_-4px_12px_rgba(255,0,0,0.8),0_4px_12px_rgba(255,0,0,0.8)]"
            >
              <div className={`absolute top-2 left-2 px-2 py-1 rounded text-sm font-bold ${getRankStyle(idx + 4)}`}>
                {idx + 4}位
              </div>
              <div className="flex md:space-x-7 md:px-10 md:row-start-5 md:row-end-9 md:col-start-1 md:col-end-6">
                <button className={`text-xl font-semibold cursor-pointer rounded ${votedPrediction === 1 ? "border-2 border-red-300 bg-red-50 p-2" : "border border-transparent hover:border-red-300 p-2"}`} onClick={() => handlePredictionVote(card.id, 1)}>
                  {card.fighter1?.name}
                </button>
                <span className="flex text-xl font-semibold items-center">vs</span>
                <button className={`text-xl font-semibold cursor-pointer rounded ${votedPrediction === 2 ? "border-2 border-blue-300 bg-blue-50 p-2" : "border border-transparent hover:border-blue-300 p-2"}`} onClick={() => handlePredictionVote(card.id, 2)}>
                  {card.fighter2?.name}
                </button>
              </div>
              <div className="flex pt-4 md:pt-0 md:order-none md:row-start-9 md:row-end-12 md:col-start-1 md:col-end-6">
                <div className="flex items-center justify-between space-x-2 px-0 md:px-10">
                  <span className="bg-gray-100 rounded whitespace-nowrap p-1">{card.organization?.name}</span>
                  <span className="bg-gray-100 rounded whitespace-nowrap p-1">{card.weight_class?.name}</span>
                </div>
              </div>
              <div className="pt-3 md:pt-0 md:order-none md:row-start-5 md:row-end-10 md:col-start-6 md:col-end-12">
                <div className="flex text-xs justify-between text-gray-700">
                  <span>{leftPct}%</span>
                  <span>{rightPct}%</span>
                </div>
                <VoteGauge leftVotes={card.fighter1_votes} rightVotes={card.fighter2_votes} />
              </div>
              <div className="flex pt-3 md:pt-0  md:order-none md:row-start-10 md:row-end-12 md:col-start-6 md:col-end-12">
                <div className="flex space-x-2 cursor-pointer md:items-center md:justify-between" onClick={() => handlePopularityVote(card.id)}>
                  <MdHowToVote size={24} />
                  <span className="text-sm text-gray-600">{card.popularity_votes}</span>
                  {popVoted && (
                    <div className="text-sm font-bold whitespace-nowrap">
                      投票済み
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center mt-8">
        <Link href="/allrankings" className="inline-block px-4 py-2 text-gray-500 cursor-pointer hover:text-blue-800">
          10位以降のランキングを見る
        </Link>
      </div>
    </div>
  );
};

export default FightCardList;