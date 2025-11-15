import { create } from 'zustand';
import { authAPI } from './api-client';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  loadAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        set({
          token,
          user: JSON.parse(userStr),
          isAuthenticated: true,
        });
      }
    }
  },

  login: async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    const { accessToken, user } = response.data;

    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
    }

    set({
      token: accessToken,
      user,
      isAuthenticated: true,
    });
  },

  register: async (email: string, password: string) => {
    const response = await authAPI.register(email, password);
    const { accessToken, user } = response.data;

    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
    }

    set({
      token: accessToken,
      user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }

    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));

