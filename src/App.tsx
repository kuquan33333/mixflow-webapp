import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useAppStore } from './stores/appStore';
import { AuthScreen } from './components/AuthScreen';
import { Feed } from './components/Feed';
import { Reels } from './components/Reels';
import { CreatePost } from './components/CreatePost';
import { Chat } from './components/Chat';
import { Profile } from './components/Profile';
import { BottomNav } from './components/BottomNav';
import { MiniPlayer } from './components/MiniPlayer';
import { FullPlayer } from './components/FullPlayer';
import { Loader2, Music } from 'lucide-react';

function App() {
  const { initialized, user, init } = useAuthStore();
  const { activeTab, isReelsActive } = useAppStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/30 blur-2xl rounded-full animate-pulse-slow" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Music className="w-8 h-8 text-white" />
            </div>
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'feed':
        return <Feed />;
      case 'reels':
        return <Reels />;
      case 'create':
        return <CreatePost />;
      case 'chat':
        return <Chat />;
      case 'profile':
        return <Profile />;
      default:
        return <Feed />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-0">
      <div className={`max-w-md mx-auto min-h-screen ${isReelsActive ? 'hidden' : 'block'}`}>
        {renderTab()}
      </div>
      {!isReelsActive && activeTab !== 'create' && <BottomNav />}
      <MiniPlayer />
      <FullPlayer />
    </div>
  );
}

export default App;
