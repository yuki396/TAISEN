'use client'
import { useEffect, useState } from 'react';
import { getCurrentUser, fetchAdminStatusbyId } from '@/utils/supabaseBrowserUtils';

// For checking if the current user is admin
export const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!mounted) return;
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        const { apData, apError } = await fetchAdminStatusbyId(user.id);

        if (!mounted) return;
        if (apError) {
          console.error('Failed to ', JSON.stringify(apError));
          setIsAdmin(false);
        } else {
          setIsAdmin(Boolean(apData?.is_admin));
        }
      } catch (e) {
        console.error('useIsAdmin error', e);
        if (mounted) setIsAdmin(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { isAdmin, loading };
};