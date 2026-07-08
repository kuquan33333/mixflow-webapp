import { Home, Film, Plus, MessageCircle, User } from 'lucide-react';
import { useAppStore, type Tab } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { getAvatarUrl } from '../lib/utils';

export function BottomNav() {
  const { activeTab, setActiveTab } = useAppStore();
  const { profile } = useAuthStore();

  const tabs: { key: Tab; icon: any; label: string }[] = [
    { key: 'feed', icon: Home, label: 'Home' },
    { key: 'reels', icon: Film, label: 'Reels' },
    { key: 'create', icon: Plus, label: 'Create' },
    { key: 'chat', icon: MessageCircle, label: 'Chat' },
    { key: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-white/5">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {tabs.map(({ key, icon: Icon, label }) => {
          const isActive = activeTab === key;
          if (key === 'create') {
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="nav-item"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30 hover:scale-105 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </button>
            );
          }
          if (key === 'profile') {
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="nav-item"
              >
                <div className={`w-7 h-7 rounded-full overflow-hidden ring-2 transition-all ${
                  isActive ? 'ring-primary-500' : 'ring-transparent'
                }`}>
                  <img
                    src={getAvatarUrl(profile?.avatar_url)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-[10px] ${isActive ? 'text-primary-400' : 'text-white/40'}`}>{label}</span>
              </button>
            );
          }
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="nav-item"
            >
              <Icon
                className={`w-6 h-6 transition-colors ${isActive ? 'text-primary-400' : 'text-white/40'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] ${isActive ? 'text-primary-400' : 'text-white/40'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
