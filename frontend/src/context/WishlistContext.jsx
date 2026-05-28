import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('jawhara-wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('jawhara-wishlist', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product) => setItems(prev =>
    prev.find(i => i._id === product._id) ? prev : [...prev, product]
  ), []);
  const removeItem = useCallback((id) => setItems(prev => prev.filter(i => i._id !== id)), []);
  const toggle = useCallback((product) => setItems(prev =>
    prev.find(i => i._id === product._id)
      ? prev.filter(i => i._id !== product._id)
      : [...prev, product]
  ), []);
  const isWishlisted = useCallback((id) => items.some(i => i._id === id), [items]);

  const contextValue = useMemo(() => ({
    items, addItem, removeItem, toggle, isWishlisted, totalItems: items.length,
  }), [items, addItem, removeItem, toggle, isWishlisted]);

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
