import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const favoritesRef = useRef([]);

  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        let attempts = 0;
        const tryFetch = async () => {
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
            attempts++;
            if (attempts < 5) {
              setTimeout(tryFetch, 1000);
            } else {
              console.error("❌ فشل بعد 5 محاولات:", error);
            }
          }
        };
        tryFetch();
      } else {
        setFavorites([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleFav = async (scholarshipId) => {
    if (!user) return false;

    const stringId = String(scholarshipId).trim();
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
      console.error("❌ فشل تحديث السيرفر:", error);
      setFavorites(currentFavs);
      return false;
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFav, user }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}