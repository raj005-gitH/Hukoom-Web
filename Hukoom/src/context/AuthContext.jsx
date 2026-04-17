import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'user' or 'hero'

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("hukoom_user");
      const savedRole = localStorage.getItem("hukoom_role");
      if (savedUser && savedRole) {
        setUser(JSON.parse(savedUser));
        setRole(savedRole);
      }
    } catch {
      localStorage.removeItem("hukoom_user");
      localStorage.removeItem("hukoom_role");
    }
  }, []);

  const login = (userData, userRole) => {
    setUser(userData);
    setRole(userRole);
    localStorage.setItem("hukoom_user", JSON.stringify(userData));
    localStorage.setItem("hukoom_role", userRole);
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem("hukoom_user");
    localStorage.removeItem("hukoom_role");
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
