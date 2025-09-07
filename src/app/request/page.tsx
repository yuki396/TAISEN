'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getCurrentUser, 
  isLoggedIn, 
  fetchFighters, 
  insertFighterRequest, 
  countTodayFighterRequests 
} from '@/utils/supabaseBrowserUtils';
import { Fighter, RequestType, DeleteReason, FighterRequestForm } from '@/types/types';

export default function PlayerRequestPage() {
  const router = useRouter();

  const [fighters, setFighters] = useState<Fighter[]>([]);

  const [nameInput, setNameInput] = useState('');
  const [filtered, setFiltered] = useState<Fighter[]>([]);
  const [selected, setSelected] = useState<Fighter | null>(null);
  const [open, setOpen] = useState(false);

  const [requestType, setRequestType] = useState<RequestType>('add');
  const [deleteReason, setDeleteReason] = useState<DeleteReason>('retirement');

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {
      // fetch fighters
      const { fData, fError } = await fetchFighters();
      if (fError) {
        console.error('Failed to fetch fighters :', JSON.stringify(fError));
      } else  {
        setFighters(fData ?? []);
      }
    })();
  }, []);

  // reset form parts when switching request type
  useEffect(() => {
    setErrorMsg('');
    setNameInput('');
    setSelected(null);
    setFiltered([]);
    setOpen(false);
    setDeleteReason('retirement');
  }, [requestType]);

  // For handling fighter name input
  const handleChange = (val: string) => {
    setNameInput(val);
    // If input is empty, reset filtered fighters and open dropdown
    if (val === '') {
      setFiltered([]);
      setOpen(true);
      return;
    }
     // Filter fighters based on input
    const f = fighters.filter((ft) => ft.name.includes(val)).slice(0, 20);
    setFiltered(f);
    setOpen(true);
    // deselect if typed different name
    if (selected && selected.name !== val) setSelected(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // login check
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        alert('ログインしてください');
        return;
      }
      const user = await getCurrentUser();
      if (!user?.id) {
        setErrorMsg('ユーザー情報が取得できませんでした');
        return;
      }

      // Check if user has not exceeded daily limit
      const { count, countError } = await countTodayFighterRequests(user.id);
      if (countError) {
        console.error('Failed to fetch fighter request count:', JSON.stringify(countError));
        setErrorMsg('申請に失敗しました。しばらくしてから再試行してください。');
        return;
      }
      if ((count ?? 0) >= 1) {
        setErrorMsg('申請上限は1日1申請になります');
        return;
      }

      // Check if input is valid
      if (requestType === 'add') {
        const trimmedName = nameInput.trim();
        
        if (!trimmedName) {
          setErrorMsg('選手名を入力してください');
          return;
        }

        if (trimmedName.length > 30) {
          setErrorMsg('文字数の制限30文字を超えています');
          return;
        }

        const filteredFighters : Fighter[] = fighters.filter((f) => {
          return f.name === trimmedName;
        })
        if (filteredFighters.length > 0){
          setErrorMsg('すでに登録されている選手です');
          return;
        }
      } else {
        if (!selected) {
          setErrorMsg('選手名を選択してください');
          return;
        }
        if (!deleteReason) {
          setErrorMsg('削除理由を選択してください');
          return;
        }
      }

      // Build the request form
      const requestForm: FighterRequestForm =
        requestType === 'add'
          ? { request_type: 'add', player_name: nameInput.trim(), created_by: user.id }
          : { request_type: 'delete', player_name: nameInput.trim(), target_fighter_id: selected?.id, delete_reason: deleteReason, created_by: user.id };

      // Insert new request into fighter_requests table
      const insertError = await insertFighterRequest(requestForm);

      if (insertError) {
        console.error('Failed to insert fighter request:', JSON.stringify(insertError));
        setErrorMsg('申請に失敗しました。しばらくしてから再試行してください。');
        return;
      }

      router.push('/request-comp');
    } catch (e: unknown) {
      console.error('Unexpected error during handling submit:', e);
      setErrorMsg('不明なエラーが発生しました。しばらくしてから再試行してください。');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col p-8 rounded border border-gray-300 gap-y-4 w-120 lg:w-160">
        <h1 className="text-3xl font-bold">選手申請（追加/削除）</h1>
        <p className="text-gray-600">
          選手申請を通して、選手データの最新化にご協力いただけるとありがたいです。
          申請に関する承諾/拒否は運営側の判断にて行わせていただきます。
        </p>

        {errorMsg && (
          <div className="text-red-600 border border-red-300 bg-red-50 rounded p-2">
            {errorMsg}
          </div>
        )}

        <label className="text-gray-700 font-medium mt-2">申請項目</label>
        <div className="flex gap-x-3">
          <label className="border border-gray-300 rounded px-3 py-2 cursor-pointer">
            <input
              type="radio"
              name="requestType"
              value="add"
              checked={requestType === "add"}
              onChange={(e) => setRequestType(e.target.value as "add" | "delete")}
              className="mr-1"
            />
            選手を追加（登録）
          </label>
          <label className="border border-gray-300 rounded px-3 py-2 cursor-pointer">
            <input
              type="radio"
              name="requestType"
              value="delete"
              checked={requestType === "delete"}
              onChange={(e) => setRequestType(e.target.value as "add" | "delete")}
              className="mr-1"
            />
            選手を削除（解除）
          </label>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-2">
          {requestType === 'add' && (
            <div>
              <label className="text-gray-700 font-medium mt-2">選手名</label>
              <input 
                value={nameInput} 
                onChange={(e) => setNameInput(e.target.value)} 
                placeholder="選手名を入力" 
               className="border border-gray-300 rounded px-3 py-2 w-full" 
              />
            </div>
          )}

          {requestType === 'delete' && (
            <div className="flex flex-col">
              <label className="text-gray-700 font-medium mt-2">選手名</label>
              <input
                value={nameInput}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="選手名を入力"
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
              {open && filtered.length > 0 && (
                <ul className="z-10 bg-white rounded shadow border border-gray-300 mt-1 w-full">
                  {filtered.map((f) => (
                    <li
                      key={f.id}
                      onClick={() => {
                        setNameInput(f.name);
                        setSelected(f);
                        setOpen(false);
                      }}
                      className="hover:bg-gray-100 px-3 py-2 cursor-pointer"
                    >
                      {f.name}
                    </li>
                  ))}
                </ul>
              )}

              <label className="text-gray-700 font-medium mt-3">理由</label>
              <select value={deleteReason} onChange={(e) => setDeleteReason(e.target.value as DeleteReason)} className="block border border-gray-300 rounded shadow-sm px-3 py-2 w-full cursor-pointer">
                <option value="retirement">引退</option>
                <option value="switch_sport">別競技への転向</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-center">
            <button type="submit" className="text-lg text-white font-bold rounded-lg shadow bg-red-600 hover:bg-red-700 transition duration-200 mt-5 px-6 py-2 cursor-pointer">
              申請する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
