'use client'
import React, { useEffect, useState, useMemo} from 'react';
import { 
  getCurrentUser, 
  isLoggedIn, 
  fetchFightCards, 
  fetchFighters, 
  fetchOrganizations, 
  fetchWeightClasses,
  insertFightCard,
  countTodayFightCard
} from '@/utils/supabaseBrowserUtils';
import { FightCardUI, Fighter, Organization, WeightClass} from '@/types/types';
import toast from 'react-hot-toast';
import { isSmallFont, insertLineBreak, noBreakDots } from '@/utils/textUtils';


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

  const [organizationId, setOrganization] = useState(0);
  const [weightClassId, setWeightClass] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');
  const [fightCards, setFightCards] = useState<FightCardUI[]>([]);

  useEffect(() => {
    (async () => {
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

      // Fetch fighters and set initial fighter list
      const { fData, fError } = await fetchFighters();
      if (!fError && fData){
        // Set fighters, organizations
        const fightersList = (fData || []).map(({ id, name, gender}) => ({ id, name, gender }));
        setFighters(fightersList);
      }

      // Fetch organizations and set initial organizaitons list
      const { oData, oError } = await fetchOrganizations();
      if (oError){
        console.error('Failed to fetch organizations : ', JSON.stringify(oError));
      } else {
        const organizationsList = (oData || []).map(({ id, name }) => ({ id, name }));
        setOrganizations(organizationsList);
      }

      // Fetch weight classses and set initial weight calsses list
      const { wData, wError } = await fetchWeightClasses();
      if (wError) {
        console.error('Failed to fetch weight classes : ', JSON.stringify(wError));
      } else {
        const weightClassesList = (wData || []).map(({ id, name, gender }) => ({ id, name, gender }));
        setWeightClasses(weightClassesList);
      }
    })();
  }, []);

  useEffect(() => {
    // Reset when there is no input
    if (input1 === '') {
      setSelected1(null);
      setFiltered1([]);
      setOpen1(false);
      return;
    }
    // If a fighter is already selected and the input no longer matches, unselect it
    if (selected1 && input1 !== selected1.name) {
      setSelected1(null);
    }
  }, [input1, selected1]);

  useEffect(() => {
    // Reset when there is no input
    if (input2 === '') {
      setSelected2(null);
      setFiltered2([]);
      setOpen2(false);
      return;
    }
    // If a fighter is already selected and the input no longer matches, unselect it
    if (selected2 && input2 !== selected2.name) {
      setSelected2(null);
    }
  }, [input2, selected2]);

  // Reset the organization and weight class when the fighter is not selected
  useEffect(() => {
    if (!selected1 || !selected2) {
      setOrganization(0);
      setWeightClass(0);
    }
  }, [selected1, selected2]);

  // Confirm fighters of the same gender are selected
  useEffect(() => {
    if (selected1 && selected2) {
      if (selected1.gender !== selected2.gender) {
        setErrorMsg('男女混合の対戦カードは作成できません');
        setOrganization(0);
        setWeightClass(0);
      } else {
        setErrorMsg('');
      }
    } else {
      setErrorMsg('');
    }
  }, [selected1, selected2]);

  // For filtering weight classes by gender
  const availableWeightClasses = useMemo(() => {
    if (selected1 && selected2 && selected1.gender === selected2.gender) {
      return weightClasses.filter((w) => w.gender === selected1.gender);
    }
    return [];
  }, [selected1, selected2, weightClasses]);

  // For handling fighter name input
  const handleChange = (
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    setFiltered: React.Dispatch<React.SetStateAction<Fighter[]>>,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setInput(input);
    // If input is empty, reset filtered fighters and open dropdown
    if (input === '') {
      setFiltered([]);
      setOpen(true);
      return;
    }
    // Filter fighters based on input
    const filtered = fighters.filter((f) => f.name.includes(input));
    setFiltered(filtered);
    setOpen(true);
  };

  // Handle submit form
  const handleSubmit = async (e: React.FormEvent) => {
    try{
      // Prevent the browser's default behavior (automatic page reload)
      e.preventDefault();

      // Confirm login
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        alert('ログインしてください');
        return;
      };

      // Check if user has not exceeded daily limit
      const user = await getCurrentUser();
      if(!user) return
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count, countError } = await countTodayFightCard(user?.id);
      if (countError) {
        console.error('Failed to fetch fight card count:', JSON.stringify(countError));
        setErrorMsg('対戦カードの作成に失敗しました。しばらくしてから再試行してください。');
        return;
      }
      if ((count ?? 0) >= 3) {
        setErrorMsg('1日の作成上限の３カードに達しました。');
        return;
      }

      // Check if input is valid
      if (!selected1 && !selected2) {
        setErrorMsg('選手1と選手2を選択してください');
        return;
      } 
      if (!selected1){
        setErrorMsg('選手1を選択してください');
        return;
      } 
      if (!selected2){
        setErrorMsg('選手2を選択してください');
        return;
      }
      if (!weightClassId) {
        setErrorMsg('階級を選択してください');
        return;
      }
      if (!organizationId) {
        setErrorMsg('団体を選択してください');
        return;
      }
      if(selected1?.name === selected2?.name){
        setErrorMsg('同じ選手名を選択しています');
        return;
      }
      if (selected1?.gender !== selected2?.gender) {
        setErrorMsg('男女混合の対戦カードは作成できません');
        return;
      }

      // Check for duplicate fight cards
      const isDuplicate = fightCards.some((v) =>
        (v.fighter1?.name === selected1?.name || v.fighter2?.name === selected1?.name)&&
        (v.fighter1?.name === selected2?.name || v.fighter2?.name === selected2?.name) &&
        v.organization?.id === organizationId &&
        v.weight_class?.id === weightClassId
      );
      if (isDuplicate) {
        setErrorMsg('選手・団体・階級の組み合わせが同じ対戦カードがすでに存在します');
        return;
      }
      
      // Insert new fight card
      const {insertData, insertCardError} = await insertFightCard(
        Number(selected1?.id), 
        Number(selected2?.id), 
        Number(organizationId), 
        Number(weightClassId), user?.id
      )

      if (insertCardError) {
        console.error('Failed to insert card data:', JSON.stringify(insertCardError));
        setErrorMsg('対戦カードの作成に失敗しました。しばらくしてから再試行してください。');
      } else if (insertData) {
        // Show success message
        toast.success('対戦カードが作成されました！', {
          position: 'top-center',
          duration: 3000,
        });
        // Update fight cards state
        const newCard: FightCardUI = {
          id: insertData[0].id,
          fighter1: Array.isArray(insertData[0].fighter1) ? insertData[0].fighter1[0] ?? null : (insertData[0].fighter1 ?? null),
          fighter2: Array.isArray(insertData[0].fighter2) ? insertData[0].fighter2[0] ?? null : (insertData[0].fighter2 ?? null),
          organization: Array.isArray(insertData[0].organization) ? insertData[0].organization[0] ?? null : (insertData[0].organization ?? null),
          weight_class: Array.isArray(insertData[0].weight_class) ? insertData[0].weight_class[0] ?? null : (insertData[0].weight_class ?? null),
          fighter1_votes: insertData[0].fighter1_votes ?? 0,
          fighter2_votes: insertData[0].fighter2_votes ?? 0,
          popularity_votes: insertData[0].popularity_votes ?? 0,
        };
        setFightCards(cards => [...cards, newCard]);
        setErrorMsg('');
      }
    } catch (e: unknown) {
      console.error('Unexpected error during creating card : ', e);
    }
  };

  return (
    <div className="container flex justify-center px-4 py-8">
      <div className="flex flex-col p-8 rounded border border-gray-300 gap-y-3 w-full max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-bold">対戦カード作成</h1>
        <p className="text-sm sm:text-base text-gray-600">
          あなたが見たい対戦カードを提案しましょう。作成したカードはランキングに表示され、ユーザーが投票/勝敗予想をできるようになります。
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-1 sm:gap-y-2">
          {/* fighter1 */}
          <label className="text-gray-700 font-medium mt-2">選手1</label>
          <input
            value={input1}
            onChange={(e) =>
              handleChange(e.target.value, setInput1, setFiltered1, setOpen1)
            }
            placeholder="選手名を入力"
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
          {open1 && filtered1.length > 0 && (
            <ul className="z-10 bg-white rounded shadow border border-gray-300 mt-1 w-full">
              {filtered1.map((f) => (
                <li
                  key={f.id}
                  onClick={() => {
                    setSelected1(f);
                    setInput1(f.name);
                    setOpen1(false);
                  }}
                  className="hover:bg-gray-100 px-3 py-2 cursor-pointer"
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

          {/* fighter2 */}
          <label className="font-medium text-gray-700 mt-2">選手2</label>
          <input
            value={input2}
            onChange={(e) =>
              handleChange(e.target.value, setInput2, setFiltered2, setOpen2)
            }
            placeholder="選手名を入力"
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
          {open2 && filtered2.length > 0 && (
            <ul className="z-10 bg-white rounded shadow border border-gray-300 mt-1 w-full">
              {filtered2.map((f) => (
                <li
                  key={f.id}
                  onClick={() => {
                    setSelected2(f);
                    setInput2(f.name);
                    setOpen2(false);
                  }}
                  className="hover:bg-gray-100 px-3 py-2 cursor-pointer"
                >
                  {f.name}
                </li>
              ))}
            </ul>
          )}
          {open2 && input2 && filtered2.length === 0 && (
            <div className="z-10 text-gray-500 bg-white rounded border border-gray-300 px-3 py-2 mt-1  w-full">
              該当なし
            </div>
          )}

          {/* weight */}
          <label className="text-gray-700 font-medium mt-2">階級</label>
          <select
            value={weightClassId}
            onChange={(e) => setWeightClass(Number(e.target.value))}
            className={`block border border-gray-300 rounded shadow-sm px-3 py-2 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
            ${weightClassId === 0 ? 'text-gray-400' : ''}`}
            disabled={!selected1 || !selected2 || (selected1 && selected2 && selected1.gender !== selected2.gender)}
          >
            <option value={0} disabled>
              {(!selected1 || !selected2) ? '選手を選択してください' : '階級を選択してください'}
            </option>
            {availableWeightClasses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {/* organization */}
          <label className="text-gray-700 font-medium mt-2">団体</label>
          <select
            value={organizationId}
            onChange={(e) => setOrganization(Number(e.target.value))}
            className={`block border border-gray-300 rounded shadow-sm px-3 py-2 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
            ${organizationId === 0 ? 'text-gray-400' : ''}`}
            disabled={!selected1 || !selected2 || (selected1 && selected2 && selected1.gender !== selected2.gender)}
          >
            <option value={0} disabled>
              {(!selected1 || !selected2) ? '選手を選択してください' : '団体を選択してください'}
            </option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          {errorMsg && (
            <div className="text-red-600 border border-red-300 bg-red-50 rounded p-2 mt-2">
              {errorMsg}
            </div>
          )}
          {/* preview */}
          {selected1 && selected2 && organizationId != 0 && weightClassId != 0 &&(
            <div className="flex items-center justify-center mt-7">
              <div
                className="flex flex-col gap-y-3 rounded
                          shadow-[0_-2px_6px_rgba(255,0,0,0.4),0_2px_6px_rgba(255,0,0,0.4)] 
                          hover:shadow-[0_-4px_12px_rgba(255,0,0,0.8),0_4px_12px_rgba(255,0,0,0.8)]"
              >
                <div className="flex items-center justify-center text-center gap-x-1 h-[100px] pt-2">
                  <div 
                    className={`flex-1 font-semibold whitespace-pre-line break-keep rounded pt-2 px-3 min-w-[130px]
                              ${isSmallFont(selected1.name) ? "text-base sm:text-lg" : "text-lg sm:text-xl"}`}
                  >
                    {noBreakDots(insertLineBreak(selected1.name, 7))}
                  </div>
                  <span className="text-xl sm:text-2xl font-semibold">vs</span>
                  <div 
                    className={`flex-1 font-semibold whitespace-pre-line break-keep rounded pt-2 px-3 min-w-[130px]
                              ${isSmallFont(selected2.name) ? "text-base sm:text-lg" : "text-lg sm:text-xl"}`}
                  >
                    {noBreakDots(insertLineBreak(selected2.name, 7))}
                  </div>
                </div> 
                <div className="flex gap-x-2 ml-3 mb-1">
                  <span className="text-black bg-gray-100 rounded px-1 py-1">
                    {organizations.find((org) => org.id === organizationId)?.name}
                  </span>
                  <span className="text-black bg-gray-100 rounded px-1 py-1">
                    {weightClasses.find((wc) => wc.id === weightClassId)?.name}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-center">
            <button
              type="submit"
              className="text-base sm:text-lg text-white font-bold rounded-lg shadow bg-red-600 hover:bg-red-700 transition duration-200 mt-5 px-6 py-2 cursor-pointer"
            >
              対戦カードの作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}