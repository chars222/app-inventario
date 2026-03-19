import React, { createContext, useContext, useState, useEffect } from 'react';

// Tipos de datos
interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  businessId: number;
  businessName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al iniciar la app, revisamos si ya había una sesión guardada
  useEffect(() => {
    const t = localStorage.getItem('central_token');
    const u = localStorage.getItem('central_user');
    if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, newToken: string) => {
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('central_user', JSON.stringify(userData));
    localStorage.setItem('central_token', newToken); // Guardamos token
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('central_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar la sesión en cualquier lado fácil
export const useAuth = () => useContext(AuthContext);