import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from './firebase-config'; // تأكد من مسار ملف الـ config الخاص بك
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // منطق تسجيل الدخول
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!email.trim() || !password) {
      setMessage({ text: '⚠️ يرجى تعبئة جميع الحقول', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // التحقق من البريد وكلمة المرور باستخدام Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);

      // التحقق من أن البريد الإلكتروني مؤكد
      if (!userCredential.user.emailVerified) {
        await auth.signOut();
        setLoading(false);
        setMessage({ text: '⚠️ يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد أو البريد المزعج.', type: 'error' });
        return;
      }

      setMessage({ text: '✅ تم تسجيل الدخول بنجاح! جاري التحويل...', type: 'success' });
      
      // التوجيه فوراً إلى الصفحة الرئيسية
      navigate('/');

    } catch (error) {
      setLoading(false);
      console.error(error);
      if (
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password' || 
        error.code === 'auth/invalid-credential'
      ) {
        setMessage({ text: '⚠️ البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة.', type: 'error' });
      } else if (error.code === 'auth/too-many-requests') {
        setMessage({ text: '⚠️ تم حظر المحاولات مؤقتاً بسبب كثرة الأخطاء. يرجى المحاولة لاحقاً.', type: 'error' });
      } else if (error.code === 'auth/invalid-email') {
        setMessage({ text: '⚠️ صيغة البريد الإلكتروني المدخل غير صالحة.', type: 'error' });
      } else {
        setMessage({ text: '⚠️ حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى.', type: 'error' });
      }
    }
  };

  // منطق استعادة كلمة المرور
  const handleForgotPassword = async () => {
    setMessage({ text: '', type: '' });

    if (!email.trim()) {
      setMessage({ text: '⚠️ أدخل بريدك الإلكتروني أولاً في الحقل المخصص لإرسال الرابط', type: 'error' });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage({ text: '✅ تم إرسال رابط إعادة تعيين كلمة المرور لبريدك الإلكتروني', type: 'success' });
    } catch (error) {
      setMessage({ text: '⚠️ تعذر إرسال الرابط، تأكد من صحة البريد الإلكتروني المكتوب', type: 'error' });
      console.error(error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>👋 أهلاً بك</h1>
        <p className="subtitle">سجّل دخولك للوصول إلى حسابك</p>

        {message.text && (
          <div className={`auth-msg ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input 
              type="email" 
              placeholder="amr@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>كلمة المرور</label>
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="forgot-password">
            <button 
              type="button" 
              className="btn-link" 
              onClick={handleForgotPassword}
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          <button 
            type="submit" 
            className="btn-auth" 
            disabled={loading}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="auth-switch">
          لا تملك حساباً؟ <Link to="/register">إنشاء حساب جديد</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;