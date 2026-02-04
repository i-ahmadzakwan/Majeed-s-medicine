import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL as BASE_URL } from '@/lib/config';

export interface Medicine {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface CartItem {
  _id: string;
  medicine: Medicine;
  quantity: number;
  price: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  total: number;
}

interface AppContextType {
  isAuthenticated: boolean;
  user: { username: string; role: string } | null;
  login: (username: string, password: string, role: string) => void;
  logout: () => void;
  cart: Cart | null;
  fetchCart: () => Promise<void>;
  addToCart: (medicineId: string) => Promise<void>;
  removeFromCart: (medicineId: string) => Promise<void>;
  updateCartQuantity: (medicineId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: () => Promise<boolean>;
  getCartTotal: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_URL = `${BASE_URL}/api`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState(false);

  // Load auth from localStorage on mount
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('majeed_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        setIsAuthenticated(true);
        setUser(parsed.user);
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    }
  }, []);

  // Fetch cart when user changes
  useEffect(() => {
    if (user && !isLoadingCart) {
      fetchCart();
    } else if (!user) {
      setCart(null);
    }
  }, [user]);

  const login = (username: string, password: string, role: string) => {
    setIsAuthenticated(true);
    const userData = { username, role };
    setUser(userData);
    try {
      localStorage.setItem('majeed_auth', JSON.stringify({ user: userData }));
    } catch (error) {
      console.error('Failed to save auth:', error);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCart(null);
    try {
      localStorage.removeItem('majeed_auth');
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  };

  const fetchCart = async () => {
    if (!user || isLoadingCart) return;
    
    setIsLoadingCart(true);
    try {
      const response = await fetch(`${API_URL}/cart?username=${user.username}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      // Set empty cart on error to prevent crashes
      setCart({ 
        _id: '', 
        user: user.username, 
        items: [], 
        total: 0 
      });
    } finally {
      setIsLoadingCart(false);
    }
  };

  const addToCart = async (medicineId: string) => {
    if (!user) {
      alert('Please login first');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, medicineId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add to cart');
      }
      
      const data = await response.json();
      setCart(data);
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      alert(error.message || 'Failed to add to cart');
    }
  };

  const removeFromCart = async (medicineId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/cart/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, medicineId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  const updateCartQuantity = async (medicineId: string, quantity: number) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/cart/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: user.username, 
          medicineId, 
          quantity 
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Failed to update cart quantity:', error);
      alert('Failed to update quantity');
    }
  };

  const clearCart = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/cart/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const checkout = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(`${API_URL}/cart/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      });
      
      if (response.ok) {
        setCart({ 
          _id: cart?._id || '', 
          user: user.username, 
          items: [], 
          total: 0 
        });
        return true;
      } else {
        const error = await response.json();
        alert(error.message || 'Checkout failed');
        return false;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to connect to server');
      return false;
    }
  };

  const getCartTotal = () => {
    return cart?.total || 0;
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        cart,
        fetchCart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        checkout,
        getCartTotal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}