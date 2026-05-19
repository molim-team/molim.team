import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";

// حل مشكلة الفايربيس: استيراد مباشر وصحيح من نفس المجلد الحاضن
import { auth } from './firebase-config';

// استيراد الصفحات والمكونات بمطابقة تامة لأسماء ملفاتك في المجلد
import Main from './Main'; 
import Scholarships from './Scholarships'; 
import ScholarshipDetails from './Scholarship'; 
import FAQ from './Faq';
import Contact from './contact';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import Privacy from './Privacy';
import Quiz from './Quiz';
import Admin from './Admin';
import Major from './Major';

// استيراد بوت لمام
import LlamamBot from './LlamamBot';

import './style.css';

function Header() {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const getButtonText = () => {
    if (user) {
      const firstName = user.displayName ? user.displayName.split(' ')[0] : 'حسابي';
      return `👤 ${firstName}`;
    }
    return '🔑 تسجيل الدخول';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header>
      <div className="logo">
        <Link to="/" onClick={closeMenu}>
          <img src="/images/logo.png" alt="مُلم" className="logo-img"/>
        </Link>
      </div>

      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button 
          className="dark-mode-toggle" 
          onClick={toggleDarkMode}
          aria-label="تبديل الوضع"
        >
          {isDarkMode ? '🌙' : '☀️'}
        </button>

        <button 
          className={`menu-toggle ${isMenuOpen ? 'active' : ''}`} 
          onClick={toggleMenu}
          aria-label="قائمة التنقل"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </div>

      <nav id="main-nav" className={isMenuOpen ? 'open' : ''}>
        <Link to="/" onClick={closeMenu}>الرئيسية</Link>
        <Link to="/scholarships" onClick={closeMenu}>المنح</Link>
        <Link to="/quiz" onClick={closeMenu}>اكتشف تخصصك المناسب</Link>
        <Link to="/major/all" onClick={closeMenu}> التخصصات العالمية</Link>
        <Link to="/faq" onClick={closeMenu}>الأسئلة الشائعة</Link>
        <Link to="/contact" onClick={closeMenu}>تواصل معنا</Link>
        
        <Link to={user ? "/profile" : "/login"} className="nav-auth-btn" onClick={closeMenu}>
          {getButtonText()}
        </Link>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-content">

        <div className="footer-social">
          <h4>تواصل معنا</h4>
          <Link to="/@molim_ContactBot">الدعم الفني - تليجرام</Link>
          <a href="mailto:molim.team@gmail.com">molim.team@gmail.com</a>
        </div>

       <div className="footer-links">
          <h4>روابط سريعة</h4>
          <Link to="/">الرئيسية</Link>
          <Link to="/scholarships">جميع المنح</Link>
          <Link to="/quiz">اختبار التخصص المناسب</Link>
          <Link to="/faq">الأسئلة الشائعة</Link>
          <Link to="/privacy">سياسة الخصوصية</Link>
        </div>

        <div className="footer-brand">
          <img src="/images/logo.png" alt="مُلم" className="footer-logo"/>
          <p>منصتك الأولى لاكتشاف المنح الدراسية حول العالم</p>
        </div>

      </div>

      <div className="footer-bottom">
        <p>مُلم © 2026 | جميع الحقوق محفوظة</p>
      </div>
    </footer>
  );
}

function App() {
  return (
    <Router>
      <Header />
      
      <main className="main-content-wrapper">
        <Routes>
          {/* الواجهة الرئيسية الترحيبية من ملف Main.jsx */}
          <Route path="/" element={<Main />} /> 
          
          {/* صفحة عرض كل المنح المتاحة */}
          <Route path="/scholarships" element={<Scholarships />} />
          
          {/* صفحة تفاصيل المنحة الواحدة بناءً على الـ ID */}
          <Route path="/scholarship/:id" element={<ScholarshipDetails />} />
          
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/admin" element={<Admin />} />
          
          <Route path="/major" element={<Major />} />
          <Route path="/major/:id" element={<Major />} />
        </Routes>
      </main>
      
      <LlamamBot />

      <Footer />
    </Router>
  );
}

export default App;