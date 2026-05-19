import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // 1. مراقبة حالة تسجيل الدخول فقط
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. جلب البيانات فقط وفقط عندما يتغير الـ user.uid ويكون موجوداً فعلياً
  useEffect(() => {
    // إذا كان لسا يجيب حالة الدخول، أو ما فيه مستخدم، لا تسوي شيء ولا تصفّر المصفوفة الآن
    if (authLoading) return; 
    
    if (!user) {
      setFavorites([]); // هنا نبرمج الخروج الصريح فقط لو تأكدنا أن المستخدم مو مسجل دخول
      return;
    }

    const fetchFavorites = async () => {
      setDataLoading(true);
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // تحويل العناصر لنصوص لضمان مطابقتها دائماً
          const fetchedFavs = (data.favorites || []).map(f => String(f));
          setFavorites(fetchedFavs);
          console.log("✅ تم جلب المفضلة من السيرفر:", fetchedFavs);
        } else {
          // إذا كان المستخدم جديد تماماً وما عنده دكيومنت
          await setDoc(docRef, { favorites: [] }, { merge: true });
          setFavorites([]);
        }
      } catch (error) {
        console.error("❌ خطأ أثناء جلب المفضلة من Firestore:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchFavorites();
  }, [user?.uid, authLoading]); // الاعتماد على الـ uid مباشرة لمنع الـ Re-renders العشوائية

  // 3. دالة الإضافة والحذف من المفضلة
  const toggleFav = async (id) => {
    if (!user) {
      console.log("⚠️ يجب تسجيل الدخول لإضافة المفضلة");
      return false;
    }

    const strId = String(id);
    
    // استخدام الأسلوب الوظيفي (Functional Update) لضمان التعامل مع أحدث State للمفضلة
    setFavorites((prevFavorites) => {
      const isExist = prevFavorites.includes(strId);
      const newFavs = isExist
        ? prevFavorites.filter(f => f !== strId)
        : [...prevFavorites, strId];

      // تحديث الفايربيس فوراً بالبيانات الجديدة
      const docRef = doc(db, 'users', user.uid);
      setDoc(docRef, { favorites: newFavs }, { merge: true })
        .then(() => console.log("💾 تم التحديث في الفايربيس بنجاح"))
        .catch((err) => {
          console.error("❌ فشل الحفظ بالسيرفر:", err);
          // هنا يمكنك إعادة الـ state القديمة لو أردت، لكن التحديث التلقائي يضمن تجربة مستخدم سريعة Optimistic UI
        });

      return newFavs;
    });

    return true;
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFav, user, authLoading, dataLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}