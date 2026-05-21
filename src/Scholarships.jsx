import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from './FavoritesContext';
const Scholarships = () => {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState([]);
  const [loadingScholarships, setLoadingScholarships] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [degreeFilter, setDegreeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  // 🌟 جلب authLoading من الـ Context
  const { favorites, toggleFav: favToggle, user, authLoading } = useFavorites();

  // جلب بيانات المنح من ملف JSON
  useEffect(() => {
    // 💡 هام جداً: تأكد من أن ملف scholarships.json موجود في مجلد public/ وليس src/
    fetch('/scholarships.json')
      .then(res => res.json())
      .then(data => {
        setScholarships(data);
        setLoadingScholarships(false); // إيقاف تحميل المنح
      })
      .catch(err => {
        console.error('خطأ في جلب بيانات المنح:', err);
        // حتى لو فشل، أوقف حالة التحميل حتى لا تبقى الشاشة معلقة
        setLoadingScholarships(false);
      });
  }, []);

  // بقية دوال المكون (handleScroll, toggleFav, shareScholarship, scrollToTop) تبقى كما هي...
  // ... (سأختصرها للعرض، تأكد من وجودها في كودك الأصلي)
  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFav = async (id) => {
    // تم إضافة شرط للتأكد من أن المودال يظهر فقط لغير المسجلين
    if (!user) {
        setShowAuthModal(true);
        return;
    }
    const success = await favToggle(id);
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

  const filteredScholarships = loadingScholarships ? [] : scholarships.filter(s => {
    const searchLower = search.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(searchLower) || s.country.toLowerCase().includes(searchLower);
    const isOpen = s.open === true || s.open === 'true';
    const matchStatus = statusFilter === 'all' || (statusFilter === 'open' ? isOpen : !isOpen);
    const matchDegree = degreeFilter === 'all' || s.degree.includes(degreeFilter);
    return matchSearch && matchStatus && matchDegree;
  });

  const favoriteScholarships = loadingScholarships 
    ? [] 
    : scholarships.filter(s => favorites.includes(String(s.id)));

  // كود Intersection Observer يبقى كما هو...
  // ...

  const ScholarshipCard = ({ s }) => {
    // تحويل الطرفين لنصوص لضمان دقة عمل اللون الأحمر للقلب
    // تأكدنا الآن أن favorites ممتلئة بشكل صحيح قبل العرض
    const isFav = favorites.includes(String(s.id));

    return (
      <div className="card">
        <button
          className={`fav-btn ${isFav ? 'active' : ''}`}
          aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفكلة'}
          onClick={(e) => {
            e.stopPropagation();
            toggleFav(s.id);
          }}
        >
          <i className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
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
    );
  };

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
            onClick={() => setActiveTab('all')}
          >
            📋 جميع المنح
          </button>
          <button
            className={`tab-btn ${activeTab === 'favorites' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            ❤️ المفضلة
          </button>
        </div>

        {activeTab === 'all' && (
          <div id="all-section">
            <section className="filters">
              {/* قسم الفلاتر يبقى كما هو */}
              <input
                type="text"
                placeholder="🔍 ابحث عن منحة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">جميع المنح</option>
                <option value="open">التقديم مفتوح</option>
                <option value="closed">التقديم مغلق</option>
              </select>
              <select value={degreeFilter} onChange={(e) => setDegreeFilter(e.target.value)}>
                <option value="all">جميع المراحل</option>
                <option value="بكالوريوس">بكالوريوس</option>
                <option value="ماجستير">ماجستير</option>
                <option value="دكتوراه">دكتوراه</option>
              </select>
            </section>

            <section className="featured">
              <div className="grid">
                {/* 🌟 التعديل: ننتظر تحميل المنح فقط (loadingScholarships) دون انتظار Firebase authLoading */}
                {loadingScholarships ? (
                  // عرض بطاقات Skeleton طالما يتم تحميل المنح
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton-card">
                      <div className="skeleton-line skeleton-flag"></div>
                      <div className="skeleton-line skeleton-title"></div>
                      <div className="skeleton-line skeleton-text"></div>
                      <div className="skeleton-line skeleton-text wide"></div>
                      <div className="skeleton-line skeleton-btn"></div>
                      <div className="skeleton-line skeleton-btn"></div>
                    </div>
                  ))
                ) : (
                  // عرض بطاقات المنح الفعلية بعد اكتمال تحميل المنح
                  filteredScholarships.map(s => (
                    <ScholarshipCard key={s.id} s={s} />
                  ))
                )}
              </div>
              {/* رسالة "لا توجد نتائج" تظهر فقط بعد انتهاء التحميل */}
              {!loadingScholarships && filteredScholarships.length === 0 && (
                <p id="no-results">لا توجد منح تطابق بحثك 😔</p>
              )}
            </section>
          </div>
        )}

        {/* بقية الـ activeTab === 'favorites' والـ showAuthModal تبقى كما هي... */}
        {/* ... */}
         {activeTab === 'favorites' && (
          <div id="favorites-section">
            <section className="featured">
              <div className="grid">
                {loadingScholarships ? (
                  <p>جاري تحميل المفضلة... ⏳</p>
                ) : (
                  favoriteScholarships.map(s => (
                    <ScholarshipCard key={s.id} s={s} />
                  ))
                )}
              </div>
              {!loadingScholarships && favoriteScholarships.length === 0 && (
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
        // تم إضافة شرط لإظهار المودال فقط إذا لم يكن المستخدم مسجلاً
        !user && (
          <div
          // تم نسخ ستايل المودال الأصلي هنا للتأكد من عمله
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
            <button
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

            <div style={{
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
            }}>
              <i className="fa-solid fa-heart"></i>
            </div>

            <h3 style={{
              fontSize: '22px',
              fontWeight: '900',
              color: 'var(--primary-color, #ff4500)',
              marginBottom: '12px',
            }}>
              المنح المفضلة
            </h3>

            <p style={{
              color: 'var(--text-color, #333)',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '32px',
            }}>
              الرجاء تسجيل الدخول للاستفادة من ميزة المنح المفضلة.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/login');
                }}
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
                }}
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
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
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
        )
      )}
    </div>
  );
};

export default Scholarships;