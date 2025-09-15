'use client'
import React, { useState } from 'react';
import GenderTab from '@/components/GenderTab';
import WeightSelect from '@/components/WeightSelect';
import OrganizationSelect from '@/components/OrganizationSelect';
import InfoTooltip from '@/components/InfoTooltip';
import Search from '@/components/Search';
import FightCardList from '@/app/FightCardList';
import { FightCardUI, VoteCardUI } from '@/types/types';


export default function HomeClient({ initialFightCards, initialVotedCards }: { initialFightCards: FightCardUI[], initialVotedCards: VoteCardUI[];}) {
  const [weight, setWeight] = useState('指定なし');
  const [organization, setOrganization] = useState('指定なし');
  const [keyword, setKeyword] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  return (
    <>
      <div className="grid grid-rows-2 grid-cols-2 sm:grid-rows-1 sm:grid-cols-14 gap-x-2 gap-y-2 bg-gray-40 rounded-md p-2 border border-gray-100 mb-2">
        <WeightSelect value={weight} gender={gender} onChange={setWeight} />
        <OrganizationSelect value={organization} onChange={setOrganization} />
        <Search value={keyword} onChange={setKeyword} />
      </div>
      <div className="flex items-center gap-x-3">
        <GenderTab value={gender} onChange={setGender} />
        <InfoTooltip
          id="top4-page-help"
          content={
            <div className="whitespace-pre-line">
              ＊選手名を選択することで、あなたの勝敗<br />　予想が反映され、％が変動します<br />
              ＊投票アイコンを押すことで、あなたの投票<br />　が反映され、ランキングが変動します<br />
              ＊投票した対戦カードは、マイページから<br />　確認できます<br />
            </div>
          }
        />
      </div>
      <div className="shadow-md border border-gray-100 rounded sm:p-4 p-2">
        <FightCardList initialFightCards={initialFightCards} initialVotedCards={initialVotedCards} gender={gender} weight={weight} organization={organization} keyword={keyword}/>
      </div>
    </>
  );
}
