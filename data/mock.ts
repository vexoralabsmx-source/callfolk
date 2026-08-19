import type { CallRecord, Conversation, Person } from '@/types';

export const people: Person[] = [
  { id: 'maya', name: 'Maya Chen', username: 'mayac', initials: 'MC', color: '#7B72FF', online: true },
  { id: 'noah', name: 'Noah Williams', username: 'nwill', initials: 'NW', color: '#E56E95', online: true },
  { id: 'sora', name: 'Sora Kim', username: 'sorak', initials: 'SK', color: '#2CB67D' },
  { id: 'jules', name: 'Jules Moreau', username: 'julesm', initials: 'JM', color: '#E6A75C' },
  { id: 'nina', name: 'Nina Patel', username: 'ninap', initials: 'NP', color: '#508DDE', online: true },
];

export const conversations: Conversation[] = [
  { ...people[0], preview: 'That sounds perfect. Call later?', time: '9:42 PM', unread: 2 },
  { ...people[1], preview: 'Sent a voice message', time: '8:17 PM' },
  { ...people[2], preview: 'You: The new build is ready ✦', time: 'Yesterday' },
  { ...people[3], preview: 'Typing…', time: 'Yesterday', typing: true },
  { ...people[4], preview: 'See you on Friday!', time: 'Mon' },
];

export const calls: CallRecord[] = [
  { ...people[0], direction: 'outgoing', time: 'Today, 6:34 PM', duration: '18m 42s' },
  { ...people[1], direction: 'missed', time: 'Today, 11:02 AM' },
  { ...people[4], direction: 'incoming', time: 'Yesterday, 8:21 PM', duration: '4m 09s' },
  { ...people[2], direction: 'outgoing', time: 'Monday, 4:12 PM', duration: '12m 31s' },
];
