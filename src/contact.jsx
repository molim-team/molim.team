import React from 'react';

function Contact() {
  // مصفوفة تحتوي على بيانات منصات التواصل لتسهيل العرض والتعديل لاحقاً
  const socialPlatforms = [
    {
      name: 'تليجرام',
      handle: '@Molim_Team',
      link: 'https://t.me/Molim_Team',
      iconClass: 'fa-brands fa-telegram',
      className: 'telegram',
    },
    {
      name: 'تيك توك',
      handle: '@Molim_team',
      link: 'https://www.tiktok.com/@Molim_team',
      iconClass: 'fa-brands fa-tiktok',
      className: 'tiktok',
    },
    {
      name: 'يوتيوب',
      handle: '@Molim_team',
      link: 'https://www.youtube.com/@Molim_team',
      iconClass: 'fa-brands fa-youtube',
      className: 'youtube',
    },
    {
      name: 'انستقرام',
      handle: '@Molim_team',
      link: 'https://www.instagram.com/Molim_team',
      iconClass: 'fa-brands fa-instagram',
      className: 'instagram',
    },
    {
      name: 'تويتر / X',
      handle: '@Molim_team',
      link: 'https://www.x.com/Molim_team',
      iconClass: 'fa-brands fa-x-twitter',
      className: 'twitter',
    },
  ];

  return (
    <div className="contact-page flex flex-col min-h-screen justify-between !pt-0">
      <div>
        {/* عنوان الصفحة */}
        <section className="page-hero">
          <h1>📬 تواصل معنا</h1>
          <p>نحن هنا للمساعدة — تابعنا على منصاتنا</p>
        </section>

        {/* منصات التواصل */}
        <section className="contact-section flex flex-col gap-4 w-full max-w-2xl mx-auto py-5">
          {socialPlatforms.map((platform, index) => (
            <a
              key={index}
              href={platform.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`contact-card ${platform.className} py-5 w-full`}
            >
              <i className={`${platform.iconClass} contact-icon`}></i>
              <div>
                <h3>{platform.name}</h3>
                <p>{platform.handle}</p>
              </div>
            </a>
          ))}
        </section>
      </div>
    </div>
  );
}

export default Contact;