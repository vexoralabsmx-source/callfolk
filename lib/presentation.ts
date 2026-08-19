import type { Person } from '@/types';

const avatarColors = ['#756CFF', '#E56E95', '#38BC8A', '#E6A75C', '#508DDE', '#8B7CF6'];

export function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CF';
}

export function colorFor(value: string) {
  const score = [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
  return avatarColors[score % avatarColors.length];
}

export function personFromProfile(profile: { id: string; display_name: string; username: string; last_seen_at?: string | null }): Person {
  return {
    id: profile.id,
    name: profile.display_name,
    username: profile.username,
    initials: initialsFor(profile.display_name),
    color: colorFor(profile.id),
    online: profile.last_seen_at ? Date.now() - new Date(profile.last_seen_at).getTime() < 5 * 60_000 : false,
  };
}

export function shortTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
