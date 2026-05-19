import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // مراقبة الجلسة وجلب البيانات في خطوة واحدة متزامنة لمنع تضارب الواجهة
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // التأكد التام من تحويل كافة المعرفات إلى نصوص منعا للتضارب
            const cleanFavs = (data.favorites || []).map(item => String(item));
            setFavorites(cleanFavs);
            console.log("🎯 تم جلب المفضلة بنجاح من السيرفر:", cleanFavs);
          } else {
            // إذا كان المستند غير موجود أصلاً (مستخدم جديد) ننشئه بمصفوفة فارغة
            await setDoc(docRef, { favorites: [] }, { merge: true });
            setFavorites([]);
          }
        } catch (error) {
          console.error("❌ خطأ أثناء قراءة المفضلة من Firestore:", error);
        }
      } else {
        // في حال تسجيل الخروج أو زائر عادي
        setFavorites([]);
      }

      // ميزة التعديل: لا نلغي شاشة التحميل إلا بعد انتهاء جلب الحساب والمفضلة معاً
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // دالة الحفظ الذكية (تتعامل مع الرقم والنص وتجبر Firestore على التحديث)
  const toggleFav = async (scholarshipId) => {
    if (!user) {
      return false; // نرجع false لفتح المودال الخاص بتسجيل الدخول في صفحة Main
    }

    // تحويل الـ ID القادم من الكرت إلى نص فوراً لحل مشكلة نوع البيانات
    const stringId = String(scholarshipId);
    
    // تحديد المصفوفة الجديدة محلياً لتحديث الواجهة فوراً
    let updatedFavs = [];

    setFavorites((currentFavs) => {
      const isExist = currentFavs.includes(stringId);
      updatedFavs = isExist 
        ? currentFavs.filter(id => id !== stringId)
        : [...currentFavs, stringId];
        
      return updatedFavs;
    });

    // إرسال البيانات فوراً إلى الفايربيس باستخدام setDoc مع merge لضمان إنشائها لو اختفت
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { favorites: updatedFavs }, { merge: true });
      console.log("💾 تم الحفظ والتثبيت في الفايربيس بنجاح للمعرف:", stringId);
      return true;
    } catch (error) {
      console.error("❌ فشل تحديث السيرفر، تم التراجع محلياً. السبب الحقيقي:", error);
      
      // التراجع عن التغيير في الواجهة لو فشل الاتصال بالسيرفر لإبقاء البيانات دقيقة
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFavorites((docSnap.data().favorites || []).map(item => String(item)));
      }
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