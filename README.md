# MixFlow WebApp

Social media meets music. Share posts, watch reels, and listen together.

## Tech Stack

- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** - custom dark theme with gradient accents
- **Howler.js** - audio engine with singleton AudioManager
- **Zustand** - state management
- **Supabase** - PostgreSQL database, auth, storage, RLS policies

## Features

### Audio Engine
- Mini Player with continuous background music playback
- Full Player with album art, seek bar, and controls
- AudioManager singleton (Howler.js) with play/pause/resume/stop
- Music preview clips for post attachments (start/end trimming)
- Audio interruption handling: pauses background music during Reels playback, resumes after

### Feed
- Timeline of posts (images/videos) with cursor-based pagination
- Music attachment playback on each post
- Like, bookmark, and share interactions
- Hashtag support

### Reels
- Full-screen vertical video mode with snap scrolling
- Auto-play active video, pause inactive
- Audio interruption: pauses background music, resumes on exit
- Like and bookmark from Reels view

### Create Post
- Upload up to 10 media files (images/videos)
- Caption with automatic hashtag extraction
- Music search and attachment with clip trimming (max 30s)
- Post type selection (post or reel)

### Chat
- 1-on-1 conversations with user search
- Send text, images, and music cards
- Music preview playback in chat (pauses background music)
- Conversation list with unread indicators
- Polling-based message updates

### Profile
- Avatar, cover, bio, and follow stats
- Post grid with tabs: All Posts, Reels, Saved, Playlist
- Personal playlist from music used in posts
- Edit profile (display name, bio)
- Follow/unfollow other users

### Auth
- Email/password authentication via Supabase Auth
- Auto profile creation on signup
- Session persistence

## Database Schema

Tables: `profiles`, `posts`, `music_tracks`, `messages`, `likes`, `bookmarks`, `follows`

All tables have Row Level Security (RLS) enabled with ownership-based policies.

## Getting Started

```bash
npm install
npm run dev
```

Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
