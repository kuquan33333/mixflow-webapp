export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
  created_at: string;
  updated_at: string;
};

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  source: 'upload' | 'spotify' | 'internal';
  url: string;
  duration: number;
  cover_url: string;
  created_by?: string | null;
  created_at: string;
};

export type PostType = 'post' | 'reel';

export type Post = {
  id: string;
  user_id: string;
  media_urls: string[];
  caption: string;
  hashtags: string[];
  music_id: string | null;
  music_start: number;
  music_end: number;
  type: PostType;
  created_at: string;
  // joined fields
  profiles?: Profile;
  music_tracks?: MusicTrack | null;
  like_count?: number;
  liked_by_me?: boolean;
  bookmarked_by_me?: boolean;
};

export type MessageContent = {
  text?: string;
  post_id?: string;
  music_id?: string;
  preview_url?: string;
  media_url?: string;
  media_type?: 'image' | 'video';
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: MessageContent;
  created_at: string;
  read_at: string | null;
};

export type Conversation = {
  user: Profile;
  last_message: Message | null;
  unread_count: number;
};

export type Follow = {
  follower_id: string;
  followee_id: string;
  created_at: string;
};
