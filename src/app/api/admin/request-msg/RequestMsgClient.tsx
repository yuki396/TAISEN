'use client';
import Link from 'next/link';
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { FighterRequest } from '@/types/types';

interface Props {
  initialRequests: FighterRequest[];
}

export default function RequestMsgClient({ initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // For changing the status to display format
  const statusLabel = (status?: string | null) =>
    status === 'approved' ? '承認'
    : status === 'rejected' ? '却下'
    : '審査中';

  // For changing the reason to display format
  const reasonLabel = (reason?: string | null) =>
    reason === 'retirement' ? '引退'
    : reason === 'switch_sport' ? '転向'
    : '-';

  // For handling action "承諾/拒否"
  const handleAction = async (requestId: number, action: 'approve' | 'reject') => {
    setProcessingId(requestId);
    setError(null);

    try {
      // Send POST request
      const res = await fetch('/api/admin/fighter-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? '操作に失敗しました');
      }

      // Set the status of POST responce to local state
      setRequests(prev =>
        prev.map(r =>
          r.id === requestId
            ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' }
            : r
        )
      );
    } catch (e: unknown) {
      console.error('Unexpected error during deleting the fighter request : ', e);
      setError('不明なエラーが発生しました。しばらくしてから再試行してください。');
    } finally {
      setProcessingId(null);
    }
  };

// For handling action "削除"
const handleDelete = async (requestId: number) => {
  if (!confirm('この申請を完全に削除してもよいですか？')) return;

  setProcessingId(requestId);
  setError(null);

  try {
    // Send DELETE request
    const res = await fetch('/api/admin/fighter-requests', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? '削除に失敗しました');
    }

    // Remove the fighter request from local state
    setRequests(prev => prev.filter(r => r.id !== requestId));
  } catch (e: unknown) {
    console.error('Unexpected error during deleting the fighter request : ', e);
    setError('不明なエラーが発生しました。しばらくしてから再試行してください。');
  } finally {
    setProcessingId(null);
  }
};

// For filetering the request by status
const filteredRequests = useMemo(() => {
  return requests.filter(r => (filterStatus === 'all' ? true : r.status === filterStatus));
}, [requests, filterStatus]);

// For sorting by created_at
const sortedRequests = useMemo(() => {
  const arr = [...filteredRequests];
  arr.sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return sortOrder === 'asc' ? ta - tb : tb - ta;
  });
  return arr;
}, [filteredRequests, sortOrder]);

// Pagination
const totalPages = Math.ceil(sortedRequests.length / ITEMS_PER_PAGE);
const paginatedRequests = sortedRequests.slice(
  (page - 1) * ITEMS_PER_PAGE,
  page * ITEMS_PER_PAGE
);

return (
    <div className="p-8">
      <div className=" flex items-start justify-between mb-4">
        <Link href="/" className="text-gray-600 hover:underline">← トップに戻る</Link>
      </div>

      <div className="rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold mt-4">申請一覧</h1>
        <p className="text-gray-600 mt-1">ユーザーからの申請を承諾 / 拒否できます。</p>
        {error && <p className="text-red-600 rounded bg-red-50 border border-red-300 p-2 mt-5">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-y-1 sm:gap-x-4 border-t border-gray-200 pt-4 mt-3">
          <div className="flex items-center gap-1">
            <label className="font-semibold">並び順：</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="border rounded px-3 py-1 cursor-pointer"
            >
              <option value="desc">新しい順</option>
              <option value="asc">古い順</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <label className="font-semibold">ステータス：</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
              className="border rounded px-3 py-1 cursor-pointer"
            >
              <option value="all">すべて</option>
              <option value="pending">審査中</option>
              <option value="approved">承認</option>
              <option value="rejected">却下</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="whitespace-nowrap px-4 py-6">申請日時</th>
                <th className="whitespace-nowrap px-4 py-6">種別</th>
                <th className="whitespace-nowrap px-4 py-6">選手名</th>
                <th className="whitespace-nowrap px-4 py-6">理由</th>
                <th className="whitespace-nowrap px-4 py-6">ステータス</th>
                <th className="text-right whitespace-nowrap px-4 py-6">操作</th>
              </tr>
            </thead>

            <tbody>
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-20">申請がありません</td>
                </tr>
              ) : (
                paginatedRequests.map((r) => (
                  <tr key={r.id} className="border-b border-gray-300">
                    <td className="px-4 py-6">{r.created_at ? format(new Date(r.created_at), 'yyyy/M/d HH:mm:ss') : '-'}</td>
                    <td className="px-4 py-6">{r.request_type === 'add' ? '追加' : '削除'}</td>
                    <td className="whitespace-nowrap px-4 py-6">{r.player_name}</td>
                    <td className="px-4 py-6">{reasonLabel(r.delete_reason) ?? '-'}</td>
                    <td className="px-4 py-6">
                      <span className="inline-block text-sm text-gray-600 rounded-full border px-3 py-1">{statusLabel(r.status)}</span>
                    </td>
                    <td className="text-right px-4 py-6">
                      <div className="flex items-center gap-x-3">
                        <button
                          disabled={processingId === r.id || r.status !== 'pending'}
                          onClick={() => handleAction(r.id, 'approve')}
                          className={`flex items-center gap-2 font-semibold whitespace-nowrap rounded-md px-4 py-2 cursor-pointer
                                    ${r.status === "pending" ? "bg-black text-white hover:bg-gray-800" : "hidden"}`}
                        >
                          ✓ 承諾
                        </button>

                        <button
                          disabled={processingId === r.id || r.status !== 'pending'}
                          onClick={() => handleAction(r.id, 'reject')}
                          className={`flex items-center gap-2 font-semibold whitespace-nowrap rounded-md border px-4 py-2 cursor-pointer 
                                    ${r.status === "pending" ? "text-gray-800 hover:bg-gray-50" : "hidden" }`}
                        >
                          ✕ 拒否
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={processingId === r.id}
                          className={`flex items-center gap-2 font-semibold whitespace-nowrap rounded-md border border-red-100 px-3 py-1 cursor-pointer
                                    ${r.status === "pending" ? "hidden" : "text-red-600 hover:bg-red-100"}`}
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`px-3 py-1 rounded-md border 
                  ${num === page ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                {num}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
