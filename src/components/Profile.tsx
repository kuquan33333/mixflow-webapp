import { useState, useEffect } from 'react';
import {
  Settings, Grid3x3, Film, Bookmark, Music2, Play, Pause, ChevronLeft, Loader2, Edit3, Check, X
} from 'lucide-react';
import type { Post, MusicTrack, Profile } from '../lib/types';
import {
  fetchProfile, fetchUserPosts, fetchBookmarkedPosts, fetchUserPlaylist,
  fetchFollowStats, toggleFollow, isFollowing, updateProfile
} from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { audioManager } from '../lib/audio';
import { getAvatarUrl, isVideo, formatCount } from '../lib/utils';

type Tab = 'all' | 'reels' | 'saved' | 'playlist';

export function Profile() {
  const { user, signOut, refreshProfile } = useAuthStore();
  const { viewingProfileId, setViewingProfileId, setActiveTab } = useAppStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const isOwnProfile = !viewingProfileId || viewingProfileId === user?.id;
  const targetUserId = viewingProfileId || user?.id;

  useEffect(() => {
    if (!targetUserId) return;
    setLoading(true);
    (async () => {
      try {
        const p = await fetchProfile(targetUserId);
        setProfile(p);
        if (p) {
          setEditDisplayName(p.display_name);
          setEditBio(p.bio);
        }
        const stats = await fetchFollowStats(targetUserId);
        setFollowStats(stats);
        if (!isOwnProfile && user) {
          const following = await isFollowing(user.id, targetUserId);
          setIsFollowingUser(following);
        }
        if (tab === 'all') {
          const psts = await fetchUserPosts(targetUserId);
          setPosts(psts);
        } else if (tab === 'reels') {
          const psts = await fetchUserPosts(targetUserId, 'reel');
          setPosts(psts);
        } else if (tab === 'saved') {
          const psts = await fetchBookmarkedPosts(targetUserId);
          setPosts(psts);
        } else if (tab === 'playlist') {
          const tracks = await fetchUserPlaylist(targetUserId);
          setPlaylist(tracks);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [targetUserId, tab, isOwnProfile, user]);

  const handleFollow = async () => {
    if (!user || !targetUserId) return;
    const newFollowing = !isFollowingUser;
    setIsFollowingUser(newFollowing);
    setFollowStats((s) => ({
      ...s,
      followers: newFollowing ? s.followers + 1 : s.followers - 1,
    }));
    try {
      await toggleFollow(user.id, targetUserId);
    } catch {
      setIsFollowingUser(!newFollowing);
    }
  };

  const handlePlayTrack = (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      audioManager.togglePlayPause();
      setPlayingTrackId(null);
    } else {
      audioManager.play(track);
      setPlayingTrackId(track.id);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateProfile({ id: user.id, display_name: editDisplayName, bio: editBio });
      await refreshProfile();
      setProfile((p) => p ? { ...p, display_name: editDisplayName, bio: editBio } : p);
      setEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-white/50">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24">
      <div className="relative h-40 bg-surface-100">
        {profile.cover_url && (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        )}
        {!isOwnProfile && (
          <button
            onClick={() => { setViewingProfileId(null); setActiveTab('feed'); }}
            className="absolute top-4 left-4 w-10 h-10 rounded-full glass-strong flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        {isOwnProfile && (
          <button
            onClick={() => setEditing(true)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full glass-strong flex items-center justify-center"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      <div className="px-4 -mt-12 relative">
        <img
          src={getAvatarUrl(profile.avatar_url)}
          alt=""
          className="w-24 h-24 rounded-full object-cover ring-4 ring-surface-0"
        />

        <div className="mt-3">
          <h1 className="font-display text-2xl font-bold text-white">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-white/50 text-sm">@{profile.username}</p>
          {profile.bio && <p className="text-white/80 text-sm mt-2">{profile.bio}</p>}
        </div>

        <div className="flex gap-6 mt-4">
          <div>
            <p className="font-bold text-white text-lg">{formatCount(followStats.followers)}</p>
            <p className="text-white/40 text-xs">Followers</p>
          </div>
          <div>
            <p className="font-bold text-white text-lg">{formatCount(followStats.following)}</p>
            <p className="text-white/40 text-xs">Following</p>
          </div>
          <div>
            <p className="font-bold text-white text-lg">{posts.length}</p>
            <p className="text-white/40 text-xs">Posts</p>
          </div>
        </div>

        <div className="mt-4">
          {isOwnProfile ? (
            <button
              onClick={() => setEditing(true)}
              className="w-full glass rounded-xl py-2.5 text-sm font-semibold text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          ) : (
            <button
              onClick={handleFollow}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                isFollowingUser
                  ? 'glass text-white hover:bg-error-500/20 hover:text-error-400'
                  : 'bg-primary-600 text-white hover:bg-primary-500'
              }`}
            >
              {isFollowingUser ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <div className="flex gap-1 mt-6 border-b border-white/5">
          {([
            { key: 'all', label: 'Posts', icon: Grid3x3 },
            { key: 'reels', label: 'Reels', icon: Film },
            ...(isOwnProfile ? [{ key: 'saved' as Tab, label: 'Saved', icon: Bookmark }] : []),
            { key: 'playlist', label: 'Playlist', icon: Music2 },
          ] as { key: Tab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-colors ${
                tab === key ? 'border-primary-500 text-white' : 'border-transparent text-white/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === 'playlist' ? (
            <div className="space-y-2">
              {playlist.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-8">No tracks in playlist</p>
              ) : (
                playlist.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handlePlayTrack(track)}
                    className="w-full glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="relative">
                      <img src={track.cover_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                        {playingTrackId === track.id ? (
                          <Pause className="w-5 h-5 text-white" fill="currentColor" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                      <p className="text-xs text-white/50 truncate">{track.artist}</p>
                    </div>
                    <span className="text-xs text-white/30">{track.duration}s</span>
                  </button>
                ))
              )}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-8">
              {tab === 'reels' ? 'No reels yet' : tab === 'saved' ? 'No saved posts' : 'No posts yet'}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div key={post.id} className="relative aspect-square rounded-lg overflow-hidden bg-surface-100">
                  {post.media_urls[0] && (
                    isVideo(post.media_urls[0]) ? (
                      <video src={post.media_urls[0]} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={post.media_urls[0]} alt="" className="w-full h-full object-cover" />
                    )
                  )}
                  {post.music_tracks && (
                    <div className="absolute bottom-1 right-1">
                      <Music2 className="w-3.5 h-3.5 text-white drop-shadow-lg" />
                    </div>
                  )}
                  {isVideo(post.media_urls[0] || '') && (
                    <div className="absolute top-1 right-1">
                      <Film className="w-3.5 h-3.5 text-white drop-shadow-lg" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-surface-0/90 backdrop-blur-md flex items-center justify-center px-6">
          <div className="card p-6 w-full max-w-sm animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Edit Profile</h2>
              <button onClick={() => setEditing(false)} className="text-white/40">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Display Name</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <button onClick={handleSaveProfile} className="btn-primary w-full flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Save
              </button>
              <button
                onClick={() => signOut()}
                className="w-full text-error-400 text-sm font-medium py-2 hover:bg-error-500/10 rounded-xl transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
