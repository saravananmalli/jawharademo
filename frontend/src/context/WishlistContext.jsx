import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('jawhara-wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('jawhara-wishlist', JSON.stringify(items));
  }, [items]);

  const addItem = (product) => setItems(prev =>
    prev.find(i => i._id === product._id) ? prev : [...prev, product]
  );
  const removeItem = (id) => setItems(prev => prev.filter(i => i._id !== id));
  const toggle = (product) => {
    if (items.find(i => i._id === product._id)) removeItem(product._id);
    else addItem(product);
  };
  const isWishlisted = (id) => items.some(i => i._id === id);

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, toggle, isWishlisted, totalItems: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
