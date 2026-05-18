import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// تأكد من ضبط مسار استيراد Firebase حسب هيكلة مجلد الـ src عندك
import { auth, db } from './firebase-config'; 
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from "firebase/auth";

function Register() {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // حالات إظهار وإخفاء كلمات المرور
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // حالة رسائل الخطأ والنجاح والتحميل
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault(); // منع الصفحة من إعادة التحميل

    // تصفير الرسائل السابقة
    setMessage({ text: '', type: '' });

    // التحقق من المدخلات
    if (!fullname.trim() || !email.trim() || !password || !confirmPassword) {
      setMessage({ text: '⚠️ يرجى تعبئة جميع الحقول', type: 'error' });
      return;
    }
    if (password.length < 6) {
      setMessage({ text: '⚠️ يجب أن تكون كلمة المرور 6 أحرف على الأقل', type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: '⚠️ كلمة المرور غير متطابقة', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // 1. إنشاء الحساب في Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. تحديث الاسم الشخصي للمستخدم
      await updateProfile(user, { displayName: fullname.trim() });

      // 3. إرسال بريد التحقق للمستخدم
      await sendEmailVerification(user);
      
      // 4. حفظ بيانات الطالب الإضافية في Firestore
      await setDoc(doc(db, 'users', user.uid), {
        fullname: fullname.trim(),
        email: email.trim(),
        role: 'student', // تحديد نوع الحساب "student"
        registrationDate: new Date().toISOString(), // تاريخ التسجيل
        createdAt: new Date().toISOString()
      });

      // 5. تسجيل الخروج فوراً حتى لا يدخل قبل تأكيد البريد
      await signOut(auth);

      setMessage({ text: '✅ تم إنشاء حسابك! تحقق من بريدك الإلكتروني وأكّد حسابك قبل تسجيل الدخول.', type: 'success' });

      // الانتقال لصفحة تسجيل الدخول بعد ثانيتين ونصف
      setTimeout(() => {
        navigate('/login');
      }, 2500);

    } catch (error) {
      setLoading(false);
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setMessage({ text: '⚠️ هذا البريد الإلكتروني مستخدم بالفعل ومسجل به حساب آخر.', type: 'error' });
      } else if (error.code === 'auth/weak-password') {
        setMessage({ text: '⚠️ كلمة المرور ضعيفة جداً! يرجى اختيار كلمة مرور أقوى (6 أحرف على الأقل).', type: 'error' });
      } else if (error.code === 'auth/invalid-email') {
        setMessage({ text: '⚠️ صيغة البريد الإلكتروني المدخل غير صالحة.', type: 'error' });
      } else {
        setMessage({ text: `⚠️ حدث خطأ أثناء إنشاء الحساب: ${error.message || 'يرجى المحاولة مرة أخرى'}`, type: 'error' });
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🎓 إنشاء حساب</h1>
        <p className="subtitle">انضم إلى مُلم واستفد من جميع الميزات</p>

        {/* عرض رسائل الخطأ أو النجاح ديناميكياً */}
        {message.text && (
          <div className={`auth-msg ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>الاسم الكامل</label>
            <input 
              type="text" 
              placeholder="أدخل اسمك الكامل" 
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input 
              type="email" 
              placeholder="example@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>كلمة المرور</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="8 أحرف على الأقل" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>تأكيد كلمة المرور</label>
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                placeholder="أعد كتابة كلمة المرور" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <span className="password-toggle-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-auth" 
            disabled={loading}
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
          </button>
        </form>

        <div className="auth-switch">
          لديك حساب؟ <Link to="/login">سجّل دخول</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;