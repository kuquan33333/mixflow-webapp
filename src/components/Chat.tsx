import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, Send, Search, Music2, Play, Pause, X, Image as ImageIcon, Loader2, MessageSquare
} from 'lucide-react';
import type { Conversation, Message, MusicTrack, Profile, MessageContent } from '../lib/types';
import {
  fetchConversations, fetchMessages, sendMessage, markMessagesRead,
  searchMusic, searchUsers, fetchMusicById, uploadFile
} from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { audioManager } from '../lib/audio';
import { getAvatarUrl, timeAgo } from '../lib/utils';

export function Chat() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [musicResults, setMusicResults] = useState<MusicTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout>();

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const convs = await fetchConversations(user.id);
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMessages = useCallback(async (otherUser: Profile) => {
    if (!user) return;
    try {
      const msgs = await fetchMessages(otherUser.id, user.id);
      setMessages(msgs);
      await markMessagesRead(otherUser.id, user.id);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
    pollRef.current = setInterval(loadConversations, 5000);
    return () => clearInterval(pollRef.current);
  }, [loadConversations]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
      const interval = setInterval(() => loadMessages(activeChat), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content?: MessageContent) => {
    if (!activeChat || !user) return;
    const msgContent = content || { text: input };
    if (!msgContent.text && !msgContent.music_id && !msgContent.media_url) return;

    setSending(true);
    setInput('');
    try {
      const msg = await sendMessage(activeChat.id, msgContent);
      setMessages((prev) => [...prev, msg]);
      loadConversations();
    } catch (err: any) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results.filter((u) => u.id !== user?.id));
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchMusic = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchMusic(searchQuery);
      setMusicResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSendMusic = async (track: MusicTrack) => {
    await handleSend({ music_id: track.id, preview_url: track.url, text: '' });
    setShowMusicPicker(false);
    setSearchQuery('');
    setMusicResults([]);
  };

  const handleSendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeChat) return;
    setSending(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/chat/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const url = await uploadFile(file, 'media', path);
      await handleSend({ media_url: url, media_type: 'image', text: '' });
    } catch (err: any) {
      console.error('Failed to upload:', err);
    } finally {
      setSending(false);
    }
  };

  const playMusicPreview = async (msg: Message) => {
    if (!msg.content.music_id) return;
    if (previewingId === msg.id) {
      audioManager.stopPreview();
      audioManager.resumeAfterInterrupt();
      setPreviewingId(null);
      return;
    }
    const track = await fetchMusicById(msg.content.music_id);
    if (!track) return;
    audioManager.playPreview(track, 0, track.duration, () => {
      setPreviewingId(null);
      audioManager.resumeAfterInterrupt();
    });
    setPreviewingId(msg.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (activeChat) {
    return (
      <div className="flex flex-col h-full">
        <div className="glass-strong px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setActiveChat(null)} className="text-white/60 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <img src={getAvatarUrl(activeChat.avatar_url)} alt="" className="w-9 h-9 rounded-full object-cover" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-white">{activeChat.display_name || activeChat.username}</p>
            <p className="text-xs text-white/40">@{activeChat.username}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MessageSquare className="w-12 h-12 text-white/20 mb-3" />
              <p className="text-white/40 text-sm">Start a conversation</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMe ? 'bg-primary-600 text-white' : 'glass text-white'
                  }`}
                >
                  {msg.content.text && (
                    <p className="text-sm whitespace-pre-wrap">{msg.content.text}</p>
                  )}
                  {msg.content.media_url && msg.content.media_type === 'image' && (
                    <img src={msg.content.media_url} alt="" className="rounded-xl max-w-full mt-1" />
                  )}
                  {msg.content.music_id && (
                    <MusicPreviewCard
                      musicId={msg.content.music_id}
                      isPlaying={previewingId === msg.id}
                      onPlay={() => playMusicPreview(msg)}
                    />
                  )}
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-white/30'}`}>
                    {timeAgo(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="glass-strong px-3 py-3 flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-full bg-surface-100 flex items-center justify-center text-white/60 hover:text-white"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleSendImage} className="hidden" />
          <button
            onClick={() => setShowMusicPicker(true)}
            className="w-9 h-9 rounded-full bg-surface-100 flex items-center justify-center text-white/60 hover:text-white"
          >
            <Music2 className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-surface-100 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary-500/50"
          />
          <button
            onClick={() => handleSend()}
            disabled={sending || !input.trim()}
            className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>

        {showMusicPicker && (
          <div className="fixed inset-0 z-50 bg-surface-0 animate-slide-up flex flex-col">
            <div className="glass-strong px-4 py-3 flex items-center gap-3">
              <button onClick={() => setShowMusicPicker(false)} className="text-white/60">
                <X className="w-6 h-6" />
              </button>
              <h2 className="font-display text-lg font-bold flex-1">Share Music</h2>
            </div>
            <div className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search songs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchMusic()}
                    className="input-field pl-12"
                    autoFocus
                  />
                </div>
                <button onClick={handleSearchMusic} className="btn-primary px-4">
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Go'}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {musicResults.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSendMusic(track)}
                  className="w-full glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                >
                  <img src={track.cover_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                    <p className="text-xs text-white/50 truncate">{track.artist}</p>
                  </div>
                  <Send className="w-5 h-5 text-primary-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="glass-strong px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <h1 className="font-display text-xl font-bold">Messages</h1>
        <button
          onClick={() => setShowNewChat(true)}
          className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center"
        >
          <Search className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <MessageSquare className="w-12 h-12 text-white/20 mb-3" />
            <p className="text-white/40 text-sm mb-4">No conversations yet</p>
            <button onClick={() => setShowNewChat(true)} className="btn-primary text-sm">
              Start a chat
            </button>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.user.id}
              onClick={() => setActiveChat(conv.user)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="relative">
                <img src={getAvatarUrl(conv.user.avatar_url)} alt="" className="w-12 h-12 rounded-full object-cover" />
                {conv.unread_count > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-error-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {conv.unread_count}
                  </div>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-sm text-white">{conv.user.display_name || conv.user.username}</p>
                <p className="text-xs text-white/40 truncate">
                  {conv.last_message?.content?.text || (conv.last_message?.content?.music_id ? 'Shared a song' : '') || 'No messages'}
                </p>
              </div>
              {conv.last_message && (
                <span className="text-xs text-white/30">{timeAgo(conv.last_message.created_at)}</span>
              )}
            </button>
          ))
        )}
      </div>

      {showNewChat && (
        <div className="fixed inset-0 z-50 bg-surface-0 animate-slide-up flex flex-col">
          <div className="glass-strong px-4 py-3 flex items-center gap-3">
            <button onClick={() => setShowNewChat(false)} className="text-white/60">
              <X className="w-6 h-6" />
            </button>
            <h2 className="font-display text-lg font-bold flex-1">New Chat</h2>
          </div>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                className="input-field pl-12"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {searchResults.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setActiveChat(u);
                  setShowNewChat(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-full glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
              >
                <img src={getAvatarUrl(u.avatar_url)} alt="" className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">{u.display_name || u.username}</p>
                  <p className="text-xs text-white/50">@{u.username}</p>
                </div>
              </button>
            ))}
            {searchResults.length === 0 && !searching && searchQuery && (
              <p className="text-center text-white/30 text-sm py-8">No users found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MusicPreviewCard({ musicId, isPlaying, onPlay }: { musicId: string; isPlaying: boolean; onPlay: () => void }) {
  const [track, setTrack] = useState<MusicTrack | null>(null);

  useEffect(() => {
    fetchMusicById(musicId).then(setTrack).catch(console.error);
  }, [musicId]);

  if (!track) return <div className="w-32 h-12 bg-white/10 rounded-lg animate-pulse" />;

  return (
    <div className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-black/20">
      <img src={track.cover_url} alt="" className="w-10 h-10 rounded object-cover" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{track.title}</p>
        <p className="text-[10px] opacity-60 truncate">{track.artist}</p>
      </div>
      <button onClick={onPlay} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
        {isPlaying ? <Pause className="w-3.5 h-3.5" fill="currentColor" /> : <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />}
      </button>
    </div>
  );
}
