import { useEffect } from 'react';
import { useCallStore } from '@/stores/call-store';

export function useLiveKitCall(_calleeId: string) {
  const setStatus = useCallStore((state) => state.setStatus);
  const reset = useCallStore((state) => state.reset);

  useEffect(() => {
    setStatus('connecting');
    const timer = setTimeout(() => setStatus('connected'), 1300);
    return () => clearTimeout(timer);
  }, [setStatus]);

  return { end: async () => reset(), isLive: false };
}
