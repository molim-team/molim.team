import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { auth } from './firebase-config'; // استدعاء ملف الإعدادات الجديد والمباشر في الـ src
import { onAuthStateChanged, signOut } from "firebase/auth"; // الاستدعاء الصحيح من مكتبة فيربيز الرسمية

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // مراقبة حالة تسجيل الدخول من فيربيز
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // تنظيف المراقبة عند الخروج من الصفحة
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // العودة للرئيسية بعد تسجيل الخروج
    } catch (error) {
      console.error("خطأ أثناء تسجيل الخروج:", error);
    }
  };

  // 1. حالة جاري تحميل البيانات عند فتح الصفحة
  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p style={{ textAlign: 'center', color: '#aaa' }}>⏳ جاري تحميل بيانات الحساب...</p>
        </div>
      </div>
    );
  }

  // 2. حالة إذا كان الزائر غير مسجل الدخول
  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="not-logged-in">
            <p style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>👤</p>
            <p style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#555' }}>أنت غير مسجل الدخول حالياً</p>
            <div className="auth-links">
              <Link to="/login">تسجيل الدخول</Link>
              <span className="divider-slash">|</span>
              <Link to="/register">إنشاء حساب جديد</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // تجهيز بيانات المستخدم للعرض المباشر في الـ JSX
  const name = user.displayName || 'مستخدم مُلم';
  const firstLetter = name.charAt(0);
  const joinDate = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  // 3. حالة عرض الملف الشخصي بعد نجاح التحقق
  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">{firstLetter}</div>
        <div className="profile-name">{name}</div>
        <div className="profile-email">{user.email}</div>
        
        <div className={`profile-verified ${user.emailVerified ? 'yes' : 'no'}`}>
          {user.emailVerified ? '✅ البريد مؤكد' : '⚠️ البريد غير مؤكد'}
        </div>
        
        <hr className="profile-divider"/>
        
        <div className="profile-info-row">
          <span>تاريخ الانضمام</span>
          <span>{joinDate}</span>
        </div>
        
        <button className="btn-logout" onClick={handleLogout}>
          🚪 تسجيل الخروج من الحساب
        </button>
      </div>
    </div>
  );
}

export default Profile;