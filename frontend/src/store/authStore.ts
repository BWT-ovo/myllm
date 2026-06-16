import { create } from 'zustand';
import { getUser, setUser } from '../api/storage';

interface AuthState {
  user: { username: string } | null;
  isAuthenticated: boolean;
  login: (username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getUser(),
  isAuthenticated: !!getUser(),

  login: (username: string) => {
    const u = { username };
    setUser(u);
    set({ user: u, isAuthenticated: true });
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
