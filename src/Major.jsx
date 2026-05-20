import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import majorsDataRaw from './majors_info.json';

function Majors() {
  const [majorsData] = useState(Object.entries(majorsDataRaw).map(([key, value]) => ({
    id: key,
    ...value
  })));

  const [openKeys, setOpenKeys] = useState(new Set());
  const location = useLocation();

  useEffect(() => {
    let targetKey = null;

    if (location.state && location.state.targetMajor) {
      targetKey = location.state.targetMajor;
    } else if (location.hash) {
      targetKey = decodeURIComponent(location.hash.substring(1));
    }

    if (targetKey) {
      // 1. فتح التخصص المقصود تلقائياً ليظهر محتواه
      setOpenKeys(new Set([targetKey]));

      // 2. النزول تلقائياً لمكان التخصص بعد فتحه
      const timer = setTimeout(() => {
        const element = document.getElementById(targetKey);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [location]);

  const toggleFaq = (key) => {
    setOpenKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="majors-page">
      <section className="page-hero">
        <h1>🌍 دليل التخصصات العالمية</h1>
        <p>تعرف على تفاصيل ومستقبل أهم التخصصات الأكاديمية والمقومات الأساسية لكل تخصص</p>
      </section>

      <section className="faq-section" id="majors-container">
        {majorsData.map((major) => (
          /* الـ id هنا ضروري جداً ليعرف المتصفح أين ينزل */
          <div className="faq-item" key={major.id} id={major.id}>
            <div
              className={`faq-question ${openKeys.has(major.id) ? 'active' : ''}`}
              onClick={() => toggleFaq(major.id)}
            >
              <span>{major.name}</span>
              <span className="faq-icon">{openKeys.has(major.id) ? '−' : '+'}</span>
            </div>
            <div className={`faq-collapse-wrapper ${openKeys.has(major.id) ? 'is-open' : ''}`}>
              <div className="answer-content">
                <div className="major-section-title">نظرة عامة</div>
                <p className="major-text">{major.overview}</p>

                <div className="major-section-title">المواد الأساسية</div>
                <ul className="major-list">
                  {major.core_subjects?.map((subject, idx) => (
                    <li key={idx}>{subject}</li>
                  ))}
                </ul>

                <div className="major-section-title">المهارات المكتسبة</div>
                <ul className="major-list">
                  {major.skills_acquired?.map((skill, idx) => (
                    <li key={idx}>{skill}</li>
                  ))}
                </ul>

                <div className="major-section-title">الإيجابيات والسلبيات</div>
                <div className="pros-cons-grid">
                  <div>
                    <p className="major-sub-title pros">✅ الإيجابيات:</p>
                    <ul className="major-list">
                      {major.pros?.map((pro, idx) => (
                        <li key={idx}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="major-sub-title cons">❌ السلبيات:</p>
                    <ul className="major-list">
                      {major.cons?.map((con, idx) => (
                        <li key={idx}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="major-section-title">مستقبل السوق</div>
                <p className="major-text">{major.market_future}</p>

                <div className="major-section-title">أبرز الوظائف المتاحة</div>
                <ul className="major-list no-margin">
                  {major.careers?.map((career, idx) => (
                    <li key={idx}>{career}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Majors;