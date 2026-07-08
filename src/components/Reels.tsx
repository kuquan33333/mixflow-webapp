import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Music2, X, Loader2 } from 'lucide-react';
import type { Post } from '../lib/types';
import { fetchReels, toggleLike, toggleBookmark } from '../lib/api';
import { audioManager } from '../lib/audio';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { getAvatarUrl } from '../lib/utils';

export function Reels() {
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const { setReelsActive, setActiveTab } = useAppStore();
  const { user } = useAuthStore();

  const loadReels = useCallback(async (reset = false) => {
    try {
      const { posts, nextCursor } = await fetchReels(reset ? undefined : cursor || undefined);
      if (reset) {
        setReels(posts);
      } else {
        setReels((prev) => [...prev, ...posts]);
      }
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } catch (err) {
      console.error('Failed to load reels:', err);
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    setReelsActive(true);
    audioManager.interrupt();
    loadReels(true);

    return () => {
      setReelsActive(false);
      videoRefs.current.forEach((v) => v?.pause());
      audioManager.resumeAfterInterrupt();
    };
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === activeIndex) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });

    if (activeIndex >= reels.length - 2 && hasMore) {
      loadReels(false);
    }
  }, [activeIndex, reels.length, hasMore]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const itemHeight = container.clientHeight;
    const index = Math.round(container.scrollTop / itemHeight);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likes[postId] || false;
    setLikes((p) => ({ ...p, [postId]: !isLiked }));
    try {
      await toggleLike(postId, user.id);
    } catch {
      setLikes((p) => ({ ...p, [postId]: isLiked }));
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!user) return;
    const isBookmarked = bookmarks[postId] || false;
    setBookmarks((p) => ({ ...p, [postId]: !isBookmarked }));
    try {
      await toggleBookmark(postId, user.id);
    } catch {
      setBookmarks((p) => ({ ...p, [postId]: isBookmarked }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <Music2 className="w-12 h-12 text-white/20 mb-4" />
        <p className="text-white/50 text-sm mb-4">No reels yet</p>
        <button onClick={() => setActiveTab('create')} className="btn-primary text-sm">
          Create the first reel
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-30">
      <button
        onClick={() => setActiveTab('feed')}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-container no-scrollbar"
      >
        {reels.map((reel, i) => (
          <div
            key={reel.id}
            className="snap-item h-full w-full relative flex items-center justify-center"
          >
            {reel.media_urls[0] && (
              <video
                ref={(el) => { videoRefs.current[i] = el; }}
                src={reel.media_urls[0]}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={false}
                preload="metadata"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

            <div className="absolute bottom-0 left-0 right-0 p-4 pb-8">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={getAvatarUrl(reel.profiles?.avatar_url)}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                />
                <div>
                  <p className="text-white font-semibold text-sm">
                    {reel.profiles?.display_name || reel.profiles?.username}
                  </p>
                  <p className="text-white/60 text-xs">@{reel.profiles?.username}</p>
                </div>
              </div>
              {reel.caption && (
                <p className="text-white text-sm mb-2 line-clamp-2">{reel.caption}</p>
              )}
              {reel.music_tracks && (
                <div className="flex items-center gap-2 text-white/80 text-xs">
                  <Music2 className="w-3.5 h-3.5" />
                  <span className="truncate">
                    {reel.music_tracks.title} · {reel.music_tracks.artist}
                  </span>
                </div>
              )}
            </div>

            <div className="absolute right-3 bottom-24 flex flex-col gap-5 items-center">
              <button
                onClick={() => handleLike(reel.id)}
                className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
              >
                <Heart
                  className={`w-8 h-8 ${likes[reel.id] ? 'fill-error-500 text-error-500' : 'text-white'}`}
                />
              </button>
              <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                <MessageCircle className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={() => handleBookmark(reel.id)}
                className="active:scale-90 transition-transform"
              >
                <Bookmark
                  className={`w-8 h-8 ${bookmarks[reel.id] ? 'fill-warning-400 text-warning-400' : 'text-white'}`}
                />
              </button>
              <button className="active:scale-90 transition-transform">
                <Share2 className="w-7 h-7 text-white" />
              </button>
              {reel.music_tracks && (
                <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white/20 animate-spin-slow">
                  <img src={reel.music_tracks.cover_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
