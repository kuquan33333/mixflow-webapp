import { supabase } from '../lib/supabase';
import type { Post, MusicTrack, Profile, Message, MessageContent, Conversation } from '../lib/types';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(updates: Partial<Profile>): Promise<void> {
  const { error } = await supabase.from('profiles').update(updates).eq('id', updates.id);
  if (error) throw error;
}

export async function fetchFeed(cursor?: string, limit = 10): Promise<{ posts: Post[]; nextCursor: string | null }> {
  let query = supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(*), music_tracks!posts_music_id_fkey(*)')
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = data.length > limit;
  const posts = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? posts[posts.length - 1].created_at : null;

  return { posts: posts as Post[], nextCursor };
}

export async function fetchReels(cursor?: string, limit = 5): Promise<{ posts: Post[]; nextCursor: string | null }> {
  let query = supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(*), music_tracks!posts_music_id_fkey(*)')
    .eq('type', 'reel')
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = data.length > limit;
  const posts = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? posts[posts.length - 1].created_at : null;

  return { posts: posts as Post[], nextCursor };
}

export async function fetchUserPosts(userId: string, type?: 'post' | 'reel'): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(*), music_tracks!posts_music_id_fkey(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Post[];
}

export async function fetchBookmarkedPosts(userId: string): Promise<Post[]> {
  const { data: bookmarks, error: bmError } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('user_id', userId);

  if (bmError) throw bmError;
  if (!bookmarks || bookmarks.length === 0) return [];

  const postIds = bookmarks.map((b) => b.post_id);
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(*), music_tracks!posts_music_id_fkey(*)')
    .in('id', postIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Post[];
}

export async function createPost(post: {
  media_urls: string[];
  caption: string;
  hashtags: string[];
  music_id: string | null;
  music_start: number;
  music_end: number;
  type: 'post' | 'reel';
}): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select('*, profiles!posts_user_id_fkey(*), music_tracks!posts_music_id_fkey(*)')
    .single();
  if (error) throw error;
  return data as Post;
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
}

export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
    return false;
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: userId });
    return true;
  }
}

export async function toggleBookmark(postId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', userId);
    return false;
  } else {
    await supabase.from('bookmarks').insert({ post_id: postId, user_id: userId });
    return true;
  }
}

export async function fetchLikeCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  if (error) return 0;
  return count || 0;
}

export async function searchMusic(query: string, limit = 20): Promise<MusicTrack[]> {
  const { data, error } = await supabase
    .from('music_tracks')
    .select('*')
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
    .limit(limit);
  if (error) throw error;
  return data as MusicTrack[];
}

export async function fetchMusicById(id: string): Promise<MusicTrack | null> {
  const { data, error } = await supabase
    .from('music_tracks')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as MusicTrack | null;
}

export async function fetchUserPlaylist(userId: string): Promise<MusicTrack[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('music_tracks!posts_music_id_fkey(*)')
    .eq('user_id', userId)
    .not('music_id', 'is', null);
  if (error) throw error;

  const tracks = (data || [])
    .map((p: any) => p.music_tracks)
    .filter((t: any) => t !== null);

  const unique = new Map<string, MusicTrack>();
  tracks.forEach((t: any) => {
    if (t && !unique.has(t.id)) unique.set(t.id, t as MusicTrack);
  });
  return Array.from(unique.values());
}

export async function fetchFollowStats(userId: string): Promise<{ followers: number; following: number }> {
  const { count: followers } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('followee_id', userId);

  const { count: following } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  return { followers: followers || 0, following: following || 0 };
}

export async function toggleFollow(followerId: string, followeeId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle();

  if (existing) {
    await supabase.from('follows').delete().eq('follower_id', followerId).eq('followee_id', followeeId);
    return false;
  } else {
    await supabase.from('follows').insert({ follower_id: followerId, followee_id: followeeId });
    return true;
  }
}

export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle();
  return !!data;
}

export async function searchUsers(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20);
  if (error) throw error;
  return data as Profile[];
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*), receiver:profiles!messages_receiver_id_fkey(*)')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const convMap = new Map<string, Conversation>();
  (data || []).forEach((msg: any) => {
    const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
    if (!otherUser) return;
    if (!convMap.has(otherUser.id)) {
      convMap.set(otherUser.id, {
        user: otherUser as Profile,
        last_message: msg as Message,
        unread_count: 0,
      });
    }
    const conv = convMap.get(otherUser.id)!;
    if (!conv.last_message || msg.created_at > conv.last_message.created_at) {
      conv.last_message = msg as Message;
    }
    if (msg.receiver_id === userId && !msg.read_at) {
      conv.unread_count++;
    }
  });

  return Array.from(convMap.values()).sort((a, b) => {
    const aTime = a.last_message?.created_at || '';
    const bTime = b.last_message?.created_at || '';
    return bTime.localeCompare(aTime);
  });
}

export async function fetchMessages(otherUserId: string, currentUserId: string, before?: string, limit = 30): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Message[]).reverse();
}

export async function sendMessage(receiverId: string, content: MessageContent): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      receiver_id: receiverId,
      content,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Message;
}

export async function markMessagesRead(otherUserId: string, currentUserId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', otherUserId)
    .eq('receiver_id', currentUserId)
    .is('read_at', null);
  if (error) throw error;
}

export async function uploadFile(file: File, bucket: string, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}
