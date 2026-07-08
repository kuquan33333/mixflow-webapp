import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Play, Pause } from 'lucide-react';
import type { Post } from '../lib/types';
import { useAuthStore } from '../stores/authStore';
import { audioManager } from '../lib/audio';
import { toggleLike, toggleBookmark } from '../lib/api';
import { timeAgo, isVideo, formatCount, getAvatarUrl } from '../lib/utils';
import { useAppStore } from '../stores/appStore';

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuthStore();
  const { setViewingProfileId, setActiveTab } = useAppStore();
  const [liked, setLiked] = useState(post.liked_by_me || false);
  const [bookmarked, setBookmarked] = useState(post.bookmarked_by_me || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasMusic = post.music_tracks && post.music_id;
  const mediaList = post.media_urls || [];

  useEffect(() => {
    return () => {
      if (isPlayingPreview) {
        audioManager.stopPreview();
      }
    };
  }, [isPlayingPreview]);

  const handleLike = async () => {
    if (!user) return;
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    try {
      await toggleLike(post.id, user.id);
    } catch {
      setLiked(liked);
      setLikeCount((c) => (liked ? c + 1 : c - 1));
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    setBookmarked(!bookmarked);
    try {
      await toggleBookmark(post.id, user.id);
    } catch {
      setBookmarked(bookmarked);
    }
  };

  const handleMusicPreview = () => {
    if (!hasMusic) return;
    if (isPlayingPreview) {
      audioManager.stopPreview();
      audioManager.resumeAfterInterrupt();
      setIsPlayingPreview(false);
    } else {
      audioManager.playPreview(
        post.music_tracks!,
        post.music_start || 0,
        post.music_end || post.music_tracks!.duration,
        () => {
          setIsPlayingPreview(false);
          audioManager.resumeAfterInterrupt();
        }
      );
      setIsPlayingPreview(true);
    }
  };

  const handleProfileClick = () => {
    if (post.user_id === user?.id) {
      setActiveTab('profile');
    } else {
      setViewingProfileId(post.user_id);
      setActiveTab('profile');
    }
  };

  return (
    <div className="card overflow-hidden mb-3 animate-fade-in">
      <div className="flex items-center gap-3 p-3">
        <button onClick={handleProfileClick} className="flex-shrink-0">
          <img
            src={getAvatarUrl(post.profiles?.avatar_url)}
            alt=""
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
          />
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={handleProfileClick} className="font-semibold text-sm text-white hover:text-primary-400 transition-colors">
            {post.profiles?.display_name || post.profiles?.username}
          </button>
          <p className="text-xs text-white/40">@{post.profiles?.username} · {timeAgo(post.created_at)}</p>
        </div>
        <button className="text-white/40 hover:text-white transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {post.caption && (
        <div className="px-3 pb-2">
          <p className="text-sm text-white/90 whitespace-pre-wrap line-clamp-3">{post.caption}</p>
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.hashtags.map((tag) => (
                <span key={tag} className="text-xs text-primary-400 font-medium">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {mediaList.length > 0 && (
        <div className="relative bg-black aspect-square overflow-hidden">
          {isVideo(mediaList[currentMedia]) ? (
            <video
              ref={videoRef}
              src={mediaList[currentMedia]}
              className="w-full h-full object-cover"
              controls
              playsInline
              loop
            />
          ) : (
            <img
              src={mediaList[currentMedia]}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          {mediaList.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {mediaList.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentMedia(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentMedia ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
          {hasMusic && (
            <button
              onClick={handleMusicPreview}
              className="absolute bottom-3 right-3 glass-strong rounded-full pl-2.5 pr-3.5 py-1.5 flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                {isPlayingPreview ? (
                  <Pause className="w-3 h-3 text-white" fill="currentColor" />
                ) : (
                  <Play className="w-3 h-3 text-white ml-0.5" fill="currentColor" />
                )}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white leading-tight max-w-[120px] truncate">
                  {post.music_tracks!.title}
                </p>
                <p className="text-[10px] text-white/50 leading-tight truncate">
                  {post.music_tracks!.artist}
                </p>
              </div>
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-5 px-4 py-3">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 text-white/70 hover:text-error-400 transition-colors active:scale-90"
        >
          <Heart
            className={`w-6 h-6 ${liked ? 'fill-error-500 text-error-500' : ''}`}
          />
          {likeCount > 0 && <span className="text-sm font-medium">{formatCount(likeCount)}</span>}
        </button>
        <button className="flex items-center gap-1.5 text-white/70 hover:text-primary-400 transition-colors active:scale-90">
          <MessageCircle className="w-6 h-6" />
        </button>
        <button className="flex items-center gap-1.5 text-white/70 hover:text-primary-400 transition-colors active:scale-90">
          <Share2 className="w-5.5 h-5.5" />
        </button>
        <button
          onClick={handleBookmark}
          className="ml-auto text-white/70 hover:text-warning-400 transition-colors active:scale-90"
        >
          <Bookmark
            className={`w-6 h-6 ${bookmarked ? 'fill-warning-400 text-warning-400' : ''}`}
          />
        </button>
      </div>

      {hasMusic && !mediaList.length && (
        <div className="px-3 pb-3">
          <button
            onClick={handleMusicPreview}
            className="w-full glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              <img src={post.music_tracks!.cover_url} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-white truncate">{post.music_tracks!.title}</p>
              <p className="text-xs text-white/50 truncate">{post.music_tracks!.artist}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center">
              {isPlayingPreview ? (
                <Pause className="w-4 h-4 text-white" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
