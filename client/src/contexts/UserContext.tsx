import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  is_admin: boolean;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: boolean;
  isGuest: boolean;
  setGuestMode: (isGuest: boolean) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize guest state from localStorage immediately
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    const storedGuestMode = localStorage.getItem('guestMode');
    return storedGuestMode ? JSON.parse(storedGuestMode) : false;
  });
  
  const [user, setUser] = useState<User | null>(() => {
    // Don't load user if we're in guest mode
    const storedGuestMode = localStorage.getItem('guestMode');
    if (storedGuestMode && JSON.parse(storedGuestMode)) {
      return null;
    }
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    // This useEffect is now mainly for cleanup since we initialize from localStorage
    console.log('UserContext loaded - isGuest:', isGuest, 'user:', user);
  }, [isGuest, user]);

  const logout = () => {
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('guestMode');
  };

  const setGuestMode = (guestMode: boolean) => {
    console.log('Setting guest mode to:', guestMode);
    setIsGuest(guestMode);
    localStorage.setItem('guestMode', JSON.stringify(guestMode));
    console.log('Guest mode set in localStorage:', localStorage.getItem('guestMode'));
    
    if (guestMode) {
      // Clear user data when entering guest mode
      console.log('Clearing user data for guest mode');
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  // Custom setUser that logs in development
  const customSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      // Exit guest mode when user logs in
      setIsGuest(false);
      localStorage.removeItem('guestMode');
    }
  };

  const isAdmin = user?.is_admin || false;

  return (
    <UserContext.Provider value={{ user, setUser: customSetUser, isAdmin, isGuest, setGuestMode, logout }}>
      {children}
    </UserContext.Provider>
  );
};
