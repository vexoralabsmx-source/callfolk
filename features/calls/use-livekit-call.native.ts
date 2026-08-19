import { useEffect, useRef } from 'react';
import { AudioSession, registerGlobals } from '@livekit/react-native';
import { Room, RoomEvent } from 'livekit-client';
import { requestCallCredentials } from '@/features/calls/livekit';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useCallStore } from '@/stores/call-store';

registerGlobals();

export function useLiveKitCall(calleeId: string) {
  const roomRef = useRef<Room | null>(null);
  const setStatus = useCallStore((state) => state.setStatus);
  const muted = useCallStore((state) => state.muted);
  const reset = useCallStore((state) => state.reset);

  useEffect(() => {
    let cancelled = false;
    let demoTimer: ReturnType<typeof setTimeout> | undefined;

    async function connect() {
      setStatus('connecting');
      const { data } = await supabase.auth.getSession();
      if (!isSupabaseConfigured || !data.session) {
        demoTimer = setTimeout(() => !cancelled && setStatus('connected'), 1300);
        return;
      }

      try {
        const credentials = await requestCallCredentials(calleeId, data.session.access_token);
        if (cancelled) return;
        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;
        room.on(RoomEvent.Reconnecting, () => setStatus('reconnecting'));
        room.on(RoomEvent.Reconnected, () => setStatus('connected'));
        room.on(RoomEvent.Disconnected, () => setStatus('ended'));
        await AudioSession.startAudioSession();
        await room.connect(credentials.serverUrl, credentials.token);
        await room.localParticipant.setMicrophoneEnabled(true);
        if (!cancelled) setStatus('connected');
      } catch {
        if (!cancelled) setStatus('failed');
      }
    }

    connect();
    return () => {
      cancelled = true;
      if (demoTimer) clearTimeout(demoTimer);
      roomRef.current?.disconnect();
      roomRef.current = null;
      AudioSession.stopAudioSession();
    };
  }, [calleeId, setStatus]);

  useEffect(() => {
    roomRef.current?.localParticipant.setMicrophoneEnabled(!muted);
  }, [muted]);

  return {
    isLive: Boolean(roomRef.current),
    end: async () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
      await AudioSession.stopAudioSession();
      reset();
    },
  };
}
