import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config'; // تأكد من المسار حسب مشروعك

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);

  // مراقبة الجلسة وجلب البيانات بهدوء في الخلفية بدون ما نوقف الموقع
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // السر هنا: trim() تمسح أي مسافات مخفية تسبب مشاكل في ثبات القلب
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
    });

    return () => unsubscribe();
  }, []);

  const toggleFav = async (scholarshipId) => {
    if (!user) return false;

    // توحيد الصيغة ومسح المسافات
    const stringId = String(scholarshipId).trim();
    let updatedFavs = [];

    // التحديث محلياً فوراً عشان يتجاوب الزر بلمح البصر
    setFavorites((currentFavs) => {
      const isExist = currentFavs.includes(stringId);
      updatedFavs = isExist 
        ? currentFavs.filter(id => id !== stringId)
        : [...currentFavs, stringId];
      return updatedFavs;
    });

    // الرفع للفايربيس في الخلفية
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { favorites: updatedFavs }, { merge: true });
      return true;
    } catch (error) {
      console.error("❌ فشل تحديث السيرفر:", error);
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