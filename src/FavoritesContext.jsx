import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

const FavoritesContext = createContext();

const getStorageKey = (uid) => `favorites_${uid}`;

const loadLocal = (uid) => {
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocal = (uid, favs) => {
  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(favs));
  } catch {}
};

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

      setAuthLoading(false);
      setUser(currentUser);

      if (!currentUser) {
        // مسح المفضلة عند الخروج
        setFavorites([]);
        return;
      }

      const localFavs = loadLocal(currentUser.uid);
      if (localFavs.length > 0) {
        setFavorites(localFavs);
      }

      // زامن مع Firestore في الخلفية
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (cancelled) return;

        if (docSnap.exists()) {
          const data = docSnap.data();
          const serverFavs = Array.isArray(data.favorites)
            ? data.favorites.map(item => String(item).trim()).filter(Boolean)
            : [];
          setFavorites(serverFavs);
          saveLocal(currentUser.uid, serverFavs);
        }
      } catch (error) {
        console.warn('Firestore غير متاح، نستخدم البيانات المحلية:', error);
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
    saveLocal(user.uid, updatedFavs);

    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { favorites: updatedFavs }, { merge: true });
      return true;
    } catch (error) {
      console.error('فشل تحديث Firestore:', error);
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