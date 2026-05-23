import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";

import { auth } from './firebase-config';
import { FavoritesProvider } from './FavoritesContext';

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
import ScrollToTop from './ScrollToTop';

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
        <div className="footer-brand">
          <img src="/images/logo.png" alt="مُلم" className="footer-logo"/>
          <p>منصتك الأولى لاكتشاف المنح الدراسية حول العالم</p>
        </div>

        <div className="footer-links">
          <h4>روابط سريعة</h4>
          <Link to="/" onClick={() => window.scrollTo(0, 0)}>الرئيسية</Link>
          <Link to="/scholarships" onClick={() => window.scrollTo(0, 0)}>جميع المنح</Link>
          <Link to="/quiz" onClick={() => window.scrollTo(0, 0)}>اختبار التخصص المناسب</Link>
          <Link to="/faq" onClick={() => window.scrollTo(0, 0)}>الأسئلة الشائعة</Link>
        </div>

        <div className="footer-social">
          <h4>تواصل معنا</h4>
          <a href="https://t.me/molim_ContactBot" target="_blank" rel="noopener noreferrer">الدعم الفني - تليجرام</a>
          <a href="mailto:molim.team@gmail.com">molim.team@gmail.com</a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>مُلم © 2026 | جميع الحقوق محفوظة</p>
        <Link to="/privacy" onClick={() => window.scrollTo(0, 0)}>سياسة الخصوصية</Link>
      </div>
    </footer>
  );
}

function App() {
  return (
    <FavoritesProvider>
      <Router>
        <ScrollToTop />
        <Header />
        
        <main className="main-content-wrapper">
          <Routes>
            <Route path="/" element={<Main />} /> 
            <Route path="/scholarships" element={<Scholarships />} />
            <Route path="/scholarship/:id" element={<ScholarshipDetails />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/admin/amr/aseal" element={<Admin />} />
            <Route path="/major" element={<Major />} />
            <Route path="/major/:id" element={<Major />} />
          </Routes>
        </main>
        
        <LlamamBot />
        <Footer />
      </Router>
    </FavoritesProvider>
  );
}

export default App;