import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

function Main() {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchFavorites = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFavorites(data.favorites || []);
          } else {
            setFavorites([]);
          }
        } catch (error) {
          console.error("Error fetching favorites from Firestore:", error);
        }
      };
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);
  
  const gridRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    // جلب كل المنح المفتوحة
    fetch('/scholarships.json')
      .then(res => res.json())
      .then(data => {
        let openOnly = data.filter(s => s.open === true || s.open === 'true');
        if (openOnly.length === 0 && data && data.length > 0) {
          openOnly = data;
        }
        setScholarships(openOnly);
        setLoading(false);
      })
      .catch(err => {
        console.error('خطأ في تحميل المنح:', err);
        setLoading(false);
      });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowBackToTop(window.scrollY > 300);
      
      const header = document.querySelector('header');
      if (header) {
        if (window.scrollY > 80) {
          header.classList.add('header-hidden');
        } else {
          header.classList.remove('header-hidden');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card, .about-card').forEach(card => {
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [scholarships, loading]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const getCountdown = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const end = new Date(deadline);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) return null;
    if (diff === 0) return { text: '⚠️ آخر يوم للتقديم!', urgent: true };
    if (diff <= 7) return { text: `⚠️ باقي ${diff} أيام فقط!`, urgent: true };
    return { text: `📅 باقي ${diff} يوم على إغلاق التقديم`, urgent: false };
  };

  const handleFavorite = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const strId = String(id);
    let newFavs;
    if (favorites.includes(strId)) {
      newFavs = favorites.filter(favId => favId !== strId);
    } else {
      newFavs = [...favorites, strId];
    }
    setFavorites(newFavs);

    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { favorites: newFavs }, { merge: true });
    } catch (error) {
      console.error("Error saving favorites to Firestore:", error);
    }
  };

  const shareScholarship = (e, id, name, country) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/scholarship/${id}`;
    const text = `🎓 ${name}\n`;
    if (navigator.share) {
      navigator.share({ title: `منحة ${name}`, text, url });
    } else {
      navigator.clipboard.writeText(text + '\n' + url);
      alert('✅ تم نسخ رابط المنحة!');
    }
  };

  const slideCards = (direction) => {
    if (gridRef.current) {
      const card = gridRef.current.querySelector('.card');
      if (!card) return;
      const cardWidth = card.offsetWidth + 20;
      gridRef.current.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e) => {
    setIsDown(true);
    setStartX(e.pageX - gridRef.current.offsetLeft);
    setScrollLeft(gridRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDown(false);
  const handleMouseUp = () => setIsDown(false);
  const handleMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - gridRef.current.offsetLeft;
    gridRef.current.scrollLeft = scrollLeft - (x - startX) * 3;
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="main-home-container px-4 md:px-6">
      <style>{`
        /* Responsive utility styles for Main page component */
        .main-home-container {
          width: 100%;
        }
        .px-4 {
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }
        
        /* Retain full-width hero bg */
        .main-home-container > .hero {
          margin-left: -1rem !important;
          margin-right: -1rem !important;
        }

        @media (min-width: 768px) {
          .md\\:px-6 {
            padding-left: 1.5rem !important;
            padding-right: 1.5rem !important;
          }
          .main-home-container > .hero {
            margin-left: -1.5rem !important;
            margin-right: -1.5rem !important;
          }
        }

        /* Available Scholarships stack vertically on mobile and horizontally on desktop */
        @media (max-width: 767px) {
          #open-scholarships-grid.flex-col {
            flex-direction: column !important;
            overflow-x: visible !important;
            padding: 0 0 20px 0 !important;
            gap: 20px !important;
          }
          #open-scholarships-grid.flex-col .card,
          #open-scholarships-grid.flex-col .skeleton-card {
            min-width: 100% !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          /* Hide slider buttons on mobile */
          .slider-wrapper .slider-btn {
            display: none !important;
          }
        }

        @media (min-width: 768px) {
          #open-scholarships-grid.md\\:flex-row {
            flex-direction: row !important;
            overflow-x: auto !important;
          }
        }

        /* About Molim Section layout */
        .cards-wrapper.flex-col {
          display: flex !important;
          flex-direction: column !important;
          gap: 20px !important;
        }
        .cards-wrapper.flex-col > .about-card,
        .cards-wrapper.flex-col > a {
          width: 100% !important;
          display: block;
        }
        .cards-wrapper.flex-col > a > .about-card {
          width: 100% !important;
        }

        @media (min-width: 768px) {
          .cards-wrapper.md\\:flex-row {
            flex-direction: row !important;
          }
          .cards-wrapper.md\\:flex-row > .about-card,
          .cards-wrapper.md\\:flex-row > a {
            flex: 1 !important;
            width: auto !important;
          }
        }
      `}</style>

      {/* هيرو */}
      <section className="hero">
        <div className="hero-logo-wrap">
          <img src="/images/logo.png" alt="مُلم" className="hero-logo" />
          <div className="hero-glow"></div>
        </div>
        <p className="hero-sub">منصتك الأولى لاكتشاف المنح الدراسية حول العالم</p>
        <Link to="/scholarships" className="btn-main">استعرض المنح</Link>
        <section className="stats-section">
          <div className="stat-item">
            <span className="stat-number">+1000</span>
            <span className="stat-label">🎓 مستفيد</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">+30</span>
            <span className="stat-label">📚 منحة</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">+20</span>
            <span className="stat-label">🌍 دولة</span>
          </div>
        </section>
      </section>

      {/* المنح المتاحة حالياً */}
      <section className="open-scholarships-section">
        <h2 className="section-title">المنح المتاحة حالياً 🟢</h2>
        <div className="slider-wrapper">
          <button className="slider-btn prev" onClick={() => slideCards(-1)}>&#8250;</button>
          <div 
            id="open-scholarships-grid" 
            className="cards-grid flex-col md:flex-row"
            ref={gridRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-line skeleton-flag"></div>
                  <div className="skeleton-line skeleton-title"></div>
                  <div className="skeleton-line skeleton-text"></div>
                  <div className="skeleton-line skeleton-text wide"></div>
                  <div className="skeleton-line skeleton-btn"></div>
                  <div className="skeleton-line skeleton-btn"></div>
                </div>
              ))
            ) : scholarships.length === 0 ? (
              <p>لا توجد منح مفتوحة حالياً</p>
            ) : (
              scholarships.map(s => {
                const active = favorites.includes(String(s.id));
                const cd = getCountdown(s.deadline);
                return (
                  <div key={s.id} className="card">
                    <button 
                      className={`fav-btn ${active ? 'active' : ''}`} 
                      onClick={(e) => handleFavorite(e, s.id)}
                      aria-label={active ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    >
                      <i className={`${active ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                    </button>
                    
                    {s.flag && (s.flag.startsWith('http') || s.flag.includes('/') || s.flag.includes('.')) ? (
                      <img className="card-flag" src={s.flag} alt="flag"/>
                    ) : (
                      <span className="card-flag">{s.flag || ''}</span>
                    )}

                    <h3>{s.name}</h3>
                    <p className="country">📍 {s.country}</p>
                    <p className="degree">🎓 {s.degree}</p>
                    <span className="status open">✅ التقديم مفتوح</span>
                    <p className="desc">{s.description || ''}</p>
                    {s.open_date && <p className="deadline">📅 موعد فتح التقديم: {s.open_date}</p>}
                    {cd && (
                      <div className={`countdown ${cd.urgent ? 'urgent' : ''}`}>
                        {cd.text}
                      </div>
                    )}
                    <p className="deadline">📅 آخر موعد للتقديم: {s.deadline}</p>
                    
                    <Link to={`/scholarship/${s.id}`} className="btn-details">تفاصيل المنحة كاملة ←</Link>
                    <a href={s.link} target="_blank" rel="noreferrer" className="btn-details">زيارة الموقع الرسمي ↗</a>
                    <button className="btn-details" onClick={(e) => shareScholarship(e, s.id, s.name, s.country)}>📤 شارك المنحة</button>
                  </div>
                );
              })
            )}
          </div>
          <button className="slider-btn next" onClick={() => slideCards(1)}>&#8249;</button>
        </div>
      </section>

      {/* من نحن */}
      <section className="about-section">
        <h2 className="section-title"> عن مُلم </h2>
        <div className="cards-wrapper flex-col md:flex-row">
          <div className="about-card">
            <span className="about-icon">🎯</span>
            <h3>من نحن</h3>
            <p>مُلم منصة عربية متخصصة في تجميع أبرز المنح الدراسية حول العالم في مكان واحد. نسعى لتسهيل وصول الطلاب العرب إلى فرص التعليم الدولي بمعلومات دقيقة وموثوقة.</p>
          </div>
          <div className="about-card">
            <span className="about-icon">📚</span>
            <h3>ماذا نقدم</h3>
            <p>نوفر لك تفاصيل شاملة عن كل منحة تشمل المزايا والشروط والمستندات المطلوبة ورابط التقديم الرسمي — كل ما تحتاجه في صفحة واحدة دون الحاجة للبحث في عشرات المواقع.</p>
          </div>
          <div className="about-card">
            <span className="about-icon">✅</span>
            <h3>لماذا مُلم</h3>
            <p>معلوماتنا محدّثة باستمرار ومصدرها المواقع الرسمية للمنح. نوضح جميع المتطلبات والشروط الدقيقة لكل منحة حتى تتقدم بثقة وملف مكتمل.</p>
          </div>
          
          <a href="https://t.me/Molim_Team/4" target="_blank" rel="noreferrer">
            <div className="about-card">
              <span className="about-icon">💬</span>
              <h3>مجتمع مُلم</h3>
              <p>انضم لقروب التليجرام الخاص بنا للحصول على آخر أخبار المنح والمواعيد النهائية للتقديم، وللتواصل مع طلاب يمرون بنفس تجربتك.</p>
            </div>
          </a>
        </div>
      </section>

      {showBackToTop && (
        <button id="back-to-top" onClick={scrollToTop}>↑</button> 
      )}

      {showAuthModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
          onClick={() => setShowAuthModal(false)}
        >
          <div 
            className="relative w-full max-w-md bg-white dark:bg-[#132035] rounded-3xl p-8 text-right rtl shadow-2xl border border-gray-100 dark:border-slate-800 transform transition-all duration-300 scale-100"
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '440px',
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              border: '1px solid var(--card-border, #e0e0e0)',
              textAlign: 'center',
              direction: 'rtl',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="absolute top-5 left-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl font-bold transition-colors cursor-pointer bg-transparent border-none"
              onClick={() => setShowAuthModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'none',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                color: 'var(--text-color, #666)',
              }}
            >
              ✕
            </button>

            {/* Red Heart Icon */}
            <div 
              className="w-20 h-20 mx-auto mb-6 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center text-red-500 text-4xl shadow-inner"
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                backgroundColor: 'rgba(255, 69, 0, 0.08)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff4500',
                fontSize: '36px',
              }}
            >
              <i className="fa-solid fa-heart animate-pulse"></i>
            </div>

            {/* Title */}
            <h3 
              className="text-2xl font-black text-center text-gray-900 dark:text-white mb-3"
              style={{
                fontSize: '22px',
                fontWeight: '900',
                color: 'var(--primary-color, #ff4500)',
                marginBottom: '12px',
              }}
            >
              المنح المفضلة
            </h3>

            {/* Body Text */}
            <p 
              className="text-gray-600 dark:text-gray-300 text-center leading-relaxed mb-8 text-base font-semibold"
              style={{
                color: 'var(--text-color, #333)',
                fontSize: '16px',
                lineHeight: '1.6',
                marginBottom: '32px',
              }}
            >
              الرجاء تسجيل الدخول للاستفادة من ميزة المنح المفضلة.
            </p>

            {/* Actions */}
            <div 
              className="flex flex-col gap-3"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/login');
                }}
                className="w-full bg-[#ff4500] hover:bg-[#e03d00] text-white py-3.5 rounded-2xl font-bold text-base transition-all duration-300 shadow-lg shadow-[#ff4500]/20 flex items-center justify-center gap-2 hover:scale-[1.02] transform active:scale-98 cursor-pointer border-none"
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#ff4500',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 69, 0, 0.2)',
                  transition: 'all 0.2s ease',
                }}
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-gray-600 dark:text-gray-300 py-3.5 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center cursor-pointer border border-gray-200 dark:border-slate-700"
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-color, #666)',
                  border: '2px solid var(--primary-color, #ff4500)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Main;