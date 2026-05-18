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
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleDarkMode = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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

      <nav id="main-nav" className={isMenuOpen ? 'open' : ''}>
        <Link to="/" onClick={closeMenu}>الرئيسية</Link>
        <Link to="/scholarships" onClick={closeMenu}>المنح</Link>
        <Link to="/quiz" onClick={closeMenu}>اكتشف التخصص المناسب لك</Link>
        <Link to="/major/all" onClick={closeMenu}>التخصصات العالمية</Link>
        <Link to="/faq" onClick={closeMenu}>الأسئلة الشائعة</Link>
        <Link to="/contact" onClick={closeMenu}>تواصل معنا</Link>
        
        <Link to={user ? "/profile" : "/login"} className="nav-auth-btn" onClick={closeMenu}>
          {getButtonText()}
        </Link>
      </nav>

      <div className="header-left">
        <button 
          id="darkModeToggle" 
          className="dark-mode-toggle" 
          aria-label="Toggle Dark Mode"
          onClick={toggleDarkMode}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
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
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-brand">
          <img src="/images/logo.png" alt="مُلم" className="footer-logo"/>
          <p>منصتك الأولى لاكتشاف المنح الدراسية حول العالم</p>
        </div>
        <div className="footer-links">
          <h4>روابط سريعة</h4>
          <Link to="/">الرئيسية</Link>
          <Link to="/scholarships">جميع المنح</Link>
          <Link to="/quiz">اكتشف التخصص المناسب لك</Link>
          <Link to="/faq">الأسئلة الشائعة</Link>
        </div>
        <div className="footer-social">
          <h4>تواصل معنا</h4>
          <a href="https://t.me/molim_ContactBot" target="_blank" rel="noreferrer"> الدعم الفني - تليجرام</a>
          <a href="mailto:molim.team@gmail.com"> molim.team@gmail.com</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>مُلم © 2026 | جميع الحقوق محفوظة | <Link to="/privacy">سياسة الخصوصية</Link></p>
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