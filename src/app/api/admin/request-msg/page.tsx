export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import RequestMsgClient from './RequestMsgClient';
import type { FighterRequest } from '@/types/types';
import { getCurrentUser, fetchFighterRequests, fetchProfileForAdmin } from '@/utils/supabaseServerUtils'

export default async function RequestMsgPage() {

  // Confirm login
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Check if the user is an admin
  const { pData, pError } = await fetchProfileForAdmin(user.id);
  if (pError) {
    console.error('Failed to fetch profile data :', JSON.stringify(pError));
    redirect('/login');
  }
  
  if (!pData?.is_admin) {
    console.log('User is not admin');
    redirect('/');
  }

  // Fetch initial fighter requests
  const { frData, frError } = await fetchFighterRequests();
  if (frError) {
   console.log('Failed to fetch nitial fighter requests : ', JSON.stringify(frError));
  }

  return <RequestMsgClient initialRequests={frData as FighterRequest[]} />;
}