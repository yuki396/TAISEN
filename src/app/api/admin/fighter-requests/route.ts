import { NextResponse } from 'next/server';
import {
  getCurrentUser,
  fetchProfileForAdmin,
  fetchFighterRequestById,
  insertFighter,
  deleteFighter,
  updateFighterRequest,
  deleteFighterRequest
} from '@/utils/supabaseServerUtils';

// For handling POST request
export async function POST(req: Request) {
  try {
    // Confirm login
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: '認証されていません' }, { status: 401 });

    // Check if the user is an admin
    const { pData, pError } = await fetchProfileForAdmin(user.id);
    if (pError || !pData?.is_admin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    // Get the fighter request ID and action from the POST request
    const body = await req.json();
    const { requestId, action } = body as {
      requestId: number;
      action: 'approve' | 'reject';
    };

    // Check if the correct action is included
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: '不正なパラメータ' }, { status: 400 });
    }

    // Fetch the fighter request
    const { frData, frError } = await fetchFighterRequestById(requestId);
    // Check if the request list was successfully retrieved
    if (frError) {
      console.error('Failed to fetch the fighter request (POST) : ', JSON.stringify(frError));
      return NextResponse.json({ error: '申請の取得に失敗しました' }, { status: 500 });
    }
    if (!frData) return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });

    // Check if the request status is not approved or rejected
    if (frData.status !== 'pending') return NextResponse.json({ error: '申請はすでに処理済みです' }, { status: 400 });

    // For action "承認"
    if (action === 'approve') {
      // For request type "選手を追加"
      if (frData.request_type === 'add') {
        // Insert fighter
        const {  fError } = await insertFighter(frData.player_name ?? '');
        if (fError) {
          console.error('Failed to insert fighter : ', JSON.stringify(fError));
          return NextResponse.json({ error: JSON.stringify(fError) }, { status: 500 });
        }
        // Update the fighter request status
        const { upError } = await updateFighterRequest({
          id: frData.id,
          status: 'approved',
          processed_by: user.id,
          processed_at: new Date().toISOString(),
        });
        if (upError) {
          console.error('Failed to update the fighter request status : ', JSON.stringify(upError));
          return NextResponse.json({ error: '申請ステータスの更新に失敗しました' }, { status: 500 });
        }
      
      // For request type "選手を削除"
      } else if (frData.request_type === 'delete') {
        // Check if the fighter id is included
        if (!frData.target_fighter_id) {
          return NextResponse.json({ error: '対象選手IDがありません' }, { status: 400 });
        }

        // Delete fighter
        const delError = await deleteFighter(frData.target_fighter_id);
        if (delError) {
          console.error('Failed to delete fighter : ', JSON.stringify(delError));
          return NextResponse.json({ error: '選手の削除に失敗しました' }, { status: 500 });
        }
        
        // Update the fighter request status
        const { upError } = await updateFighterRequest({
          id: frData.id,
          status: 'approved',
          processed_by: user.id,
          processed_at: new Date().toISOString()
        });
        if (upError) {
          console.error('Failed to update the fighter request status : ', JSON.stringify(upError));
          return NextResponse.json({ error: '申請のステータス更新に失敗しました' }, { status: 500 });
        }
      }
    // For action "拒否"
    } else {
      // Update the fighter request status
      const { upError } = await updateFighterRequest({
        id: frData.id,
        status: 'rejected',
        processed_by: user.id,
        processed_at: new Date().toISOString()
      });
      if (upError) {
        console.error('Failed to update the fighter request status :', JSON.stringify(upError));
        return NextResponse.json({ error: '申請の更新に失敗しました' }, { status: 500 });
      }
    }

    return NextResponse.json({ message: '処理が完了しました' });
  } catch (e: unknown) {
    console.error('Unexpected error during POST : ', e);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

// For handling DELETE request
export async function DELETE(req: Request) {
  try {
     // Confirm login
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: '認証されていません' }, { status: 401 });

    // Check if the user is an admin
    const { pData, pError } = await fetchProfileForAdmin(user.id);
    if (pError || !pData?.is_admin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    // Get the request ID from the DELETE request
    const body = await req.json();
    const { requestId } = body as { requestId: number };

    // Check if the correct ID is included
    if (!requestId || typeof requestId !== 'number') {
      return NextResponse.json({ error: '不正なリクエストID' }, { status: 400 });
    }

    // Fetch the fighter request
    const { frData, frError } = await fetchFighterRequestById(requestId);
    // Check if the request list was successfully retrieved
    if (frError) {
      console.error('Failed to fetch fighter request (DELETE)', JSON.stringify(frError));
      return NextResponse.json({ error: '申請の取得に失敗しました' }, { status: 500 });
    }
    if (!frData) return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });

    // Delete the fighter request
    const delError = await deleteFighterRequest(requestId);
     // Check if the deletion was successful
    if (delError) {
      console.error('Failed to delete the fighter request :', JSON.stringify(delError));
      return NextResponse.json({ error: '申請の削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ message: '削除が完了しました' });
  } catch (e: unknown) {
    console.error('Unexpected error during DELETE : ', e);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}