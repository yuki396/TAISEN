'use client';

import React, { useState } from 'react';
import WeightSelect from './WeightSelect';
import OrganizationSelect from './OrganizationSelect';
import Search from './Search';
import FightCardList from './FightCardList';
import { FightCardUI, VoteCardUI } from '@/types/types';


export default function FilterPanel({ initialFightCards, initialVotedCards }: { initialFightCards: FightCardUI[], initialVotedCards: VoteCardUI[];}) {
  const [weight, setWeight] = useState("指定なし");
  const [organization, setOrganization] = useState("指定なし");
  const [keyword, setKeyword] = useState("");

  return (
    <div className="shadow-md rounded p-4">
      <div className="grid grid-cols-12 gap-4">
        <WeightSelect value={weight} onChange={setWeight} />
        <OrganizationSelect value={organization} onChange={setOrganization} />
        <Search value={keyword} onChange={setKeyword} />
      </div>
      <FightCardList initialFightCards={initialFightCards} initialVotedCards={initialVotedCards} organization={organization} weight={weight} keyword={keyword}/>
    </div>
  );
}
