import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import type { Post } from '../lib/types';
import { fetchFeed } from '../lib/api';
import { PostCard } from './PostCard';

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setError('');
    } else {
      setLoadingMore(true);
    }
    try {
      const { posts: newPosts, nextCursor } = await fetchFeed(reset ? undefined : cursor || undefined);
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } catch (err: any) {
      setError(err.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor]);

  useEffect(() => {
    load(true);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-white/50 mb-4">{error}</p>
        <button onClick={() => load(true)} className="btn-primary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
          <RefreshCw className="w-8 h-8 text-white/30" />
        </div>
        <p className="text-white/50 text-sm">No posts yet. Be the first to share!</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={() => load(false)}
            disabled={loadingMore}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Load more'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
