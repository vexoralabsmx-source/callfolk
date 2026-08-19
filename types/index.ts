export type Person = {
  id: string;
  name: string;
  username: string;
  initials: string;
  color: string;
  online?: boolean;
};

export type Conversation = Person & {
  personId: string;
  preview: string;
  time: string;
  unread?: number;
  typing?: boolean;
};

export type CallRecord = Person & {
  recordId: string;
  direction: 'incoming' | 'outgoing' | 'missed';
  time: string;
  duration?: string;
};
