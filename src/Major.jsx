import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function Majors() {
  const [majorsData, setMajorsData] = useState([]);
  const [openKey, setOpenKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const response = await fetch('/majors_info.json');
        const data = await response.json();
        
        const majorsArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        
        setMajorsData(majorsArray);
        setLoading(false);
      } catch (error) {
        console.error("Error loading majors:", error);
        setLoading(false);
      }
    };

    fetchMajors();
  }, []);

  useEffect(() => {
    if (!loading && location.hash) {
      const targetKey = decodeURIComponent(location.hash.substring(1));
      setOpenKey(targetKey);
      setTimeout(() => {
        const element = document.getElementById(targetKey);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [location.hash, loading]);

  const toggleFaq = (key) => {
    setOpenKey(openKey === key ? null : key);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>جاري تحميل دليل التخصصات...</p>
      </div>
    );
  }

  return (
    <div className="majors-page">
      <section className="page-hero">
        <h1>🌍 دليل التخصصات العالمية</h1>
        <p>تعرف على تفاصيل ومستقبل أهم التخصصات الأكاديمية والمقومات الأساسية لكل تخصص</p>
      </section>

      <section className="faq-section" id="majors-container">
        {majorsData.map((major) => (
          <div className="faq-item" id={major.id} key={major.id}>
            <div className="faq-question" onClick={() => toggleFaq(major.id)}>
              <span>{major.name}</span>
              <span className="faq-icon">{openKey === major.id ? '−' : '+'}</span>
            </div>
            
            <div className={`faq-answer ${openKey === major.id ? 'open' : ''}`}>
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
                <p className="major-sub-title">الإيجابيات:</p>
                <ul className="major-list">
                  {major.pros?.map((pro, idx) => (
                    <li key={idx}>{pro}</li>
                  ))}
                </ul>
                <p className="major-sub-title">السلبيات:</p>
                <ul className="major-list">
                  {major.cons?.map((con, idx) => (
                    <li key={idx}>{con}</li>
                  ))}
                </ul>
                
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