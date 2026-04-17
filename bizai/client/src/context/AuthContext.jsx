import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('bizai_token');
    const savedUser  = localStorage.getItem('bizai_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // login(formData, isRegister) — calls API directly
  const login = async (formData, isRegister = false) => {
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const { data } = await API.post(endpoint, formData);
    if (!data.success) throw new Error(data.message || 'Auth failed');
    const { token: tk, user: u } = data.data;
    setUser(u);
    setToken(tk);
    localStorage.setItem('bizai_token', tk);
    localStorage.setItem('bizai_user', JSON.stringify(u));
    return u;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bizai_token');
    localStorage.removeItem('bizai_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
