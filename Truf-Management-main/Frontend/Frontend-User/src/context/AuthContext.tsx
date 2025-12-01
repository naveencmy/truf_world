import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isEmailVerified: boolean;
}

const initialContext: AuthContextType = {
  currentUser: null,
  loading: true,
  logout: async () => {},
  isEmailVerified: false,
};

const AuthContext = createContext<AuthContextType>(initialContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Check localStorage for user data
  const checkLocalUser = () => {
    try {
      const localUser = localStorage.getItem('user');
      if (localUser) {
        const parsedLocalUser = JSON.parse(localUser);
        if (parsedLocalUser && parsedLocalUser.isAuthenticated) {
          const mockUser: User = {
            uid: parsedLocalUser.phone || 'local-user',
            email: parsedLocalUser.email || null,
            displayName: parsedLocalUser.username || null,
            phoneNumber: parsedLocalUser.phone || null,
          };
          
          setCurrentUser(mockUser);
          setIsEmailVerified(!!parsedLocalUser.email);
          return true;
        }
      }
      setCurrentUser(null);
      setIsEmailVerified(false);
      return false;
    } catch (error) {
      console.error('Error parsing local user data:', error);
      localStorage.removeItem('user');
      setCurrentUser(null);
      setIsEmailVerified(false);
      return false;
    }
  };

  // Initial check for localStorage user data
  useEffect(() => {
    checkLocalUser();
    setLoading(false);
    
    // Listen for storage changes to update auth state
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        checkLocalUser();
      }
    };
    
    // Listen for custom event when user logs in
    const handleUserLogin = () => {
      checkLocalUser();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLogin', handleUserLogin);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogin', handleUserLogin);
    };
  }, []);

  const logout = async () => {
    try {
      // Clear all localStorage data
      localStorage.removeItem('user');
      localStorage.removeItem('emailForSignIn');
      localStorage.removeItem('phoneForSignIn');
      localStorage.removeItem('usernameForSignIn');
      
      // Reset state
      setCurrentUser(null);
      setIsEmailVerified(false);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('userLogout'));
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    currentUser,
    loading,
    logout,
    isEmailVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
