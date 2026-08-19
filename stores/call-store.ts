import { create } from 'zustand';

type CallStatus = 'idle' | 'connecting' | 'ringing' | 'connected' | 'reconnecting' | 'ended' | 'failed';

type CallState = {
  status: CallStatus;
  muted: boolean;
  speaker: boolean;
  setStatus: (status: CallStatus) => void;
  toggleMuted: () => void;
  toggleSpeaker: () => void;
  reset: () => void;
};

export const useCallStore = create<CallState>((set) => ({
  status: 'idle',
  muted: false,
  speaker: false,
  setStatus: (status) => set({ status }),
  toggleMuted: () => set((state) => ({ muted: !state.muted })),
  toggleSpeaker: () => set((state) => ({ speaker: !state.speaker })),
  reset: () => set({ status: 'idle', muted: false, speaker: false }),
}));
