'use client'
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import VoteGauge from '@/components/VoteGauge';
import { MdHowToVote } from 'react-icons/md';
import { FightCardUI, VoteCardUI } from '@/types/types';
import { 
  getCurrentUser, 
  isLoggedIn, 
  fetchFightCards, 
  fetchVotesForCurrentUser,
  fetchVoteByCardId,
  deleteVote,
  insertPopVote,
  insertPreVote
} from '@/utils/supabaseBrowserUtils';
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
  gender: 'male' | 'female';
};

const FightCardList = ({ initialFightCards, initialVotedCards, gender, weight, organization, keyword}: Props) => {
  const [userId, setUserId] = useState<string | null>(null);

  const [fightCards, setFightCards] = useState<FightCardUI[]>(initialFightCards);
  const [filteredCards, setFilteredCards] = useState<FightCardUI[]>(initialFightCards);
  const [votedCards, setVotedCards] = useState<VoteCardUI[]>(initialVotedCards);

  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    (async () => {
      // Display Loading 
      setLoading(true);
      
      try {
        // Get current userData
        const user = await getCurrentUser();
        if (user) setUserId(user.id);

        // Fetch fight cards
        const { cardsData, cardsError } = await fetchFightCards();
        if (cardsError) {
          console.error('Failed to fetch fight cards', JSON.stringify(cardsError));
        } else {
          const cards: FightCardUI[] = (cardsData || []).map((v) => ({
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

        // Fetch votes for ther current user
        if (user?.id) {
          const { votesData, votesError } = await fetchVotesForCurrentUser(user.id);
          
          if (votesError) {
            console.error('Failed to fetch vote data', JSON.stringify(votesError));
          } else {
            const votes: VoteCardUI[] = (votesData || []).map((v) => ({
              id: v.id ?? 0,
              fight_card_id: v.fight_card_id ?? 0,
              vote_type: v.vote_type ?? null,
              vote_for: v.vote_for ?? null,
            }));
            setVotedCards(votes);
          }
        }
      } catch (e:unknown) {
        console.error('Unexpected error during getting initial fight cards : ', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter fight cards
  useMemo(() => {
    const filteredData = fightCards.filter((card) => {
      // By weight
      const matchWeight =
        weight === '指定なし' || card.weight_class?.name === weight;
      // By organization
      const matchOrganization =
        organization === '指定なし' || card.organization?.name === organization;
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
        alert('ログインしてください');
        return;
      };

      // Get prediction vote data from userID
      const { voteData, voteError } = await fetchVoteByCardId(userId, cardId, 'prediction')

      if (voteError) {
        console.error('Failed to fetch vote data', JSON.stringify(voteError));
        return;
      }

      // Check if you've already voted
      if (voteData) {
        // Delete prediction vote data from votes table
        const voteError = await deleteVote(voteData.id);

        if (voteError) {
          console.error('Failed to delete vote : ', JSON.stringify(voteError));
        } else {
          // Remove the vote from votedCards state
          setVotedCards((prev) => 
            prev.filter((v) => 
              v.id !== voteData.id
            )
          );
          // Update the vote counts in fightCards
          const deletedSide = votedCards.find(v => v.id === voteData.id);
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
        const { voteData, voteError } = await insertPreVote(userId, cardId, 'prediction', votedSide);

        if (voteError) {
          if (voteError.code === '23505') {
            console.warn('already voted for this card');
          } else {
            console.error('Failed to insert vote data : ', JSON.stringify(voteError));
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
      console.error('Unexpected error during prediction vote : ', e);
    }
  }

  // For haandling popularity vote
  const handlePopularityVote = async(cardId: number) => {
    try{
      // Confirm login
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        alert('ログインしてください');
        return;
      };

      // Get popularity vote data from userID
      const { voteData, voteError } = await fetchVoteByCardId(userId, cardId, 'popularity');
      
      if (voteError) {
        console.error('Failed to fetch vote data : ', JSON.stringify(voteError));
        return;
      }

      // Check the limit of the number of popular votes
      const popularityCount = votedCards.filter(v => v.vote_type === 'popularity').length;
      if (!voteData && popularityCount >= 30) {
        alert('人気投票は30件までです。');
        return;
      }
      // Check if you've already voted
      if (voteData) {
        // Delete popularity vote data from votes table
        const voteError = await deleteVote(voteData.id);

        if (voteError) {
          console.error('Failed to delete vote : ', JSON.stringify(voteError));
        } else {
          // Remove the vote from the state
          setVotedCards((prev) => prev.filter((v) => v.id !== voteData.id));
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
        const { voteData, voteError } = await insertPopVote(userId, cardId, 'popularity');

        if (voteError) {
          if (voteError.code === '23505') {
            console.warn('already voted for this card');
          } else {
            console.error('Failed to insert vote data : ', JSON.stringify(voteError));
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
      console.error('Unexpected error during popularity vote : ', e);
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
    const vote = votedCards.find( (v) => v.fight_card_id === cardId && v.vote_type === 'prediction' );
    return vote?.vote_for ?? null;
  };

  // For returning whether you voted for popularity vote
  const isPopularityVoted = (cardId: number): boolean => {
    if (!votedCards) return false;
    return votedCards.some( (v) => v.fight_card_id === cardId && v.vote_type === 'popularity' );
  };

  if (loading) {
    return(
      <div className="container flex justify-center mx-auto mt-10">
        <p className="text-gray-500 my-6">読み込み中...</p>
      </div>
    );
  }

  // No cards that match your search criteria.
  if (filteredCards.length === 0) {
    return (
      <div className="my-8 text-center text-gray-500">
        検索条件に一致する対戦カードが見つかりませんでした
      </div>
    );
  }

  return (
    <div className="mx-3 mt-10">
      {/* Top 3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-3">
        {top3.map((card, idx) => {
          const [leftPct, rightPct] = calcPercent(card.fighter1_votes, card.fighter2_votes);
          const votedPrediction = predictionVoteFor(card.id);
          const popVoted = !!isPopularityVoted(card.id);

          return (
            <div
              key={card.id}
              className={`relative px-1 py-2 sm:py-3 sm:h-[360px] px-2
                          shadow-[0_-4px_10px_rgba(255,0,0,0.4),0_4px_10px_rgba(255,0,0,0.4)] 
                          hover:shadow-[0_-8px_20px_rgba(255,0,0,0.8),0_8px_20px_rgba(255,0,0,0.8)] 
                          ${getRankBorderColor(idx + 1)}`}
            >
              <div className={`absolute top-2 left-2 text-sm font-bold px-2 py-1 rounded ${getRankStyle(idx + 1)}`}>
                {idx + 1}位
              </div>
              <div className="flex gap-x-3 lg:gap-x-1 mt-8 h-[130px]">
                <button 
                  className={`flex-1 font-semibold whitespace-pre-line break-keep rounded py-1 min-w-[90px] h-full cursor-pointer
                  ${isSmallFont(card.fighter1?.name) ? "sm:text-xl text-lg" : "sm:text-2xl text-xl"}
                  ${votedPrediction === 1 ? "bg-red-50 border-2 border-red-300" : "hover:border-red-300 border border-transparent"}`} 
                  onClick={() => handlePredictionVote(card.id, 1)}
                >
                  {noBreakDots(insertLineBreak(card.fighter1?.name, 6))}
                </button>
                <span className="flex items-center text-2xl font-semibold">vs</span>
                <button 
                  className={`flex-1 font-semibold whitespace-pre-line break-keep rounded py-1 min-w-[90px] h-full cursor-pointer
                  ${isSmallFont(card.fighter2?.name) ? "sm:text-xl text-lg" : "sm:text-2xl text-xl"}
                  ${votedPrediction === 2 ? "bg-blue-50 border-2 border-blue-300" : "hover:border-blue-300 border border-transparent"}`} 
                  onClick={() => handlePredictionVote(card.id, 2)}
                >
                  {noBreakDots(insertLineBreak(card.fighter2?.name, 6))}
                </button>
              </div>
              <div className="flex gap-x-3 mx-4 sm:mx-0 mt-2 sm:mt-4">
                <span className="text-black bg-gray-100 rounded px-1 py-1">{card.organization?.name}</span>
                <span className="text-black bg-gray-100 rounded px-1 py-1">{card.weight_class?.name}</span>
              </div>
              <div className="grid px-3 mx-2 sm:mx-0 py-3 sm:px-1 mt-1 sm:mt-2">
                <span className="text-center font-bold">勝敗予想</span>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>{leftPct}%</span>
                  <span>{rightPct}%</span>
                </div>
                <VoteGauge leftVotes={card.fighter1_votes} rightVotes={card.fighter2_votes} />
              </div>
              <div className="flex gap-x-1 items-center sm:mt-3 px-2 sm:px-0 cursor-pointer" onClick={() => handlePopularityVote(card.id)}>
                <MdHowToVote size={24} />
                <span className="text-sm text-gray-600 font-bold">{card.popularity_votes}</span>
                {popVoted && (
                  <div className="text-sm font-bold px-2 sm:px-0">
                    投票済み
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Under 4 */}
      <div className="flex flex-col gap-y-6 mt-10 sm:mt-15">
        {others.map((card, idx) => {
          const [leftPct, rightPct] = calcPercent(card.fighter1_votes, card.fighter2_votes);
          const votedPrediction = predictionVoteFor(card.id);
          const popVoted = !!isPopularityVoted(card.id);
          
          return (
            <div
              key={card.id}
              className="relative grid lg:grid-cols-12 lg:grid-rows-12 rounded-lg pt-10 sm:pt-6 pb-2 sm:pb-0 px-2
                          shadow-[0_-2px_6px_rgba(255,0,0,0.4),0_2px_6px_rgba(255,0,0,0.4)] 
                          hover:shadow-[0_-4px_12px_rgba(255,0,0,0.8),0_4px_12px_rgba(255,0,0,0.8)]"
            >
              <div className={`absolute top-2 left-2 text-sm font-bold rounded px-2 py-1 ${getRankStyle(idx + 4)}`}>
                {idx + 4}位
              </div>
              <div className="flex items-center gap-x-3 lg:gap-x-2 lg:row-start-2 lg:row-end-10 lg:col-start-1 lg:col-end-6 lg:pl-6 lg:pr-6 h-[120px] lg:h-[130px]">
                <button 
                  className={`flex-1 font-semibold whitespace-pre-line break-keep overflow-hidden rounded sm:min-w-[130px] min-w-[90px] h-full cursor-pointer
                  ${isSmallFont(card.fighter1?.name) ? "sm:text-lg text-base" : "sm:text-xl text-lg"}
                  ${votedPrediction === 1 ? "bg-red-50 border-2 border-red-300 " : "hover:border-red-300 border border-transparent"}`} 
                  onClick={() => handlePredictionVote(card.id, 1)}
                >
                  {noBreakDots(insertLineBreak(card.fighter1?.name, 7))}
                </button>
                <span className="text-xl font-semibold">vs</span>
                <button
                  className={`flex-1 font-semibold whitespace-pre-line break-keep overflow-hidden rounded sm:min-w-[130px] min-w-[90px] h-full cursor-pointer
                  ${isSmallFont(card.fighter2?.name) ? "sm:text-lg text-base" : "sm:text-xl text-lg"}
                  ${votedPrediction === 2 ? "bg-blue-50 border-2 border-blue-300" : "hover:border-blue-300 border border-transparent"}`} 
                  onClick={() => handlePredictionVote(card.id, 2)}
                >
                  {noBreakDots(insertLineBreak(card.fighter2?.name, 7))}
                </button>
              </div>
              <div className="flex lg:row-start-9 lg:row-end-12 lg:col-start-1 lg:col-end-6 mx-4 sm:mx-0 mt-4 lg:mt-4.5">
                <div className="flex gap-x-2 items-center justify-between px-0 lg:px-10">
                  <span className="text-black bg-gray-100 rounded p-1">{card.organization?.name}</span>
                  <span className="text-black bg-gray-100 rounded p-1">{card.weight_class?.name}</span>
                </div>
              </div>
              <div className="lg:row-start-5 lg:row-end-10 lg:col-start-6 lg:col-end-12 mx-3 sm:mx-0 mt-2 sm:mt-0">
                <div className="flex text-xs justify-between text-gray-700">
                  <span>{leftPct}%</span>
                  <span>{rightPct}%</span>
                </div>
                <VoteGauge leftVotes={card.fighter1_votes} rightVotes={card.fighter2_votes} />
              </div>
              <div className="flex lg:row-start-10 lg:row-end-12 lg:col-start-6 lg:col-end-12 pt-3 lg:pt-0">
                <div className="flex gap-x-2 lg:items-center lg:justify-between cursor-pointer" onClick={() => handlePopularityVote(card.id)}>
                  <MdHowToVote size={24} />
                  <span className="text-sm text-gray-600 font-bold">{card.popularity_votes}</span>
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
          <Link href="/allrankings" className="text-gray-500 hover:text-blue-800">
            11位以降のランキングを見る
          </Link>
        </div>
      )}
    </div>
  );
};

export default FightCardList;