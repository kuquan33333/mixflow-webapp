import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Music2, Search, Loader2, Camera, Film, Check, Play, Pause } from 'lucide-react';
import type { MusicTrack } from '../lib/types';
import { searchMusic, createPost, uploadFile } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { audioManager } from '../lib/audio';
import { isVideo, extractHashtags } from '../lib/utils';

export function CreatePost() {
  const { user } = useAuthStore();
  const { setActiveTab } = useAppStore();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [postType, setPostType] = useState<'post' | 'reel'>('post');
  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [musicStart, setMusicStart] = useState(0);
  const [musicEnd, setMusicEnd] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    if (selected.length > 10) {
      setError('Maximum 10 files allowed');
      return;
    }
    const valid = selected.filter((f) => {
      const isImg = f.type.match(/image\/(jpeg|png|webp)/);
      const isVid = f.type.match(/video\/(mp4|webm)/);
      if (isImg && f.size > 10 * 1024 * 1024) {
        setError('Images must be under 10MB');
        return false;
      }
      if (isVid && f.size > 100 * 1024 * 1024) {
        setError('Videos must be under 100MB');
        return false;
      }
      if (!isImg && !isVid) {
        setError('Only jpg, png, webp, mp4 files allowed');
        return false;
      }
      return true;
    });

    setFiles(valid);
    setError('');
    const urls = valid.map((f) => URL.createObjectURL(f));
    setPreviews(urls);

    const hasVideo = valid.some((f) => f.type.startsWith('video/'));
    if (hasVideo && valid.length === 1) {
      setPostType('reel');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchMusic(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectTrack = (track: MusicTrack) => {
    setSelectedTrack(track);
    setMusicStart(0);
    setMusicEnd(Math.min(30, track.duration));
    setShowMusicSearch(false);
  };

  const playPreview = () => {
    if (!selectedTrack) return;
    if (previewPlaying) {
      audioManager.stopPreview();
      audioManager.resumeAfterInterrupt();
      setPreviewPlaying(false);
    } else {
      audioManager.playPreview(selectedTrack, musicStart, musicEnd, () => {
        setPreviewPlaying(false);
        audioManager.resumeAfterInterrupt();
      });
      setPreviewPlaying(true);
    }
  };

  const handlePost = async () => {
    if (files.length === 0) {
      setError('Please add at least one media file');
      return;
    }
    if (!user) return;

    setPosting(true);
    setError('');
    try {
      const mediaUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const url = await uploadFile(file, 'media', path);
        mediaUrls.push(url);
      }

      const hashtags = extractHashtags(caption);

      await createPost({
        media_urls: mediaUrls,
        caption,
        hashtags,
        music_id: selectedTrack?.id || null,
        music_start: selectedTrack ? musicStart : 0,
        music_end: selectedTrack ? musicEnd : 0,
        type: postType,
      });

      audioManager.stopPreview();
      setFiles([]);
      setPreviews([]);
      setCaption('');
      setSelectedTrack(null);
      setActiveTab('feed');
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-full pb-24">
      <div className="sticky top-0 z-20 glass-strong px-4 py-3 flex items-center justify-between">
        <button onClick={() => setActiveTab('feed')} className="text-white/60 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <h1 className="font-display text-lg font-bold">New Post</h1>
        <button
          onClick={handlePost}
          disabled={posting || files.length === 0}
          className="bg-primary-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50 hover:bg-primary-500 transition-colors"
        >
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Share'}
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {error && (
          <div className="text-error-400 text-sm bg-error-500/10 border border-error-500/20 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        {previews.length === 0 ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square card flex flex-col items-center justify-center gap-3 hover:bg-surface-100 transition-colors"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center">
              <Camera className="w-8 h-8 text-white/40" />
            </div>
            <p className="text-white/50 text-sm">Tap to add photos or videos</p>
            <p className="text-white/30 text-xs">Up to 10 files · jpg, png, webp, mp4</p>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
            {previews.map((url, i) => (
              <div key={i} className="relative aspect-square">
                {isVideo(url) ? (
                  <video src={url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                )}
                {isVideo(url) && (
                  <div className="absolute top-1 right-1 bg-black/60 rounded-full p-1">
                    <Film className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square card flex items-center justify-center hover:bg-surface-100 transition-colors"
            >
              <ImageIcon className="w-6 h-6 text-white/40" />
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {files.length > 0 && files.some((f) => f.type.startsWith('video/')) && (
          <div className="flex gap-2 p-1 bg-surface-100 rounded-xl">
            <button
              onClick={() => setPostType('post')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                postType === 'post' ? 'bg-primary-600 text-white' : 'text-white/50'
              }`}
            >
              Post
            </button>
            <button
              onClick={() => setPostType('reel')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                postType === 'reel' ? 'bg-primary-600 text-white' : 'text-white/50'
              }`}
            >
              Reel
            </button>
          </div>
        )}

        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          className="input-field resize-none"
        />

        <div>
          <button
            onClick={() => setShowMusicSearch(true)}
            className="w-full glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              {selectedTrack ? (
                <>
                  <p className="text-sm font-semibold text-white truncate">{selectedTrack.title}</p>
                  <p className="text-xs text-white/50 truncate">{selectedTrack.artist}</p>
                </>
              ) : (
                <p className="text-sm text-white/60">Attach music (optional)</p>
              )}
            </div>
            {selectedTrack && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playPreview();
                }}
                className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center"
              >
                {previewPlaying ? (
                  <Pause className="w-4 h-4 text-white" fill="currentColor" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                )}
              </button>
            )}
          </button>

          {selectedTrack && (
            <div className="mt-3 px-4 py-3 glass rounded-xl">
              <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                <span>Start: {musicStart}s</span>
                <span>End: {musicEnd}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={selectedTrack.duration}
                value={musicStart}
                onChange={(e) => setMusicStart(Math.min(Number(e.target.value), musicEnd - 1))}
                className="w-full accent-primary-500"
              />
              <input
                type="range"
                min={musicStart + 1}
                max={selectedTrack.duration}
                value={musicEnd}
                onChange={(e) => setMusicEnd(Number(e.target.value))}
                className="w-full accent-primary-500 mt-1"
              />
              <p className="text-xs text-white/40 mt-1">Max 30 seconds · {musicEnd - musicStart}s clip</p>
            </div>
          )}
        </div>
      </div>

      {showMusicSearch && (
        <div className="fixed inset-0 z-50 bg-surface-0 animate-slide-up flex flex-col">
          <div className="glass-strong px-4 py-3 flex items-center gap-3">
            <button onClick={() => setShowMusicSearch(false)} className="text-white/60">
              <X className="w-6 h-6" />
            </button>
            <h2 className="font-display text-lg font-bold flex-1">Search Music</h2>
          </div>
          <div className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="text"
                  placeholder="Search songs, artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input-field pl-12"
                  autoFocus
                />
              </div>
              <button onClick={handleSearch} className="btn-primary px-4">
                {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Go'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {searchResults.map((track) => (
              <button
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                className={`w-full glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-colors ${
                  selectedTrack?.id === track.id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <img src={track.cover_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                  <p className="text-xs text-white/50 truncate">{track.artist} · {track.duration}s</p>
                </div>
                {selectedTrack?.id === track.id && (
                  <Check className="w-5 h-5 text-primary-400" />
                )}
              </button>
            ))}
            {searchResults.length === 0 && !searching && (
              <p className="text-center text-white/30 text-sm py-8">
                Search for music to attach to your post
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
