'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseBrowserClient';
import { getCurrentUser, isLoggedIn } from '@/utils/supabaseFunction';
import { FightCardUI } from '@/types/types';

type Fighter = { id: number; name: string };
type Organization = { id: number; name: string };
type WeightClass = { id: number; name: string };

export default function CreateCardPage() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([]);

  const [input1, setInput1] = useState('');
  const [filtered1, setFiltered1] = useState<Fighter[]>([]);
  const [selected1, setSelected1] = useState<Fighter | null>(null);
  const [open1, setOpen1] = useState(false);

  const [input2, setInput2] = useState('');
  const [filtered2, setFiltered2] = useState<Fighter[]>([]);
  const [selected2, setSelected2] = useState<Fighter | null>(null);
  const [open2, setOpen2] = useState(false);

  const [organizationId, setOrganizationId] = useState(0);
  const [weightClassId, setWeightClassId] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');
  const [fightCards, setFightCards] = useState<FightCardUI[]>([]);

  useEffect(() => {
    (async () => {
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

      const { data: fData } = await supabase.from('fighters').select('id, name');
      const { data: oData } = await supabase.from('organizations').select('id, name');
      const { data: wData } = await supabase.from('weight_classes').select('id, name');

      const fightersList = (fData || []).map(({ id, name }) => ({ id, name }));
      const organizationsList = (oData || []).map(({ id, name }) => ({ id, name }));
      const weightClassesList = (wData || []).map(({ id, name }) => ({ id, name }));
      
      setFighters(fightersList);
      setOrganizations(organizationsList);
      setWeightClasses(weightClassesList);

      setOrganizationId(oData?.[0]?.id);
      setWeightClassId(wData?.[0]?.id);
    })();
  }, []);

  const handleChange = (
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    setFiltered: React.Dispatch<React.SetStateAction<Fighter[]>>,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setInput(input);
    if (input === '') {
      setFiltered([]);
      setOpen(true);
      return;
    }
    const filtered = fighters.filter((f) => f.name.includes(input));
    setFiltered(filtered);
    setOpen(true);
  };

  // 
  const handleSubmit = async (e: React.FormEvent) => {
    try{
      e.preventDefault();

      // Confirm login
      const session = await isLoggedIn();
      if (!session) {
        alert('ログインしてください')
        return
      };

      if (!selected1 && !selected2) {
        setErrorMsg('選手1と選手2を選択してください');
        return;
      } else if (!selected1){
        setErrorMsg('選手1を選択してください');
        return;
      } else if (!selected2){
        setErrorMsg('選手2を選択してください');
        return;
      }

      if (!organizationId) {
        setErrorMsg('団体を選択してください');
        return;
      }

      if (!weightClassId) {
        setErrorMsg('階級を選択してください');
        return;
      }

      if(selected1?.name === selected2?.name){
        setErrorMsg('同じ選手名を選択しています');
        return;
      }

      const isDuplicate = fightCards.some((v) =>
        (v.fighter1?.name === selected1?.name || v.fighter2?.name === selected1?.name)&&
        (v.fighter1?.name === selected2?.name || v.fighter2?.name === selected2?.name) &&
        v.organization?.id === organizationId &&
        v.weight_class?.id === weightClassId
      );

      if (isDuplicate) {
        setErrorMsg('選手・団体・階級が同じ対戦カードがすでに存在します');
        return;
      }

      setErrorMsg('');

      const user = await getCurrentUser()
      
      const { error } = await supabase
      .from('fight_cards')
      .insert({
        fighter1_id: Number(selected1?.id),
        fighter2_id: Number(selected2?.id),
        organization_id: Number(organizationId),
        weight_class_id: Number(weightClassId),
        created_by: user?.id,
      });

      if (error) {
        console.error('Error:', JSON.stringify(error, null, 2));
        setErrorMsg('対戦カードの作成に失敗しました。');
      } else {
        alert('対戦カードが作成されました');
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(e.message)
      } else {
        console.error('不明なエラーが発生しました')
      }
    }
  };

  return (
    <div className="flex justify-center items-start">
      <div className="mt-10 p-8 rounded border border-gray-300 space-y-4">
        <h1 className="text-3xl font-bold">対戦カード作成</h1>
        <p className="text-gray-600">
          あなたが見たい対戦カードを提案しましょう。作成したカードはランキングに表示されます。
        </p>

        {errorMsg && (
          <div className="p-2 text-red-600 border border-red-300 rounded bg-red-50">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* fighter1 */}
          <div>
            <label className="font-medium text-gray-700">選手1</label>
            <input
              value={input1}
              onChange={(e) =>
                handleChange(e.target.value, setInput1, setFiltered1, setOpen1)
              }
              placeholder="選手名を入力"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            {open1 && filtered1.length > 0 && (
              <ul className="z-10 bg-white border border-gray-300 w-full mt-1 rounded shadow">
                {filtered1.map((f) => (
                  <li
                    key={f.id}
                    onClick={() => {
                      setSelected1(f);
                      setInput1(f.name);
                      setOpen1(false);
                    }}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
            {open1 && input1 && filtered1.length === 0 && (
              <div className="z-10 bg-white border border-gray-300 w-full mt-1 rounded px-3 py-2 text-gray-500">
                該当なし
              </div>
            )}
          </div>

          {/* fighter2 */}
          <div>
            <label className="font-medium text-gray-700">選手2</label>
            <input
              value={input2}
              onChange={(e) =>
                handleChange(e.target.value, setInput2, setFiltered2, setOpen2)
              }
              placeholder="選手名を入力"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            {open2 && filtered2.length > 0 && (
              <ul className="z-10 bg-white border border-gray-300 w-full mt-1 rounded shadow">
                {filtered2.map((f) => (
                  <li
                    key={f.id}
                    onClick={() => {
                      setSelected2(f);
                      setInput2(f.name);
                      setOpen2(false);
                    }}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
            {open2 && input2 && filtered2.length === 0 && (
              <div className="z-10 bg-white border border-gray-300 w-full mt-1 rounded px-3 py-2 text-gray-500">
                該当なし
              </div>
            )}
          </div>

          {/* organization */}
          <div>
            <label className="font-medium text-gray-700">団体</label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(Number(e.target.value))}
              className="px-3 py-2 block w-full border-gray-300 rounded shadow-sm"
            >
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* weight */}
          <div>
            <label className="font-medium text-gray-700">階級</label>
            <select
              value={weightClassId}
              onChange={(e) => setWeightClassId(Number(e.target.value))}
              className="px-3 py-2 block w-full border-gray-300 rounded shadow-sm"
            >
              {weightClasses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* preview */}
          {selected1 && selected2 && (
            <div className="items-center justify-center p-4 max-w-xl break-words rounded-md shadow-2xl flex mt-8 mx-30 space-x-2 overflow-hidden bg-gradient-to-r via-10% from-red-500 via-red-500 to-blue-500">
              <p className="w-full text-3xl font-semibold text-center">{selected1.name}</p>
              <span className="flex text-2xl font-semibold items-center">vs</span>
              <p className="w-full text-3xl font-semibold text-center">{selected2.name}</p>
            </div>
          )}

          <button
            type="submit"
            className="mt-5 px-6 text-lg font-bold rounded-lg shadow hover:bg-red-200 bg-red-500 text-white"
          >
            作成
          </button>
        </form>
      </div>
    </div>
  );
}