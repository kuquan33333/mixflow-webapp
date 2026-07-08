import { formatDistanceToNow } from 'date-fns';

export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function timeAgo(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '';
  }
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/[\w]+/g);
  return matches ? matches : [];
}

export function getAvatarUrl(url: string | undefined): string {
  if (!url) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`;
  return url;
}

export function isVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

export function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
