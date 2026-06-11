import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [role, setRole]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate session from storage on app start
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('hukoom_session');
        if (stored) {
          const { user: u, role: r } = JSON.parse(stored);
          setUser(u);
          setRole(r);
        }
      } catch (_) {}
      finally { setIsLoading(false); }
    })();
  }, []);

  const login = async (userData, userRole) => {
    setUser(userData);
    setRole(userRole);
    await AsyncStorage.setItem(
      'hukoom_session',
      JSON.stringify({ user: userData, role: userRole })
    );
  };

  const logout = async () => {
    setUser(null);
    setRole(null);
    await AsyncStorage.removeItem('hukoom_session');
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
