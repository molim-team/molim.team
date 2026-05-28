import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function Scholarship() {
  const { id } = useParams();
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/scholarships.json')
      .then(res => res.json())
      .then(scholarships => {
        const s = scholarships.find(s => String(s.id) === String(id));
        setScholarship(s || null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching scholarship details:", err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (scholarship) {
      document.title = `مُلم | ${scholarship.name}`;
    } else {
      document.title = 'مُلم | تفاصيل المنحة';
    }
  }, [scholarship]);

  const shareScholarship = () => {
    if (!scholarship) return;
    const s = scholarship;
    let text = `🎓 ${s.name}\n`;
    if (s.name_en) text += `${s.name_en}\n`;
    text += `\n🌍 الدولة: ${s.country}`;
    text += `\n📚 المراحل: ${s.degree}`;
    if (s.language) text += `\n🗣️ لغة الدراسة: ${s.language}`;
    if (s.open_date) text += `\n📅 فتح التقديم: ${s.open_date}`;
    text += `\n⏰ آخر موعد: ${s.deadline}`;

    if (s.majors && s.majors.length) {
      text += `\n\n📚 التخصصات المتاحة:\n` + s.majors.map(m => `• ${m}`).join('\n');
    }

    if (s.benefits && s.benefits.length) {
      text += `\n\n🎁 المميزات:\n` + s.benefits.map(b => `• ${b}`).join('\n');
    }

    if (s.requirements && s.requirements.length) {
      text += `\n\n📌 الشروط:\n` + s.requirements.map(r => `• ${r}`).join('\n');
    }

    if (s.documents) {
      if (s.documents.required && s.documents.required.length) {
        text += `\n\n📎 الملفات الإجبارية:\n` + s.documents.required.map(d => `• ${d}`).join('\n');
      }
      if (s.documents.optional && s.documents.optional.length) {
        text += `\n\n🟡 الملفات الاختيارية:\n` + s.documents.optional.map(d => `• ${d}`).join('\n');
      }
    }

    if (s.notes) text += `\n\n📝 ملاحظات: ${s.notes}`;

    const cleanUrl = `${window.location.origin}/scholarship/${id}`;
    text += `\n\n🔗 ${cleanUrl}`;
    text += `\n\nعبر منصة مُلم للمنح الدراسية 🎓`;

    if (navigator.share) {
      navigator.share({
        title: `مُلم | ${s.name}`,
        text: text,
        url: cleanUrl
      }).catch(err => {
        console.error("Web Share API failed:", err);
      });
    } else {
      navigator.clipboard.writeText(cleanUrl)
        .then(() => {
          alert('تم نسخ رابط المنحة بنجاح');
        })
        .catch(err => {
          console.error("Clipboard API failed, trying fallback:", err);
          const el = document.createElement('textarea');
          el.value = cleanUrl;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          alert('تم نسخ رابط المنحة بنجاح');
        });
    }
  };

  return (
    <div id="scholarship-details" className="details-container">
        {loading ? (
          <p>جاري التحميل...</p>
        ) : !scholarship ? (
          <p>المنحة غير موجودة 😔</p>
        ) : (
          <>
            <div className="details-hero">
              {scholarship.flag && scholarship.flag.startsWith('http') ? (
                <img src={scholarship.flag} alt="flag" className="details-flag" />
              ) : (
                <span className="details-flag">{scholarship.flag || ''}</span>
              )}
              <h1>{scholarship.name}</h1>
              <p>{scholarship.name_en || ''}</p>
              <span className={`status ${scholarship.open ? 'open' : 'closed'}`}>
                {scholarship.open ? '✅ التقديم مفتوح' : '🔴 التقديم مغلق'}
              </span>
            </div>

            <div className="details-body">
              
              <div className="details-card">
                <h2>📋 معلومات عامة</h2>
                <p><strong>الدولة:</strong> {scholarship.country}</p>
                <p><strong>المراحل الدراسية:</strong> {scholarship.degree}</p>
                {scholarship.language && <p><strong>لغة الدراسة:</strong> {scholarship.language}</p>}
                {scholarship.open_date && <p><strong>موعد فتح التقديم:</strong> {scholarship.open_date}</p>}
                <p><strong>آخر موعد للتقديم:</strong> {scholarship.deadline}</p>
              </div>

              {scholarship.majors && scholarship.majors.length > 0 && (
                <div className="details-card">
                  <h2>📚 التخصصات المتاحة</h2>
                  <ul>
                    {scholarship.majors.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scholarship.benefits && scholarship.benefits.length > 0 && (
                <div className="details-card">
                  <h2>🎁 المميزات</h2>
                  <ul>
                    {scholarship.benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scholarship.requirements && scholarship.requirements.length > 0 && (
                <div className="details-card">
                  <h2>📌 الشروط والمتطلبات</h2>
                  <ul>
                    {scholarship.requirements.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scholarship.documents && (
                <div className="details-card">
                  <h2>📎 الملفات المطلوبة</h2>
                  {scholarship.documents.required && scholarship.documents.required.length > 0 && (
                    <>
                      <p><strong>🔴 إجباري:</strong></p>
                      <ul>
                        {scholarship.documents.required.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {scholarship.documents.optional && scholarship.documents.optional.length > 0 && (
                    <>
                      <p><strong>🟡 اختياري / يقوي ملفك:</strong></p>
                      <ul>
                        {scholarship.documents.optional.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {scholarship.notes && (
                <div className="details-card">
                  <h2>📝 تفاصيل إضافية</h2>
                  <p>{scholarship.notes}</p>
                </div>
              )}

              {scholarship.groupLink && scholarship.discussionLink && (
                <div className="btn-split">
                  <a href={scholarship.groupLink} target="_blank" rel="noreferrer" className="btn-main btn-split-half">
                    👥 قناة المنحة
                  </a>
                  <a href={scholarship.discussionLink} target="_blank" rel="noreferrer" className="btn-main btn-split-half">
                    💬 مناقشة المنحة 
                  </a>
                </div>
              )}

              {scholarship.link && (
                <a href={scholarship.link} target="_blank" rel="noreferrer" className="btn-main">
                  🌐 زيارة الموقع الرسمي للتقديم
                </a>
              )}

              <button onClick={shareScholarship} className="btn-main">
                📤 شارك تفاصيل المنحة
              </button>

              <Link to="/scholarships" className="btn-main">
                ← العودة لجميع المنح
              </Link>

            </div>
          </>
        )}
      </div>
  );
}

export default Scholarship;
