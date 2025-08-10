'use client'
import React, { useState } from 'react';
import GenderTab from '@/components/GenderTab';
import WeightSelect from '@/components/WeightSelect';
import OrganizationSelect from '@/components/OrganizationSelect';
import Search from '@/components/Search';
import FightCardList from '@/components/FightCardList';
import { FightCardUI, VoteCardUI } from '@/types/types';


export default function HomeClient({ initialFightCards, initialVotedCards }: { initialFightCards: FightCardUI[], initialVotedCards: VoteCardUI[];}) {
  const [weight, setWeight] = useState("指定なし");
  const [organization, setOrganization] = useState("指定なし");
  const [keyword, setKeyword] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");

  return (
    <>
      <GenderTab value={gender} onChange={setGender} />
      <div className="shadow-md border border-gray-100 rounded p-4">
        <div className="flex gap-x-3 md:grid md:grid-cols-12 md:gap-4">
          <WeightSelect value={weight} gender={gender} onChange={setWeight} />
          <OrganizationSelect value={organization} onChange={setOrganization} />
          <Search value={keyword} onChange={setKeyword} />
        </div>
        <FightCardList initialFightCards={initialFightCards} initialVotedCards={initialVotedCards} gender={gender} weight={weight} organization={organization} keyword={keyword}/>
      </div>
    </>
  );
}
