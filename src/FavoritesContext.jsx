import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const cleanFavs = (data.favorites || []).map(item => String(item).trim());
            setFavorites(cleanFavs);
          } else {
            setFavorites([]);
          }
        } catch (error) {
          console.error("❌ خطأ أثناء قراءة المفضلة:", error);
        }
      } else {
        setFavorites([]);
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleFav = async (scholarshipId) => {
    if (!user) return false;

    const stringId = String(scholarshipId).trim();

    const isExist = favorites.includes(stringId);
    const updatedFavs = isExist
      ? favorites.filter(id => id !== stringId)
      : [...favorites, stringId];

    setFavorites(updatedFavs);

    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { favorites: updatedFavs }, { merge: true });
      return true;
    } catch (error) {
      console.error("❌ فشل تحديث السيرفر:", error);
      setFavorites(favorites);
      return false;
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFav, user, authLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}