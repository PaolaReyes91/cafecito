import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, getMe } from '../services/authService';
import { getCustomerProfile } from '../services/customerAuthService';

const AuthContext = createContext(null);

// Validar estructura de usuario
const isValidUser = (user) => {
  return user && typeof user === 'object' && (user.id || user.email);
};

// Validar token
const isValidToken = (token) => {
  return token && typeof token === 'string' && token.trim().length > 0;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored && stored.trim() ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('user');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!isValidToken(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setLoading(false);
      return;
    }
    
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser.trim()) {
      try {
        const user = JSON.parse(storedUser);
        if (isValidUser(user)) {
          setUser(user);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    
    getMe()
      .then((data) => {
        if (data && isValidUser(data.user)) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          throw new Error('Invalid user data from getMe');
        }
      })
      .catch((error) => {
        console.error('Error fetching user profile:', error);
        getCustomerProfile()
          .then((data) => {
            if (data && isValidUser(data.customer)) {
              setUser(data.customer);
              localStorage.setItem('user', JSON.stringify(data.customer));
            } else {
              throw new Error('Invalid customer data');
            }
          })
          .catch((customerError) => {
            console.error('Error fetching customer profile:', customerError);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          })
          .finally(() => setLoading(false));
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const data = await loginApi(email, password);
      
      if (!data || !data.token || !isValidUser(data.user)) {
        throw new Error('Invalid login response data');
      }

      if (!isValidToken(data.token)) {
        throw new Error('Invalid token received');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
