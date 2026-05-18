import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

const Scholarships = () => {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [degreeFilter, setDegreeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favorites'

  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // ... (تحديث useEffect الجلب لضمان توافق النصوص)

  useEffect(() => {
    if (user) {
      const fetchFavorites = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // تحويل المعرفات لنصوص لضمان المطابقة بعد إعادة تسجيل الدخول
            const favs = (data.favorites || []).map(f => String(f));
            setFavorites(favs);
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
  useEffect(() => {
    fetch('/scholarships.json')
      .then(res => res.json())
      .then(data => setScholarships(data))
      .catch(err => console.error('خطأ:', err));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 50);
      setShowTopBtn(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFav = async (id) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const strId = String(id);
    let newFavs;
    if (favorites.includes(strId)) {
      newFavs = favorites.filter(f => f !== strId);
    } else {
      newFavs = [...favorites, strId];
    }
    setFavorites(newFavs);

    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { favorites: newFavs }, { merge: true });
      console.log("تم الحفظ في Firestore بنجاح");
    } catch (error) {
      console.error("Error saving favorites to Firestore:", error);
    }
  };

  const shareScholarship = (id, name, country) => {
    const url = `${window.location.origin}/scholarship/${id}`;
    if (navigator.share) {
      navigator.share({ title: `منحة ${name}`, text: `🎓 اكتشف منحة ${name} في ${country} على منصة مُلم!`, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('✅ تم نسخ رابط المنحة!');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  let filteredScholarships = scholarships.filter(s => {
    const searchLower = search.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(searchLower) || s.country.toLowerCase().includes(searchLower);
    const isOpen = s.open === true || s.open === 'true';
    const matchStatus = statusFilter === 'all' || (statusFilter === 'open' ? isOpen : !isOpen);
    const matchDegree = degreeFilter === 'all' || s.degree.includes(degreeFilter);
    return matchSearch && matchStatus && matchDegree;
  });

  if (filteredScholarships.length === 0 && scholarships.length > 0) {
    filteredScholarships = scholarships.slice(0, 4);
  }

  const favoriteScholarships = scholarships.filter(s => favorites.includes(String(s.id)));

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });

    const cards = document.querySelectorAll('.card');
    cards.forEach(card => observer.observe(card));

    return () => {
      cards.forEach(card => observer.unobserve(card));
    };
  }, [filteredScholarships, favoriteScholarships, activeTab]);

  return (
    <div className="flex flex-col min-h-screen justify-between">
      <div>
        <section className="page-hero">
          <h1>🎓 جميع المنح الدراسية</h1>
          <p>اكتشف المنح المتاحة وتفاصيلها كاملة</p>
        </section>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'tab-active' : ''}`}
          id="tab-all"
          onClick={() => setActiveTab('all')}
        >
          📋 جميع المنح
        </button>
        <button
          className={`tab-btn ${activeTab === 'favorites' ? 'tab-active' : ''}`}
          id="tab-fav"
          onClick={() => setActiveTab('favorites')}
        >
          ❤️ المفضلة
        </button>
      </div>

      {activeTab === 'all' && (
        <div id="all-section">
          <section className="filters">
            <input
              type="text"
              id="search"
              placeholder="🔍 ابحث عن منحة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select id="filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">جميع المنح</option>
              <option value="open">التقديم مفتوح</option>
              <option value="closed">التقديم مغلق</option>
            </select>
            <select id="filter-degree" value={degreeFilter} onChange={(e) => setDegreeFilter(e.target.value)}>
              <option value="all">جميع المراحل</option>
              <option value="بكالوريوس">بكالوريوس</option>
              <option value="ماجستير">ماجستير</option>
              <option value="دكتوراه">دكتوراه</option>
            </select>
          </section>

          <section className="featured">
            <div id="scholarships-grid" className="grid">
              {filteredScholarships.map(s => (
                <div key={s.id} className="card">
                  <button
                    className={`fav-btn ${favorites.includes(String(s.id)) ? 'active' : ''}`}
                    data-id={s.id}
                    aria-label={favorites.includes(String(s.id)) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFav(s.id);
                    }}
                  >
                    <i className={`${favorites.includes(String(s.id)) ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                  </button>
                  {s.flag && (s.flag.startsWith('http') || s.flag.includes('/') || s.flag.includes('.')) ? (
                    <img className="card-flag" src={s.flag} alt="flag" />
                  ) : (
                    <span className="card-flag">{s.flag || ''}</span>
                  )}
                  <h3>{s.name}</h3>
                  <p className="country">📍 {s.country}</p>
                  <p className="degree">🎓 {s.degree}</p>
                  <span className={`status ${(s.open === true || s.open === 'true') ? 'open' : 'closed'}`}>
                    {(s.open === true || s.open === 'true') ? '✅ التقديم مفتوح' : '🔴 التقديم مغلق'}
                  </span>
                  <p className="desc">{s.description || ''}</p>
                  {s.open_date && <p className="deadline">📅 موعد فتح التقديم: {s.open_date}</p>}
                  <p className="deadline">📅 آخر موعد للتقديم: {s.deadline}</p>
                  <Link to={`/scholarship/${s.id}`} className="btn-details">تفاصيل المنحة كاملة ←</Link>
                  <a href={s.link} target="_blank" rel="noreferrer">زيارة الموقع الرسمي ↗</a>
                  <a className="btn-details" onClick={() => shareScholarship(s.id, s.name, s.country)}>
                    📤 شارك المنحة
                  </a>
                </div>
              ))}
            </div>
            {filteredScholarships.length === 0 && (
              <p id="no-results">
                لا توجد منح تطابق بحثك 😔
              </p>
            )}
          </section>
        </div>
      )}

      {activeTab === 'favorites' && (
        <div id="favorites-section">
          <section className="featured">
            <div id="favorites-grid" className="grid">
              {favoriteScholarships.map(s => (
                <div key={s.id} className="card">
                  <button
                    className={`fav-btn ${favorites.includes(String(s.id)) ? 'active' : ''}`}
                    data-id={s.id}
                    aria-label={favorites.includes(String(s.id)) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFav(s.id);
                    }}
                  >
                    <i className={`${favorites.includes(String(s.id)) ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                  </button>
                  {s.flag && (s.flag.startsWith('http') || s.flag.includes('/') || s.flag.includes('.')) ? (
                    <img className="card-flag" src={s.flag} alt="flag" />
                  ) : (
                    <span className="card-flag">{s.flag || ''}</span>
                  )}
                  <h3>{s.name}</h3>
                  <p className="country">📍 {s.country}</p>
                  <p className="degree">🎓 {s.degree}</p>
                  <span className={`status ${(s.open === true || s.open === 'true') ? 'open' : 'closed'}`}>
                    {(s.open === true || s.open === 'true') ? '✅ التقديم مفتوح' : '🔴 التقديم مغلق'}
                  </span>
                  <p className="desc">{s.description || ''}</p>
                  {s.open_date && <p className="deadline">📅 موعد فتح التقديم: {s.open_date}</p>}
                  <p className="deadline">📅 آخر موعد للتقديم: {s.deadline}</p>
                  <Link to={`/scholarship/${s.id}`} className="btn-details">تفاصيل المنحة كاملة ←</Link>
                  <a href={s.link} target="_blank" rel="noreferrer">زيارة الموقع الرسمي ↗</a>
                  <a className="btn-details" onClick={() => shareScholarship(s.id, s.name, s.country)}>
                    📤 شارك المنحة
                  </a>
                </div>
              ))}
            </div>
            {favoriteScholarships.length === 0 && (
              <p id="no-favorites">
                لم تضف أي منحة للمفضلة بعد 💔<br />اضغط على القلب في أي منحة لحفظها هنا!
              </p>
            )}
          </section>
        </div>
      )}
      </div>

      {showTopBtn && (
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
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
          onClick={() => setShowAuthModal(false)}
        >
          <div 
            className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl p-8 text-right rtl shadow-2xl border border-gray-100 dark:border-slate-800 transform transition-all duration-300 scale-100"
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
};

export default Scholarships;