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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      const fetchFavorites = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFavorites((data.favorites || []).map(f => String(f)));
          } else {
            // أنشئ document تلقائياً لو ما كان موجود
            await setDoc(docRef, { favorites: [] }, { merge: true });
            setFavorites([]);
          }
        } catch (error) {
          console.error("خطأ في جلب المفضلة:", error);
        }
      };
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user, authLoading]);

  const toggleFav = async (id) => {
    if (!user) return false;

    const strId = String(id);
    const newFavs = favorites.includes(strId)
      ? favorites.filter(f => f !== strId)
      : [...favorites, strId];

    setFavorites(newFavs);

    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { favorites: newFavs }, { merge: true });
      console.log("✅ تم حفظ المفضلة");
    } catch (error) {
      console.error("❌ خطأ في حفظ المفضلة:", error);
      // أرجع الحالة القديمة لو فشل الحفظ
      setFavorites(favorites);
    }
    return true;
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