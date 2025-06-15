'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseBrowserClient';

type Fighter = { id: string; name: string };
type Organization = { id: string; name: string };
type WeightClass = { id: string; name: string };

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

  const [organizationId, setOrganizationId] = useState('');
  const [weightClassId, setWeightClassId] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: fData } = await supabase.from('fighters').select('id, name');
      const { data: oData } = await supabase.from('organizations').select('id, name');
      const { data: wData } = await supabase.from('weight_classes').select('id, name');

      setFighters((fData || []).map(({ id, name }) => ({ id: String(id), name })));
      setOrganizations((oData || []).map(({ id, name }) => ({ id: String(id), name })));
      setWeightClasses((wData || []).map(({ id, name }) => ({ id: String(id), name })));

      setOrganizationId(String(oData?.[0]?.id || ''));
      setWeightClassId(String(wData?.[0]?.id || ''));
    };

    fetchData();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selected1 || !selected2) {
      setErrorMsg('選手1と選手2を選択してください');
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMsg('ログインしていません。ログインしてください。');
      return;
    }

    setErrorMsg('');

    const { error } = await supabase.from('fight_cards').insert({
      fighter1_id: Number(selected1.id),
      fighter2_id: Number(selected2.id),
      organization_id: Number(organizationId),
      weight_class_id: Number(weightClassId),
      created_by: user.id,
    });

    if (error) {
      console.error(error);
      setErrorMsg('カードの作成に失敗しました。');
    } else {
      alert('カードが作成されました');
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
          {/* 選手1 */}
          <div>
            <label className="text-sm font-medium text-gray-700">選手1</label>
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

          {/* 選手2 */}
          <div>
            <label className="text-sm font-medium text-gray-700">選手2</label>
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

          {/* 団体 */}
          <div>
            <label className="text-sm font-medium text-gray-700">団体</label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded shadow-sm"
            >
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* 階級 */}
          <div>
            <label className="text-sm font-medium text-gray-700">階級</label>
            <select
              value={weightClassId}
              onChange={(e) => setWeightClassId(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded shadow-sm"
            >
              {weightClasses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* プレビュー */}
          {selected1 && selected2 && (
            <div className="p-2 max-w-xs break-words rounded flex mt-8 space-x-2 overflow-hidden bg-gradient-to-r via-10% from-red-500 via-red-500 to-blue-500">
              <p className="w-full text-2xl font-semibold text-center">{selected1.name}</p>
              <span className="flex text-2xl font-semibold items-center">vs</span>
              <p className="w-full text-2xl font-semibold text-center">{selected2.name}</p>
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