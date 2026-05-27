import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, appCheckReady } from './firebase-config';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const favoritesRef = useRef([]);

  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (cancelled) return;

      setUser(currentUser);
      setAuthLoading(false);

      if (!currentUser) {
        setFavorites([]);
        return;
      }

      try {
        await Promise.race([
          appCheckReady,
          new Promise(resolve => setTimeout(resolve, 3000))
        ]);

        if (cancelled) return;

        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (cancelled) return;

        if (docSnap.exists()) {
          const data = docSnap.data();
          const cleanFavs = Array.isArray(data.favorites)
            ? data.favorites.map(item => String(item).trim()).filter(Boolean)
            : [];
          setFavorites(cleanFavs);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('❌ خطأ في جلب المفضلة:', error);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const toggleFav = async (scholarshipId) => {
    if (!user?.uid) return false;

    const stringId = String(scholarshipId).trim();
    if (!stringId) return false;

    const currentFavs = favoritesRef.current;
    const isExist = currentFavs.includes(stringId);
    const updatedFavs = isExist
      ? currentFavs.filter(id => id !== stringId)
      : [...currentFavs, stringId];

    setFavorites(updatedFavs);

    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { favorites: updatedFavs }, { merge: true });
      return true;
    } catch (error) {
      console.error('❌ فشل تحديث السيرفر:', error);
      setFavorites(currentFavs);
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