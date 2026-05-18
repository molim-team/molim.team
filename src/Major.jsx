import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import majorsDataRaw from './majors_info.json';

function Majors() {
  const [majorsData] = useState(Object.entries(majorsDataRaw).map(([key, value]) => ({
    id: key,
    ...value
  })));

  const [openKey, setOpenKey] = useState(null);
  const contentRefs = useRef({});
  const location = useLocation();

  // التعامل مع الروابط المباشرة (Deep Linking) عند وجود hash في الرابط
  useEffect(() => {
    if (location.hash) {
      const targetKey = decodeURIComponent(location.hash.substring(1));
      setOpenKey(targetKey);
      setTimeout(() => {
        const element = document.getElementById(targetKey);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [location.hash]);

 const toggleFaq = (key) => {
  setOpenKey(openKey === key ? null : key);
};

  return (
    <div className="majors-page">
      <section className="page-hero">
        <h1>🌍 دليل التخصصات العالمية</h1>
        <p>تعرف على تفاصيل ومستقبل أهم التخصصات الأكاديمية والمقومات الأساسية لكل تخصص</p>
      </section>

      <section className="faq-section" id="majors-container">
        {majorsData.map((major) => (
          <div className="faq-item" id={major.id} key={major.id}>
            <div
              className={`faq-question ${openKey === major.id ? 'active' : ''}`}
              onClick={() => toggleFaq(major.id)}
            >
              <span>{major.name}</span>
              <span className="faq-icon">{openKey === major.id ? '−' : '+'}</span>
            </div>
            <div
              className="faq-collapse-wrapper"
              style={{
                height: openKey === major.id
                  ? `${contentRefs.current[major.id]?.scrollHeight}px`
                  : '0px'
              }}
            >
              <div
                className="answer-content"
                ref={el => contentRefs.current[major.id] = el}
              >
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